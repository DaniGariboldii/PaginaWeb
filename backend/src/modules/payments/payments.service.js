import crypto from 'node:crypto';
import prisma from '../../config/prisma.js';
import { AppError } from '../../utils/AppError.js';
import { env } from '../../config/env.js';
import { isMercadoPagoConfigured, getMercadoPagoClient } from '../../config/mercadopago.js';
import { sendMail } from '../../config/mailer.js';

/**
 * Valida la firma del webhook de Mercado Pago (header x-signature).
 * Manifest: `id:{dataId};request-id:{requestId};ts:{ts};` → HMAC-SHA256 con el secret.
 * Si no hay secret configurado, no se valida (se asume entorno de prueba).
 */
export const verifyWebhookSignature = ({ signature, requestId, dataId }) => {
  if (!env.mercadoPago.webhookSecret) return true; // sin secret no se exige
  if (!signature) return false;

  // x-signature: "ts=1700000000,v1=abc123..."
  const parts = Object.fromEntries(
    signature.split(',').map((p) => p.split('=').map((s) => s.trim()))
  );
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;

  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const expected = crypto
    .createHmac('sha256', env.mercadoPago.webhookSecret)
    .update(manifest)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1));
  } catch {
    return false;
  }
};

/**
 * Crea una preferencia de pago para un pedido.
 * - Con credenciales reales: crea la preferencia en Mercado Pago (Checkout Pro).
 * - Sin credenciales (desarrollo): devuelve modo simulado para poder probar el flujo.
 */
export const createPreference = async (userId, orderId) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, payment: true },
  });

  if (!order || order.userId !== userId) throw new AppError('Pedido no encontrado', 404);
  if (order.status !== 'PENDING_PAYMENT') throw new AppError('El pedido no está pendiente de pago', 409);

  // ── Modo real ──────────────────────────────────────────────────────────────
  if (isMercadoPagoConfigured()) {
    const { preference } = await getMercadoPagoClient();
    // Si hay descuento por cupón, enviamos un único ítem-resumen con el total real
    // (Mercado Pago no admite ítems con monto negativo). El total ya incluye el envío.
    let items;
    if (Number(order.discount) > 0) {
      items = [{
        id: order.id,
        title: `Pedido #${order.id.slice(0, 8)} (con descuento)`,
        quantity: 1,
        unit_price: Number(order.total),
        currency_id: 'ARS',
      }];
    } else {
      items = order.items.map((i) => ({
        id: i.productId ?? i.id,
        title: i.productName,
        quantity: i.quantity,
        unit_price: Number(i.unitPrice),
        currency_id: 'ARS',
      }));
      // Sumar el envío como un ítem más (positivo) cuando corresponde
      if (Number(order.shippingCost) > 0) {
        items.push({ id: 'shipping', title: 'Envío', quantity: 1, unit_price: Number(order.shippingCost), currency_id: 'ARS' });
      }
    }

    const result = await preference.create({
      body: {
        items,
        external_reference: order.id, // MP lo devuelve en el webhook y en las back_urls
        metadata: { order_id: order.id },
        statement_descriptor: 'MITIENDA',
        back_urls: {
          success: env.mercadoPago.successUrl,
          failure: env.mercadoPago.failureUrl,
          pending: env.mercadoPago.pendingUrl,
        },
        auto_return: 'approved',
        notification_url: `${env.backendUrl}/api/payments/webhook`,
      },
    });

    await prisma.payment.update({
      where: { orderId: order.id },
      data: { providerPaymentId: String(result.id) },
    });

    return { simulated: false, preferenceId: result.id, initPoint: result.init_point };
  }

  // ── Modo simulado (sin credenciales) ─────────────────────────────────────────
  return {
    simulated: true,
    orderId: order.id,
    amount: Number(order.total),
    message: 'Mercado Pago no está configurado. Usá el flujo de simulación para probar el pago.',
  };
};

/**
 * Aprueba el pago de un pedido de forma IDEMPOTENTE.
 * - El "claim" por updateMany asegura que solo se procese una vez aunque lleguen
 *   webhooks duplicados (no duplica el pago).
 * - El stock NO se toca acá: ya fue reservado al crear el pedido (checkout).
 *   Aprobar el pago solo confirma la venta de esa reserva.
 */
export const approveOrderPayment = async (orderId, { providerPaymentId = null, rawResponse = null } = {}) => {
  const result = await prisma.$transaction(async (tx) => {
    // Idempotencia: solo gana quien encuentra el pedido en PENDING_PAYMENT
    const claim = await tx.order.updateMany({
      where: { id: orderId, status: 'PENDING_PAYMENT' },
      data: { status: 'PAID' },
    });

    if (claim.count === 0) {
      return { applied: false, reason: 'Ya procesado o no pendiente' };
    }

    await tx.payment.update({
      where: { orderId },
      data: { status: 'APPROVED', ...(providerPaymentId && { providerPaymentId }), rawResponse },
    });

    return { applied: true };
  });

  // Email de confirmación fuera de la transacción (no bloquea ni rompe el flujo)
  if (result.applied) {
    sendOrderConfirmationEmail(orderId).catch((e) =>
      console.error('[MAIL] Confirmación de pedido falló:', e.message)
    );
  }

  return result;
};

/** Envía el email de confirmación de compra al cliente */
const sendOrderConfirmationEmail = async (orderId) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, user: { select: { firstName: true, email: true } } },
  });
  if (!order?.user?.email) return;

  const fmt = (n) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(Number(n));

  const rows = order.items
    .map((i) => `<tr><td style="padding:4px 0">${i.productName} × ${i.quantity}</td><td style="text-align:right">${fmt(i.subtotal)}</td></tr>`)
    .join('');

  await sendMail({
    to: order.user.email,
    subject: `Confirmación de tu pedido #${order.id.slice(0, 8)} — MiTienda`,
    text: `Hola ${order.user.firstName}, tu pago fue aprobado. Total: ${fmt(order.total)}.`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto">
        <h2 style="color:#4f46e5">¡Gracias por tu compra, ${order.user.firstName}!</h2>
        <p>Tu pago fue aprobado y estamos preparando tu pedido <strong>#${order.id.slice(0, 8)}</strong>.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px">
          ${rows}
          <tr><td style="padding-top:12px;font-weight:700;border-top:1px solid #e2e8f0">Total</td>
              <td style="padding-top:12px;text-align:right;font-weight:700;border-top:1px solid #e2e8f0">${fmt(order.total)}</td></tr>
        </table>
        <p style="color:#64748b;font-size:14px">Te avisaremos cuando lo despachemos. ¡Gracias por elegirnos!</p>
      </div>`,
  });
};

/**
 * Marca un pago como rechazado y LIBERA el stock reservado en el checkout. Idempotente.
 */
export const rejectOrderPayment = async (orderId, { providerPaymentId = null, rawResponse = null } = {}) => {
  return prisma.$transaction(async (tx) => {
    const claim = await tx.order.updateMany({
      where: { id: orderId, status: 'PENDING_PAYMENT' },
      data: { status: 'REJECTED' },
    });
    if (claim.count === 0) return { applied: false };

    // Liberar la reserva de stock (el stock se había descontado al crear el pedido)
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
    for (const item of order.items) {
      if (!item.productId) continue;
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          type: 'IN',
          quantity: item.quantity,
          reason: `Liberación por pago rechazado (pedido ${orderId.slice(0, 8)})`,
        },
      });
    }

    await tx.payment.update({
      where: { orderId },
      data: { status: 'REJECTED', ...(providerPaymentId && { providerPaymentId }), rawResponse },
    });
    return { applied: true };
  });
};

/**
 * Procesa una notificación (webhook) de Mercado Pago.
 * Consulta el pago real en MP y enruta a aprobar/rechazar según su estado.
 */
export const processWebhook = async (payload) => {
  if (!isMercadoPagoConfigured()) return { ignored: true };

  // MP envía { type: 'payment', data: { id } } o topic/id
  const paymentId = payload?.data?.id || payload?.['data.id'] || payload?.id;
  const type = payload?.type || payload?.topic;

  if (type !== 'payment' || !paymentId) return { ignored: true };

  const { payment } = await getMercadoPagoClient();
  const mpPayment = await payment.get({ id: paymentId });

  const orderId = mpPayment.external_reference;
  if (!orderId) return { ignored: true };

  const ctx = { providerPaymentId: String(mpPayment.id), rawResponse: mpPayment };

  if (mpPayment.status === 'approved') return approveOrderPayment(orderId, ctx);
  if (['rejected', 'cancelled'].includes(mpPayment.status)) return rejectOrderPayment(orderId, ctx);

  return { ignored: true, status: mpPayment.status };
};

/**
 * Simulación de pago para desarrollo (sin credenciales reales de MP).
 * Permite probar el flujo completo end-to-end.
 */
export const simulatePayment = async (userId, orderId, outcome) => {
  if (isMercadoPagoConfigured()) {
    throw new AppError('La simulación no está disponible con Mercado Pago configurado', 400);
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.userId !== userId) throw new AppError('Pedido no encontrado', 404);

  const raw = { simulated: true, outcome, at: new Date().toISOString() };

  if (outcome === 'approved') {
    return approveOrderPayment(orderId, { providerPaymentId: `SIM-${Date.now()}`, rawResponse: raw });
  }
  return rejectOrderPayment(orderId, { providerPaymentId: `SIM-${Date.now()}`, rawResponse: raw });
};

export const getPaymentStatus = async (userId, orderId) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payment: true },
  });
  if (!order || order.userId !== userId) throw new AppError('Pedido no encontrado', 404);

  return {
    orderId: order.id,
    orderStatus: order.status,
    paymentStatus: order.payment?.status ?? null,
  };
};
