import prisma from '../../config/prisma.js';
import { AppError } from '../../utils/AppError.js';
import { uniqueSlug } from '../../utils/slug.js';

const PUBLIC_SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
  price: true,
  discountPrice: true,
  stock: true,
  active: true,
  featured: true,
  createdAt: true,
  category: { select: { id: true, name: true, slug: true } },
  brand: { select: { id: true, name: true } },
  images: { select: { id: true, url: true, isPrimary: true }, orderBy: { isPrimary: 'desc' } },
};

/** Adjunta { rating, reviewCount } a una lista de productos mediante un groupBy */
const attachRatings = async (products) => {
  if (products.length === 0) return products;
  const ids = products.map((p) => p.id);
  const grouped = await prisma.review.groupBy({
    by: ['productId'],
    where: { productId: { in: ids } },
    _avg: { rating: true },
    _count: { _all: true },
  });
  const map = Object.fromEntries(
    grouped.map((g) => [g.productId, { rating: Math.round((g._avg.rating ?? 0) * 10) / 10, reviewCount: g._count._all }])
  );
  return products.map((p) => ({ ...p, ...(map[p.id] ?? { rating: 0, reviewCount: 0 }) }));
};

const SORT_MAP = {
  relevance: [{ featured: 'desc' }, { createdAt: 'desc' }],
  price_asc: [{ price: 'asc' }],
  price_desc: [{ price: 'desc' }],
  newest: [{ createdAt: 'desc' }],
  name_asc: [{ name: 'asc' }],
};

export const listProducts = async (query, isAdmin = false) => {
  const { page, limit, search, categoryId, brandId, featured, minPrice, maxPrice, inStock, sort } = query;

  const where = {};

  // Los visitantes y clientes solo ven productos activos
  if (!isAdmin) where.active = true;

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (categoryId) where.categoryId = categoryId;
  if (brandId) where.brandId = brandId;
  if (featured === 'true') where.featured = true;
  if (inStock === 'true') where.stock = { gt: 0 };
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) where.price.gte = minPrice;
    if (maxPrice !== undefined) where.price.lte = maxPrice;
  }

  const skip = (page - 1) * limit;
  const [total, products] = await prisma.$transaction([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: SORT_MAP[sort] ?? SORT_MAP.relevance,
      select: PUBLIC_SELECT,
    }),
  ]);

  return { products: await attachRatings(products), pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

const withRating = async (product) => {
  const agg = await prisma.review.aggregate({
    where: { productId: product.id },
    _avg: { rating: true },
    _count: { _all: true },
  });
  return { ...product, rating: Math.round((agg._avg.rating ?? 0) * 10) / 10, reviewCount: agg._count._all };
};

export const getProductById = async (id, isAdmin = false) => {
  const product = await prisma.product.findUnique({ where: { id }, select: PUBLIC_SELECT });
  if (!product) throw new AppError('Producto no encontrado', 404);
  if (!isAdmin && !product.active) throw new AppError('Producto no disponible', 404);
  return withRating(product);
};

export const getProductBySlug = async (slug) => {
  const product = await prisma.product.findUnique({ where: { slug }, select: PUBLIC_SELECT });
  if (!product || !product.active) throw new AppError('Producto no encontrado', 404);
  return withRating(product);
};

/** Productos relacionados: misma categoría, activos, excluyendo el actual */
export const getRelatedProducts = async (productId, limit = 4) => {
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { categoryId: true } });
  if (!product) return [];

  const related = await prisma.product.findMany({
    where: { categoryId: product.categoryId, active: true, id: { not: productId } },
    take: limit,
    orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
    select: PUBLIC_SELECT,
  });
  return attachRatings(related);
};

export const createProduct = async (data) => {
  const { name, description, price, discountPrice, stock, categoryId, brandId, featured, active } = data;

  // Verificar que la categoría exista
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) throw new AppError('Categoría no encontrada', 404);

  // Verificar que la marca exista si se provee
  if (brandId) {
    const brand = await prisma.brand.findUnique({ where: { id: brandId } });
    if (!brand) throw new AppError('Marca no encontrada', 404);
  }

  const slug = await uniqueSlug(name, async (s) => !!(await prisma.product.findUnique({ where: { slug: s } })));

  return prisma.product.create({
    data: { name, slug, description, price, discountPrice, stock, categoryId, brandId, featured, active },
    select: PUBLIC_SELECT,
  });
};

export const updateProduct = async (id, data) => {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new AppError('Producto no encontrado', 404);

  let slug = product.slug;
  if (data.name && data.name !== product.name) {
    slug = await uniqueSlug(data.name, async (s) => {
      const found = await prisma.product.findUnique({ where: { slug: s } });
      return found && found.id !== id;
    });
  }

  return prisma.product.update({
    where: { id },
    data: { ...data, slug },
    select: PUBLIC_SELECT,
  });
};

/**
 * Baja lógica: desactiva el producto en lugar de eliminarlo físicamente.
 * Si no tiene ventas, lo elimina físicamente.
 */
export const deleteProduct = async (id) => {
  const product = await prisma.product.findUnique({
    where: { id },
    include: { _count: { select: { orderItems: true } } },
  });
  if (!product) throw new AppError('Producto no encontrado', 404);

  if (product._count.orderItems > 0) {
    // Tiene ventas → baja lógica
    await prisma.product.update({ where: { id }, data: { active: false } });
    return { deleted: false, message: 'Producto desactivado (tiene ventas asociadas)' };
  }

  await prisma.product.delete({ where: { id } });
  return { deleted: true, message: 'Producto eliminado' };
};
