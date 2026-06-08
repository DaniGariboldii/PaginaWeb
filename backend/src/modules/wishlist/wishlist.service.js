import prisma from '../../config/prisma.js';
import { AppError } from '../../utils/AppError.js';

const PRODUCT_SELECT = {
  id: true, name: true, slug: true, price: true, discountPrice: true, stock: true, active: true,
  brand: { select: { name: true } },
  images: { select: { url: true, isPrimary: true }, orderBy: { isPrimary: 'desc' }, take: 1 },
};

export const getWishlist = async (userId) => {
  const items = await prisma.wishlistItem.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: { product: { select: PRODUCT_SELECT } },
  });
  // Solo productos activos; aplanar a la forma de ProductCard
  return items
    .filter((i) => i.product.active)
    .map((i) => ({ ...i.product, images: i.product.images }));
};

export const getWishlistIds = async (userId) => {
  const items = await prisma.wishlistItem.findMany({ where: { userId }, select: { productId: true } });
  return items.map((i) => i.productId);
};

export const addToWishlist = async (userId, productId) => {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.active) throw new AppError('Producto no disponible', 404);

  await prisma.wishlistItem.upsert({
    where: { userId_productId: { userId, productId } },
    update: {},
    create: { userId, productId },
  });
};

export const removeFromWishlist = async (userId, productId) => {
  await prisma.wishlistItem.deleteMany({ where: { userId, productId } });
};
