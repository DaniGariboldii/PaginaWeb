import * as catService from './categories.service.js';
import { createCategorySchema, updateCategorySchema, createBrandSchema, updateBrandSchema } from '../../validators/category.validator.js';
import { sendSuccess } from '../../utils/response.js';

// ─── Categorías ───────────────────────────────────────────────────────────────

export const listCategories = async (req, res, next) => {
  try {
    const onlyActive = req.user?.role !== 'ADMIN';
    const categories = await catService.getAllCategories(onlyActive);
    sendSuccess(res, { categories });
  } catch (err) { next(err); }
};

export const addCategory = async (req, res, next) => {
  try {
    const data = createCategorySchema.parse(req.body);
    const category = await catService.createCategory(data);
    sendSuccess(res, { category }, 'Categoría creada', 201);
  } catch (err) { next(err); }
};

export const editCategory = async (req, res, next) => {
  try {
    const data = updateCategorySchema.parse(req.body);
    const category = await catService.updateCategory(req.params.id, data);
    sendSuccess(res, { category }, 'Categoría actualizada');
  } catch (err) { next(err); }
};

export const removeCategory = async (req, res, next) => {
  try {
    await catService.deleteCategory(req.params.id);
    sendSuccess(res, null, 'Categoría eliminada');
  } catch (err) { next(err); }
};

// ─── Marcas ───────────────────────────────────────────────────────────────────

export const listBrands = async (req, res, next) => {
  try {
    const onlyActive = req.user?.role !== 'ADMIN';
    const brands = await catService.getAllBrands(onlyActive);
    sendSuccess(res, { brands });
  } catch (err) { next(err); }
};

export const addBrand = async (req, res, next) => {
  try {
    const data = createBrandSchema.parse(req.body);
    const brand = await catService.createBrand(data);
    sendSuccess(res, { brand }, 'Marca creada', 201);
  } catch (err) { next(err); }
};

export const editBrand = async (req, res, next) => {
  try {
    const data = updateBrandSchema.parse(req.body);
    const brand = await catService.updateBrand(req.params.id, data);
    sendSuccess(res, { brand }, 'Marca actualizada');
  } catch (err) { next(err); }
};

export const removeBrand = async (req, res, next) => {
  try {
    await catService.deleteBrand(req.params.id);
    sendSuccess(res, null, 'Marca eliminada');
  } catch (err) { next(err); }
};
