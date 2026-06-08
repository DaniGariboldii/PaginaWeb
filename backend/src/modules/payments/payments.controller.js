import * as paymentService from './payments.service.js';
import { sendSuccess } from '../../utils/response.js';
import { z } from 'zod';

const createPrefSchema = z.object({ orderId: z.string().uuid('Pedido inválido') });
const simulateSchema = z.object({
  orderId: z.string().uuid('Pedido inválido'),
  outcome: z.enum(['approved', 'rejected']).default('approved'),
});

export const createPreference = async (req, res, next) => {
  try {
    const { orderId } = createPrefSchema.parse(req.body);
    const result = await paymentService.createPreference(req.user.id, orderId);
    sendSuccess(res, result, 'Preferencia creada');
  } catch (err) { next(err); }
};

/**
 * Webhook de Mercado Pago. Siempre responde 200 rápido para que MP no reintente
 * en exceso; el procesamiento es idempotente.
 */
export const webhook = async (req, res) => {
  try {
    // Validar firma (si hay MP_WEBHOOK_SECRET configurado)
    const valid = paymentService.verifyWebhookSignature({
      signature: req.headers['x-signature'],
      requestId: req.headers['x-request-id'],
      dataId: req.query['data.id'] || req.query.id,
    });
    if (!valid) {
      console.warn('[WEBHOOK] Firma inválida, notificación rechazada');
      return res.status(401).json({ received: false });
    }

    let payload = req.body;
    // El body llega como Buffer (express.raw); parsear si corresponde
    if (Buffer.isBuffer(payload)) {
      try { payload = JSON.parse(payload.toString() || '{}'); } catch { payload = {}; }
    }
    // MP también puede mandar datos por query string
    const merged = { ...req.query, ...payload };
    await paymentService.processWebhook(merged);
    res.status(200).json({ received: true });
  } catch (err) {
    // No exponer el error a MP; loguear internamente
    console.error('[WEBHOOK] Error procesando notificación:', err.message);
    res.status(200).json({ received: true });
  }
};

export const simulate = async (req, res, next) => {
  try {
    const { orderId, outcome } = simulateSchema.parse(req.body);
    const result = await paymentService.simulatePayment(req.user.id, orderId, outcome);
    sendSuccess(res, result, outcome === 'approved' ? 'Pago aprobado (simulado)' : 'Pago rechazado (simulado)');
  } catch (err) { next(err); }
};

export const status = async (req, res, next) => {
  try {
    const result = await paymentService.getPaymentStatus(req.user.id, req.params.id);
    sendSuccess(res, result);
  } catch (err) { next(err); }
};
