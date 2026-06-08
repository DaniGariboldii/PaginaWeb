import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { createOrder, myOrders, getOrder, cancelOrder } from './orders.controller.js';

const router = Router();

router.use(authenticate);

router.post('/', createOrder);
router.get('/my', myOrders);
router.get('/:id', getOrder);
router.post('/:id/cancel', cancelOrder);

export default router;
