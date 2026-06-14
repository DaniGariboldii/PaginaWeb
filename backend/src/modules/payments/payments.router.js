import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import {
  createPreference, webhook, simulate, status, mode, confirm,
  createGuestPreference, guestConfirm, guestSimulate,
} from './payments.controller.js';

const router = Router();

// Webhook público (lo llama Mercado Pago) — el body raw se parsea en app.js
router.post('/webhook', webhook);
// Modo de pago (simulado o real) — público, sin datos sensibles
router.get('/mode', mode);

// Pagos de invitado (públicos: operan por orderId de un pedido sin cuenta)
router.post('/guest/create-preference', createGuestPreference);
router.post('/guest/confirm', guestConfirm);
router.post('/guest/simulate', guestSimulate);

// Endpoints autenticados
router.use(authenticate);
router.post('/create-preference', createPreference);
router.post('/confirm', confirm); // verifica el pago al volver del checkout (fallback del webhook)
router.post('/simulate', simulate); // solo útil en desarrollo (sin credenciales MP)
router.get('/:id/status', status);

export default router;
