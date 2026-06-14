import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { createOrder, createGuestOrder, getGuestOrder, myOrders, getOrder, cancelOrder } from './orders.controller.js';

const router = Router();

// ─── Públicas (checkout como invitado) ────────────────────────────────────────
router.post('/guest', createGuestOrder);
router.get('/guest/:id', getGuestOrder);

// ─── Autenticadas ─────────────────────────────────────────────────────────────
router.use(authenticate);

router.post('/', createOrder);
router.get('/my', myOrders);
router.get('/:id', getOrder);
router.post('/:id/cancel', cancelOrder);

export default router;
