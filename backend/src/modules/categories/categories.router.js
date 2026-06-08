import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import {
  listCategories, addCategory, editCategory, removeCategory,
  listBrands, addBrand, editBrand, removeBrand,
} from './categories.controller.js';

const router = Router();

// Categorías
router.get('/', listCategories);
router.post('/', authenticate, authorize('ADMIN'), addCategory);
router.put('/:id', authenticate, authorize('ADMIN'), editCategory);
router.delete('/:id', authenticate, authorize('ADMIN'), removeCategory);

// Marcas (mismo router, sub-path)
router.get('/brands', listBrands);
router.post('/brands', authenticate, authorize('ADMIN'), addBrand);
router.put('/brands/:id', authenticate, authorize('ADMIN'), editBrand);
router.delete('/brands/:id', authenticate, authorize('ADMIN'), removeBrand);

export default router;
