import * as wishlistService from './wishlist.service.js';
import { sendSuccess } from '../../utils/response.js';

export const getWishlist = async (req, res, next) => {
  try {
    const products = await wishlistService.getWishlist(req.user.id);
    sendSuccess(res, { products });
  } catch (err) { next(err); }
};

export const getWishlistIds = async (req, res, next) => {
  try {
    const ids = await wishlistService.getWishlistIds(req.user.id);
    sendSuccess(res, { ids });
  } catch (err) { next(err); }
};

export const addItem = async (req, res, next) => {
  try {
    await wishlistService.addToWishlist(req.user.id, req.params.productId);
    sendSuccess(res, null, 'Agregado a favoritos', 201);
  } catch (err) { next(err); }
};

export const removeItem = async (req, res, next) => {
  try {
    await wishlistService.removeFromWishlist(req.user.id, req.params.productId);
    sendSuccess(res, null, 'Quitado de favoritos');
  } catch (err) { next(err); }
};
