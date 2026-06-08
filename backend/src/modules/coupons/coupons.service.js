import prisma from '../../config/prisma.js';
import { AppError } from '../../utils/AppError.js';

/** Calcula el descuento (entero, en pesos) que aplica un cupón sobre un subtotal */
export const computeDiscount = (coupon, subtotal) => {
  let discount = coupon.type === 'PERCENTAGE'
    ? (subtotal * Number(coupon.value)) / 100
    : Number(coupon.value);
  discount = Math.min(discount, subtotal); // nunca mayor al subtotal
  return Math.round(discount);
};

/**
 * Valida un cupón contra un subtotal. Devuelve { coupon, discount }.
 * Lanza AppError si no es aplicable.
 */
export const validateCoupon = async (code, subtotal) => {
  if (!code) throw new AppError('Ingresá un código', 400);
  const coupon = await prisma.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });

  if (!coupon || !coupon.active) throw new AppError('Cupón inválido', 404);
  if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new AppError('El cupón expiró', 400);
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    throw new AppError('El cupón alcanzó su límite de usos', 400);
  }
  if (coupon.minPurchase && subtotal < Number(coupon.minPurchase)) {
    throw new AppError(`Requiere una compra mínima de $${Number(coupon.minPurchase)}`, 400);
  }

  return { coupon, discount: computeDiscount(coupon, subtotal) };
};

// ─── Admin CRUD ───────────────────────────────────────────────────────────────

export const listCoupons = () => prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });

export const createCoupon = async (data) => {
  const code = data.code.trim().toUpperCase();
  const exists = await prisma.coupon.findUnique({ where: { code } });
  if (exists) throw new AppError('Ya existe un cupón con ese código', 409);
  return prisma.coupon.create({ data: { ...data, code } });
};

export const updateCoupon = async (id, data) => {
  const coupon = await prisma.coupon.findUnique({ where: { id } });
  if (!coupon) throw new AppError('Cupón no encontrado', 404);
  const patch = { ...data };
  if (patch.code) patch.code = patch.code.trim().toUpperCase();
  return prisma.coupon.update({ where: { id }, data: patch });
};

export const deleteCoupon = async (id) => {
  const coupon = await prisma.coupon.findUnique({ where: { id } });
  if (!coupon) throw new AppError('Cupón no encontrado', 404);
  await prisma.coupon.delete({ where: { id } });
};
