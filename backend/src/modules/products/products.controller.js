import * as productService from './products.service.js';
import {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
} from '../../validators/product.validator.js';
import { sendSuccess } from '../../utils/response.js';

export const listProducts = async (req, res, next) => {
  try {
    const query = productQuerySchema.parse(req.query);
    const isAdmin = req.user?.role === 'ADMIN';
    const result = await productService.listProducts(query, isAdmin);
    sendSuccess(res, result);
  } catch (err) { next(err); }
};

export const getProduct = async (req, res, next) => {
  try {
    const isAdmin = req.user?.role === 'ADMIN';
    const product = await productService.getProductById(req.params.id, isAdmin);
    sendSuccess(res, { product });
  } catch (err) { next(err); }
};

export const getProductBySlug = async (req, res, next) => {
  try {
    const product = await productService.getProductBySlug(req.params.slug);
    sendSuccess(res, { product });
  } catch (err) { next(err); }
};

export const getRelated = async (req, res, next) => {
  try {
    const products = await productService.getRelatedProducts(req.params.id);
    sendSuccess(res, { products });
  } catch (err) { next(err); }
};

export const createProduct = async (req, res, next) => {
  try {
    const data = createProductSchema.parse(req.body);
    const product = await productService.createProduct(data);
    sendSuccess(res, { product }, 'Producto creado', 201);
  } catch (err) { next(err); }
};

export const updateProduct = async (req, res, next) => {
  try {
    const data = updateProductSchema.parse(req.body);
    const product = await productService.updateProduct(req.params.id, data);
    sendSuccess(res, { product }, 'Producto actualizado');
  } catch (err) { next(err); }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const result = await productService.deleteProduct(req.params.id);
    sendSuccess(res, null, result.message);
  } catch (err) { next(err); }
};
