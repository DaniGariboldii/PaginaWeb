import crypto from 'node:crypto';
import prisma from '../../config/prisma.js';
import { AppError } from '../../utils/AppError.js';
import { env } from '../../config/env.js';
import { isMercadoPagoConfigured, getMercadoPagoClient } from '../../config/mercadopago.js';
import { sendMail } from '../../config/mailer.js';

/**
 * Valida la firma del webhook de Mercado Pago (header x-signature).
 * Manifest: `id:{dataId};request-id:{requestId};ts:{ts};` → HMAC-SHA256 con el secret.
 * Sin secret: en desarrollo se acepta (para simular el flujo); en producción se RECHAZA,
 * porque un webhook sin firma verificada permitiría falsificar un "pago aprobado".
 */
export const verifyWebhookSignature = ({ signature, requestId, dataId }) => {
  if (!env.mercadoPago.webhookSecret) return env.isDev; // prod sin secret → rechaza
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
/**
 * Verifica el acceso a un pedido.
 * - Usuario con cuenta: el pedido debe ser suyo.
 * - Invitado (endpoint público por UUID): el pedido NO debe pertenecer a ninguna cuenta.
 *   Esto evita que un endpoint público pueda operar sobre pedidos de usuarios registrados.
 */
const assertOrderAccess = (order, userId, isGuest) => {
  if (!order) throw new AppError('Pedido no encontrado', 404);
  if (isGuest) {
    if (order.userId !== null) throw new AppError('Pedido no encontrado', 404);
  } else if (order.userId !== userId) {
    throw new AppError('Pedido no encontrado', 404);
  }
};

export const createPreference = async (userId, orderId, isGuest = false) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, payment: true },
  });

  assertOrderAccess(order, userId, isGuest);
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

    const body = {
      items,
      external_reference: order.id, // MP lo devuelve en el webhook y en las back_urls
      metadata: { order_id: order.id },
      statement_descriptor: 'MITIENDA',
      back_urls: {
        success: env.mercadoPago.successUrl,
        failure: env.mercadoPago.failureUrl,
        pending: env.mercadoPago.pendingUrl,
      },
      notification_url: `${env.backendUrl}/api/payments/webhook`,
    };

    // auto_return solo si la URL de éxito es pública (HTTPS). Con localhost, MP lo rechaza.
    if (env.mercadoPago.successUrl?.startsWith('https://')) {
      body.auto_return = 'approved';
    }

    const result = await preference.create({ body });

    await prisma.payment.update({
      where: { orderId: order.id },
      data: { providerPreferenceId: String(result.id) },
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

  // Emails fuera de la transacción (no bloquean ni rompen el flujo)
  if (result.applied) {
    sendOrderConfirmationEmail(orderId).catch((e) =>
      console.error('[MAIL] Confirmación de pedido falló:', e.message)
    );
    sendAdminSaleNotification(orderId).catch((e) =>
      console.error('[MAIL] Aviso de venta al admin falló:', e.message)
    );
  }

  return result;
};

/** Envía el email de confirmación de compra al cliente (con cuenta o invitado) */
const sendOrderConfirmationEmail = async (orderId) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, user: { select: { firstName: true, email: true } } },
  });
  // Destinatario: el email de la cuenta o, si es invitado, el guestEmail
  const to = order?.user?.email ?? order?.guestEmail;
  const firstName = order?.user?.firstName ?? order?.guestName?.split(' ')[0] ?? 'Cliente';
  if (!to) return;

  const fmt = (n) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(Number(n));

  const rows = order.items
    .map((i) => `<tr><td style="padding:4px 0">${i.productName} × ${i.quantity}</td><td style="text-align:right">${fmt(i.subtotal)}</td></tr>`)
    .join('');

  await sendMail({
    to,
    subject: `Confirmación de tu pedido #${order.id.slice(0, 8)} — MiTienda`,
    text: `Hola ${firstName}, tu pago fue aprobado. Total: ${fmt(order.total)}.`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto">
        <h2 style="color:#4f46e5">¡Gracias por tu compra, ${firstName}!</h2>
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

/** Avisa al administrador/tienda que entró una venta nueva */
const sendAdminSaleNotification = async (orderId) => {
  if (!env.storeEmail) return;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      user: { select: { firstName: true, lastName: true, email: true, phone: true } },
      address: true,
    },
  });
  if (!order) return;

  const fmt = (n) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(Number(n));

  const rows = order.items
    .map((i) => `<tr><td style="padding:4px 0">${i.productName} × ${i.quantity}</td><td style="text-align:right">${fmt(i.subtotal)}</td></tr>`)
    .join('');

  const addr = order.address
    ? `${order.address.street ?? ''} ${order.address.number ?? ''}, ${order.address.city ?? ''}, ${order.address.province ?? ''} (CP ${order.address.postalCode ?? '—'})`
    : 'Sin dirección registrada';

  // Datos del cliente: cuenta o invitado
  const cliente = order.user
    ? `${order.user.firstName ?? ''} ${order.user.lastName ?? ''}`.trim()
    : `${order.guestName ?? ''} (invitado)`.trim();
  const clienteEmail = order.user?.email ?? order.guestEmail ?? '—';
  const clienteTel = order.user?.phone ?? order.guestPhone ?? '—';
  const panelUrl = `${env.frontendUrl}/admin/pedidos`;

  await sendMail({
    to: env.storeEmail,
    subject: `🛒 Nueva venta #${order.id.slice(0, 8)} — ${fmt(order.total)}`,
    text: `Nueva venta de ${cliente} por ${fmt(order.total)}. Pedido #${order.id.slice(0, 8)}.`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto">
        <h2 style="color:#16a34a">💰 ¡Nueva venta confirmada!</h2>
        <p><strong>Pedido:</strong> #${order.id.slice(0, 8)}</p>
        <p><strong>Cliente:</strong> ${cliente || '—'}<br>
           <strong>Email:</strong> ${clienteEmail}<br>
           <strong>Teléfono:</strong> ${clienteTel}</p>
        <p><strong>Envío a:</strong> ${addr}</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px">
          ${rows}
          <tr><td style="padding-top:12px;font-weight:700;border-top:1px solid #e2e8f0">Total</td>
              <td style="padding-top:12px;text-align:right;font-weight:700;border-top:1px solid #e2e8f0">${fmt(order.total)}</td></tr>
        </table>
        <p style="text-align:center;margin:24px 0">
          <a href="${panelUrl}" style="background:#4f46e5;color:#fff;text-decoration:none;padding:10px 20px;border-radius:10px;font-weight:600;display:inline-block">
            Ver en el panel
          </a>
        </p>
      </div>`,
  });
};

/**
 * Registra un intento de pago rechazado SIN terminar el pedido.
 * En Checkout Pro el cliente puede reintentar con otro medio en la misma operación,
 * por eso el pedido queda PENDING_PAYMENT (con el stock reservado) para permitir el
 * reintento. Si se abandona, la reserva se libera por expiración (releaseExpiredOrders).
 * Solo se actualiza el registro de Payment para dejar constancia del intento fallido.
 */
export const rejectOrderPayment = async (orderId, { providerPaymentId = null, rawResponse = null } = {}) => {
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { status: true } });
  // No tocar pedidos ya finalizados (p. ej. ya pagados por un reintento exitoso)
  if (!order || order.status !== 'PENDING_PAYMENT') return { applied: false };

  await prisma.payment.updateMany({
    where: { orderId },
    data: { status: 'REJECTED', ...(providerPaymentId && { providerPaymentId }), rawResponse },
  });
  return { applied: true };
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
export const simulatePayment = async (userId, orderId, outcome, isGuest = false) => {
  if (isMercadoPagoConfigured()) {
    throw new AppError('La simulación no está disponible con Mercado Pago configurado', 400);
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  assertOrderAccess(order, userId, isGuest);

  const raw = { simulated: true, outcome, at: new Date().toISOString() };

  if (outcome === 'approved') {
    return approveOrderPayment(orderId, { providerPaymentId: `SIM-${Date.now()}`, rawResponse: raw });
  }
  return rejectOrderPayment(orderId, { providerPaymentId: `SIM-${Date.now()}`, rawResponse: raw });
};

/** Indica si los pagos corren en modo simulado (sin credenciales reales de MP) */
export const getPaymentMode = () => ({ simulated: !isMercadoPagoConfigured() });

/**
 * Confirma un pago consultando directamente a Mercado Pago (fallback del webhook).
 * Se llama al volver del checkout, con el payment_id que agrega MP a la URL.
 * Verifica que el pago pertenezca al pedido y, según su estado, aprueba o rechaza.
 */
export const confirmPayment = async (userId, orderId, paymentId, isGuest = false) => {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  assertOrderAccess(order, userId, isGuest);
  if (order.status !== 'PENDING_PAYMENT') {
    return { orderStatus: order.status, applied: false, total: Number(order.total) };
  }
  if (!isMercadoPagoConfigured() || !paymentId) {
    return { orderStatus: order.status, applied: false, total: Number(order.total) };
  }

  const { payment } = await getMercadoPagoClient();
  const mpPayment = await payment.get({ id: paymentId });

  // Seguridad: el pago debe corresponder a este pedido
  if (String(mpPayment.external_reference) !== String(orderId)) {
    throw new AppError('El pago no corresponde a este pedido', 400);
  }

  const ctx = { providerPaymentId: String(mpPayment.id), rawResponse: mpPayment };
  if (mpPayment.status === 'approved') await approveOrderPayment(orderId, ctx);
  else if (['rejected', 'cancelled'].includes(mpPayment.status)) await rejectOrderPayment(orderId, ctx);

  const updated = await prisma.order.findUnique({ where: { id: orderId } });
  return { orderStatus: updated.status, applied: true, mpStatus: mpPayment.status, total: Number(updated.total) };
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
