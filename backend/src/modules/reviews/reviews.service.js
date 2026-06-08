import prisma from '../../config/prisma.js';
import { AppError } from '../../utils/AppError.js';

// Estados en los que un pedido cuenta como compra concretada
const PURCHASED_STATUSES = ['PAID', 'PREPARING', 'SHIPPED', 'DELIVERED'];

/** True si el usuario compró el producto (tiene un pedido pago con ese ítem) */
export const hasPurchased = async (userId, productId) => {
  const count = await prisma.orderItem.count({
    where: { productId, order: { is: { userId, status: { in: PURCHASED_STATUSES } } } },
  });
  return count > 0;
};

/** Lista las reseñas de un producto + resumen (promedio, total y distribución) */
export const getProductReviews = async (productId) => {
  const [reviews, agg, distRaw] = await prisma.$transaction([
    prisma.review.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { firstName: true, lastName: true } } },
    }),
    prisma.review.aggregate({ where: { productId }, _avg: { rating: true }, _count: { _all: true } }),
    prisma.review.groupBy({ by: ['rating'], where: { productId }, _count: { _all: true } }),
  ]);

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const d of distRaw) distribution[d.rating] = d._count._all;

  return {
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      author: r.user ? `${r.user.firstName} ${r.user.lastName.charAt(0)}.` : 'Usuario',
    })),
    summary: {
      average: Math.round((agg._avg.rating ?? 0) * 10) / 10,
      total: agg._count._all,
      distribution,
    },
  };
};

/** Crea o actualiza la reseña del usuario (solo si compró el producto) */
export const upsertReview = async (userId, productId, { rating, comment }) => {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new AppError('Producto no encontrado', 404);

  const purchased = await hasPurchased(userId, productId);
  if (!purchased) throw new AppError('Solo podés reseñar productos que compraste', 403);

  return prisma.review.upsert({
    where: { productId_userId: { productId, userId } },
    update: { rating, comment: comment ?? null },
    create: { productId, userId, rating, comment: comment ?? null },
  });
};

/** Elimina la reseña propia */
export const deleteReview = async (userId, productId) => {
  const review = await prisma.review.findUnique({
    where: { productId_userId: { productId, userId } },
  });
  if (!review) throw new AppError('No tenés una reseña en este producto', 404);
  await prisma.review.delete({ where: { id: review.id } });
};
