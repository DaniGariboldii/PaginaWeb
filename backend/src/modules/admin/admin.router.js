import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { listAllOrders, changeOrderStatus } from '../orders/orders.controller.js';
import {
  dashboard,
  listUsers,
  changeUserStatus,
  stockOverview,
  adjustStock,
  stockMovements,
  salesReport,
  stockReport,
} from './admin.controller.js';

const router = Router();

router.use(authenticate, authorize('ADMIN'));

// Dashboard
router.get('/dashboard', dashboard);

// Pedidos (Fase 4)
router.get('/orders', listAllOrders);
router.put('/orders/:id/status', changeOrderStatus);

// Usuarios (Fase 5)
router.get('/users', listUsers);
router.put('/users/:id/status', changeUserStatus);

// Stock (Fase 5)
router.get('/stock', stockOverview);
router.put('/stock/:id', adjustStock);
router.get('/stock-movements', stockMovements);

// Reportes (Fase 5)
router.get('/reports/sales', salesReport);
router.get('/reports/stock', stockReport);

export default router;
