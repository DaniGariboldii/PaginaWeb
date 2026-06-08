import * as orderService from './orders.service.js';
import { createOrderSchema, updateOrderStatusSchema, orderQuerySchema } from '../../validators/order.validator.js';
import { sendSuccess } from '../../utils/response.js';

export const createOrder = async (req, res, next) => {
  try {
    const { addressId, couponCode } = createOrderSchema.parse(req.body);
    const order = await orderService.createOrderFromCart(req.user.id, addressId, couponCode);
    sendSuccess(res, { order }, 'Pedido creado', 201);
  } catch (err) { next(err); }
};

export const myOrders = async (req, res, next) => {
  try {
    const query = orderQuerySchema.parse(req.query);
    const result = await orderService.getMyOrders(req.user.id, query);
    sendSuccess(res, result);
  } catch (err) { next(err); }
};

export const getOrder = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'ADMIN';
    const order = await orderService.getOrderById(req.user.id, req.params.id, isAdmin);
    sendSuccess(res, { order });
  } catch (err) { next(err); }
};

export const cancelOrder = async (req, res, next) => {
  try {
    const order = await orderService.cancelOwnOrder(req.user.id, req.params.id);
    sendSuccess(res, { order }, 'Pedido cancelado');
  } catch (err) { next(err); }
};

// ─── Admin ──────────────────────────────────────────────────────────────────

export const listAllOrders = async (req, res, next) => {
  try {
    const query = orderQuerySchema.parse(req.query);
    const result = await orderService.getAllOrders(query);
    sendSuccess(res, result);
  } catch (err) { next(err); }
};

export const changeOrderStatus = async (req, res, next) => {
  try {
    const { status } = updateOrderStatusSchema.parse(req.body);
    const order = await orderService.updateOrderStatus(req.params.id, status);
    sendSuccess(res, { order }, 'Estado actualizado');
  } catch (err) { next(err); }
};
