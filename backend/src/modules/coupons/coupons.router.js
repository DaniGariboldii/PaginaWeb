import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { validate, list, create, update, remove } from './coupons.controller.js';

const router = Router();

// Cliente autenticado: validar un cupón antes de finalizar la compra
router.post('/validate', authenticate, validate);

// Admin
router.get('/', authenticate, authorize('ADMIN'), list);
router.post('/', authenticate, authorize('ADMIN'), create);
router.put('/:id', authenticate, authorize('ADMIN'), update);
router.delete('/:id', authenticate, authorize('ADMIN'), remove);

export default router;
