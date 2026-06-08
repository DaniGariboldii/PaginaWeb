import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { createPreference, webhook, simulate, status } from './payments.controller.js';

const router = Router();

// Webhook público (lo llama Mercado Pago) — el body raw se parsea en app.js
router.post('/webhook', webhook);

// Endpoints autenticados
router.use(authenticate);
router.post('/create-preference', createPreference);
router.post('/simulate', simulate); // solo útil en desarrollo (sin credenciales MP)
router.get('/:id/status', status);

export default router;
