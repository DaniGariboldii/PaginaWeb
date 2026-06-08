import * as cartService from './cart.service.js';
import { addItemSchema, updateItemSchema } from '../../validators/cart.validator.js';
import { sendSuccess } from '../../utils/response.js';

export const getCart = async (req, res, next) => {
  try {
    const cart = await cartService.getCart(req.user.id);
    sendSuccess(res, { cart });
  } catch (err) { next(err); }
};

export const addItem = async (req, res, next) => {
  try {
    const data = addItemSchema.parse(req.body);
    const cart = await cartService.addItem(req.user.id, data);
    sendSuccess(res, { cart }, 'Producto agregado al carrito', 201);
  } catch (err) { next(err); }
};

export const updateItem = async (req, res, next) => {
  try {
    const { quantity } = updateItemSchema.parse(req.body);
    const cart = await cartService.updateItem(req.user.id, req.params.id, quantity);
    sendSuccess(res, { cart }, 'Cantidad actualizada');
  } catch (err) { next(err); }
};

export const removeItem = async (req, res, next) => {
  try {
    const cart = await cartService.removeItem(req.user.id, req.params.id);
    sendSuccess(res, { cart }, 'Producto eliminado del carrito');
  } catch (err) { next(err); }
};

export const clearCart = async (req, res, next) => {
  try {
    const cart = await cartService.clearCart(req.user.id);
    sendSuccess(res, { cart }, 'Carrito vaciado');
  } catch (err) { next(err); }
};
