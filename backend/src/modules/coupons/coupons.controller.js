import * as couponService from './coupons.service.js';
import { validateCouponSchema, createCouponSchema, updateCouponSchema } from '../../validators/coupon.validator.js';
import { sendSuccess } from '../../utils/response.js';

// Cliente: previsualizar el descuento de un cupón
export const validate = async (req, res, next) => {
  try {
    const { code, subtotal } = validateCouponSchema.parse(req.body);
    const { coupon, discount } = await couponService.validateCoupon(code, subtotal);
    sendSuccess(res, { code: coupon.code, type: coupon.type, value: Number(coupon.value), discount }, 'Cupón aplicado');
  } catch (err) { next(err); }
};

// ── Admin ──
export const list = async (req, res, next) => {
  try {
    const coupons = await couponService.listCoupons();
    sendSuccess(res, { coupons });
  } catch (err) { next(err); }
};

export const create = async (req, res, next) => {
  try {
    const data = createCouponSchema.parse(req.body);
    const coupon = await couponService.createCoupon(data);
    sendSuccess(res, { coupon }, 'Cupón creado', 201);
  } catch (err) { next(err); }
};

export const update = async (req, res, next) => {
  try {
    const data = updateCouponSchema.parse(req.body);
    const coupon = await couponService.updateCoupon(req.params.id, data);
    sendSuccess(res, { coupon }, 'Cupón actualizado');
  } catch (err) { next(err); }
};

export const remove = async (req, res, next) => {
  try {
    await couponService.deleteCoupon(req.params.id);
    sendSuccess(res, null, 'Cupón eliminado');
  } catch (err) { next(err); }
};
