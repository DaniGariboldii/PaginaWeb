import prisma from '../../config/prisma.js';
import { AppError } from '../../utils/AppError.js';
import { uniqueSlug } from '../../utils/slug.js';

// ─── Categorías ───────────────────────────────────────────────────────────────

export const getAllCategories = async (onlyActive = false) => {
  return prisma.category.findMany({
    where: onlyActive ? { active: true } : {},
    orderBy: { name: 'asc' },
  });
};

export const createCategory = async ({ name, description, active }) => {
  const slug = await uniqueSlug(name, async (s) => !!(await prisma.category.findUnique({ where: { slug: s } })));

  return prisma.category.create({ data: { name, slug, description, active } });
};

export const updateCategory = async (id, data) => {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw new AppError('Categoría no encontrada', 404);

  let slug = category.slug;
  if (data.name && data.name !== category.name) {
    slug = await uniqueSlug(data.name, async (s) => {
      const found = await prisma.category.findUnique({ where: { slug: s } });
      return found && found.id !== id;
    });
  }

  return prisma.category.update({ where: { id }, data: { ...data, slug } });
};

export const deleteCategory = async (id) => {
  const category = await prisma.category.findUnique({ where: { id }, include: { _count: { select: { products: true } } } });
  if (!category) throw new AppError('Categoría no encontrada', 404);
  if (category._count.products > 0) throw new AppError('No se puede eliminar: tiene productos asociados', 409);

  return prisma.category.delete({ where: { id } });
};

// ─── Marcas ───────────────────────────────────────────────────────────────────

export const getAllBrands = async (onlyActive = false) => {
  return prisma.brand.findMany({
    where: onlyActive ? { active: true } : {},
    orderBy: { name: 'asc' },
  });
};

export const createBrand = async ({ name, active }) => {
  const existing = await prisma.brand.findUnique({ where: { name } });
  if (existing) throw new AppError('La marca ya existe', 409);
  return prisma.brand.create({ data: { name, active } });
};

export const updateBrand = async (id, data) => {
  const brand = await prisma.brand.findUnique({ where: { id } });
  if (!brand) throw new AppError('Marca no encontrada', 404);
  return prisma.brand.update({ where: { id }, data });
};

export const deleteBrand = async (id) => {
  const brand = await prisma.brand.findUnique({ where: { id }, include: { _count: { select: { products: true } } } });
  if (!brand) throw new AppError('Marca no encontrada', 404);
  if (brand._count.products > 0) throw new AppError('No se puede eliminar: tiene productos asociados', 409);
  return prisma.brand.delete({ where: { id } });
};
