import prisma from '../../config/prisma.js';
import { AppError } from '../../utils/AppError.js';
import { LOW_STOCK_THRESHOLD } from './dashboard.service.js';

/** Listado de productos con su stock actual (para el panel de control de stock) */
export const getStockOverview = async ({ search, lowOnly }) => {
  const where = {
    ...(search && { name: { contains: search, mode: 'insensitive' } }),
    ...(lowOnly && { stock: { lte: LOW_STOCK_THRESHOLD } }),
  };

  const products = await prisma.product.findMany({
    where,
    orderBy: { stock: 'asc' },
    select: {
      id: true, name: true, stock: true, active: true,
      category: { select: { name: true } },
    },
  });

  return { products, threshold: LOW_STOCK_THRESHOLD };
};

/**
 * Ajusta el stock de un producto a un valor absoluto.
 * Registra el movimiento como ADJUSTMENT con la diferencia (delta).
 */
export const adjustStock = async (productId, newStock, reason) => {
  if (newStock < 0) throw new AppError('El stock no puede ser negativo', 400);

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new AppError('Producto no encontrado', 404);

  const delta = newStock - product.stock;
  if (delta === 0) return product;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.product.update({
      where: { id: productId },
      data: { stock: newStock },
    });
    await tx.stockMovement.create({
      data: {
        productId,
        type: 'ADJUSTMENT',
        quantity: delta,
        reason: reason || `Ajuste manual (${delta > 0 ? '+' : ''}${delta})`,
      },
    });
    return updated;
  });
};

/** Historial de movimientos de stock (global o por producto) */
export const getStockMovements = async ({ productId, limit }) => {
  return prisma.stockMovement.findMany({
    where: productId ? { productId } : {},
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: { product: { select: { name: true } } },
  });
};
