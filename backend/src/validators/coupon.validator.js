import { z } from 'zod';

export const validateCouponSchema = z.object({
  code: z.string().min(1, 'Código requerido'),
  subtotal: z.coerce.number().min(0),
});

const couponBase = z.object({
  code: z.string().min(3, 'Mínimo 3 caracteres').max(30),
  type: z.enum(['PERCENTAGE', 'FIXED']),
  value: z.coerce.number().positive('El valor debe ser positivo'),
  minPurchase: z.coerce.number().min(0).optional().nullable(),
  maxUses: z.coerce.number().int().positive().optional().nullable(),
  active: z.boolean().default(true),
  expiresAt: z.coerce.date().optional().nullable(),
});

const percentageGuard = (d) => d.type !== 'PERCENTAGE' || d.value == null || d.value <= 100;
const guardMsg = { message: 'Un porcentaje no puede superar 100', path: ['value'] };

export const createCouponSchema = couponBase.refine(percentageGuard, guardMsg);
export const updateCouponSchema = couponBase.partial().refine(percentageGuard, guardMsg);
