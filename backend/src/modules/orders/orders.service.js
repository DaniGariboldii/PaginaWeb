import prisma from '../../config/prisma.js';
import { AppError } from '../../utils/AppError.js';
import { validateCoupon } from '../coupons/coupons.service.js';
import { quoteShipping } from '../shipping/shipping.service.js';
import { sendMail } from '../../config/mailer.js';
import { env } from '../../config/env.js';

/** Precio efectivo (con descuento si corresponde) */
const effectivePrice = (product) =>
  product.discountPrice && Number(product.discountPrice) < Number(product.price)
    ? Number(product.discountPrice)
    : Number(product.price);

const ORDER_INCLUDE = {
  items: true,
  address: true,
  payment: { select: { id: true, status: true, provider: true, providerPaymentId: true, amount: true } },
  user: { select: { id: true, firstName: true, lastName: true, email: true } },
};

/**
 * Crea un pedido a partir del carrito del usuario.
 * - Valida stock al momento de crear (pero NO lo descuenta: eso ocurre al aprobarse el pago).
 * - Guarda un snapshot de cada producto (nombre, precio, cantidad, subtotal).
 * - El total se calcula siempre en el backend.
 * - Vacía el carrito al crear el pedido.
 */
export const createOrderFromCart = async (userId, addressId, couponCode = null) => {
  // Validar dirección
  const address = await prisma.address.findUnique({ where: { id: addressId } });
  if (!address || address.userId !== userId) throw new AppError('Dirección no válida', 400);

  // Cargar carrito con productos
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: { include: { product: true } } },
  });

  if (!cart || cart.items.length === 0) throw new AppError('El carrito está vacío', 400);

  // Validar disponibilidad y stock; construir snapshot
  const orderItemsData = [];
  let subtotal = 0;

  for (const item of cart.items) {
    const p = item.product;
    if (!p.active) throw new AppError(`El producto "${p.name}" ya no está disponible`, 409);
    if (p.stock < item.quantity) {
      throw new AppError(`Stock insuficiente para "${p.name}" (disponible: ${p.stock})`, 409);
    }
    const unitPrice = effectivePrice(p);
    const itemSubtotal = unitPrice * item.quantity;
    subtotal += itemSubtotal;

    orderItemsData.push({
      productId: p.id,
      productName: p.name, // snapshot
      quantity: item.quantity,
      unitPrice,
      subtotal: itemSubtotal,
    });
  }

  // Validar cupón (si se envió) — el descuento se recalcula SIEMPRE en el backend
  let discount = 0;
  let appliedCoupon = null;
  if (couponCode) {
    const result = await validateCoupon(couponCode, subtotal);
    discount = result.discount;
    appliedCoupon = result.coupon;
  }

  // Calcular envío según la provincia de la dirección (siempre en el backend)
  const { cost: shippingCost } = await quoteShipping(address.province, subtotal);

  const total = subtotal - discount + shippingCost;

  // Crear pedido + items + pago, RESERVAR stock, consumir cupón y vaciar carrito (todo en una transacción)
  const order = await prisma.$transaction(async (tx) => {
    // Reserva atómica de stock: solo descuenta si hay suficiente.
    // Esto evita la sobreventa entre pedidos concurrentes (dos personas / la última unidad).
    for (const item of orderItemsData) {
      const reserved = await tx.product.updateMany({
        where: { id: item.productId, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });
      if (reserved.count === 0) {
        throw new AppError(`Stock insuficiente para "${item.productName}"`, 409);
      }
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          type: 'OUT',
          quantity: item.quantity,
          reason: 'Reserva de pedido',
        },
      });
    }

    const created = await tx.order.create({
      data: {
        userId,
        addressId,
        subtotal,
        discount,
        shippingCost,
        couponCode: appliedCoupon?.code ?? null,
        total,
        status: 'PENDING_PAYMENT',
        paymentMethod: 'mercadopago',
        items: { create: orderItemsData },
        payment: { create: { provider: 'mercadopago', status: 'PENDING', amount: total } },
      },
      include: ORDER_INCLUDE,
    });

    if (appliedCoupon) {
      await tx.coupon.update({ where: { id: appliedCoupon.id }, data: { usedCount: { increment: 1 } } });
    }

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    return created;
  });

  return order;
};

/**
 * Crea un pedido de INVITADO (sin cuenta).
 * - Recibe los ítems del carrito local del cliente; precio y stock se validan en el backend.
 * - Crea una dirección "huérfana" (userId null) como snapshot de envío.
 * - Guarda los datos de contacto del invitado en el propio pedido.
 * Reusa la misma reserva atómica de stock que el flujo con cuenta.
 */
export const createGuestOrder = async ({ email, name, phone, address, items, couponCode = null }) => {
  // Cargar productos reales y validar disponibilidad/stock
  const ids = [...new Set(items.map((i) => i.productId))];
  const products = await prisma.product.findMany({ where: { id: { in: ids } } });
  const byId = Object.fromEntries(products.map((p) => [p.id, p]));

  const orderItemsData = [];
  let subtotal = 0;
  for (const item of items) {
    const p = byId[item.productId];
    if (!p || !p.active) throw new AppError('Uno de los productos ya no está disponible', 409);
    if (p.stock < item.quantity) {
      throw new AppError(`Stock insuficiente para "${p.name}" (disponible: ${p.stock})`, 409);
    }
    const unitPrice = effectivePrice(p);
    const itemSubtotal = unitPrice * item.quantity;
    subtotal += itemSubtotal;
    orderItemsData.push({
      productId: p.id,
      productName: p.name,
      quantity: item.quantity,
      unitPrice,
      subtotal: itemSubtotal,
    });
  }

  // Cupón y envío (siempre recalculados en el backend)
  let discount = 0;
  let appliedCoupon = null;
  if (couponCode) {
    const result = await validateCoupon(couponCode, subtotal);
    discount = result.discount;
    appliedCoupon = result.coupon;
  }
  const { cost: shippingCost } = await quoteShipping(address.province, subtotal);
  const total = subtotal - discount + shippingCost;

  return prisma.$transaction(async (tx) => {
    // Reserva atómica de stock (anti-sobreventa), igual que el flujo con cuenta
    for (const item of orderItemsData) {
      const reserved = await tx.product.updateMany({
        where: { id: item.productId, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });
      if (reserved.count === 0) throw new AppError(`Stock insuficiente para "${item.productName}"`, 409);
      await tx.stockMovement.create({
        data: { productId: item.productId, type: 'OUT', quantity: item.quantity, reason: 'Reserva de pedido (invitado)' },
      });
    }

    // Dirección snapshot sin dueño (userId null)
    const createdAddress = await tx.address.create({
      data: {
        userId: null,
        province: address.province,
        city: address.city,
        postalCode: address.postalCode,
        street: address.street,
        number: address.number,
        floor: address.floor ?? null,
        apartment: address.apartment ?? null,
        reference: address.reference ?? null,
      },
    });

    const created = await tx.order.create({
      data: {
        userId: null,
        guestEmail: email,
        guestName: name,
        guestPhone: phone ?? null,
        addressId: createdAddress.id,
        subtotal,
        discount,
        shippingCost,
        couponCode: appliedCoupon?.code ?? null,
        total,
        status: 'PENDING_PAYMENT',
        paymentMethod: 'mercadopago',
        items: { create: orderItemsData },
        payment: { create: { provider: 'mercadopago', status: 'PENDING', amount: total } },
      },
      include: ORDER_INCLUDE,
    });

    if (appliedCoupon) {
      await tx.coupon.update({ where: { id: appliedCoupon.id }, data: { usedCount: { increment: 1 } } });
    }

    return created;
  });
};

export const getMyOrders = async (userId, { page, limit, status }) => {
  const where = { userId, ...(status && { status }) };
  const skip = (page - 1) * limit;

  const [total, orders] = await prisma.$transaction([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        items: { select: { id: true, productName: true, quantity: true, subtotal: true } },
        payment: { select: { status: true } },
      },
    }),
  ]);

  return { orders, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

export const getOrderById = async (userId, id, isAdmin = false) => {
  const order = await prisma.order.findUnique({ where: { id }, include: ORDER_INCLUDE });
  if (!order) throw new AppError('Pedido no encontrado', 404);
  if (!isAdmin && order.userId !== userId) throw new AppError('Pedido no encontrado', 404);
  return order;
};

/** Pedido de invitado: solo accesible por su id (UUID), y solo si no pertenece a una cuenta */
export const getGuestOrderById = async (id) => {
  const order = await prisma.order.findUnique({ where: { id }, include: ORDER_INCLUDE });
  if (!order || order.userId !== null) throw new AppError('Pedido no encontrado', 404);
  return order;
};

// ─── Admin ──────────────────────────────────────────────────────────────────

export const getAllOrders = async ({ page, limit, status }) => {
  const where = status ? { status } : {};
  const skip = (page - 1) * limit;

  const [total, orders] = await prisma.$transaction([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        payment: { select: { status: true } },
        _count: { select: { items: true } },
      },
    }),
  ]);

  return { orders, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

// Estados en los que el pedido mantiene el stock reservado
const HOLDING_STATUSES = ['PENDING_PAYMENT', 'PAID', 'PREPARING', 'SHIPPED', 'DELIVERED'];

/**
 * Email al cliente avisando el cambio de estado de envío (enviado / entregado).
 * Funciona tanto para pedidos con cuenta como de invitado. Nunca lanza al caller.
 */
const sendShippingStatusEmail = async (order, status) => {
  const to = order.user?.email ?? order.guestEmail;
  const firstName = order.user?.firstName ?? order.guestName?.split(' ')[0] ?? 'Cliente';
  if (!to) return;

  const ref = `#${order.id.slice(0, 8)}`;
  const tracking = order.trackingNumber
    ? `<p style="font-size:14px">Seguimiento${order.carrier ? ` (${order.carrier})` : ''}: <strong>${order.trackingNumber}</strong></p>`
    : '';

  const config = {
    SHIPPED: {
      subject: `📦 Tu pedido ${ref} fue enviado — MiTienda`,
      title: '¡Tu pedido está en camino! 📦',
      body: `Despachamos tu pedido <strong>${ref}</strong>. Pronto lo vas a recibir.${tracking ? '' : ''}`,
    },
    DELIVERED: {
      subject: `✅ Tu pedido ${ref} fue entregado — MiTienda`,
      title: '¡Tu pedido fue entregado! ✅',
      body: `Tu pedido <strong>${ref}</strong> figura como entregado. ¡Esperamos que lo disfrutes!`,
    },
  }[status];
  if (!config) return;

  await sendMail({
    to,
    subject: config.subject,
    text: `Hola ${firstName}, ${config.title}`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto">
        <h2 style="color:#4f46e5">Hola ${firstName},</h2>
        <h3>${config.title}</h3>
        <p style="color:#334155">${config.body}</p>
        ${status === 'SHIPPED' ? tracking : ''}
        <p style="color:#64748b;font-size:14px">Gracias por comprar en MiTienda.</p>
      </div>`,
  });
};

/**
 * Cambio de estado por el admin.
 * - No permite asignar PAID manualmente (solo vía aprobación de pago).
 * - Si se cancela un pedido que tenía stock reservado, lo libera.
 * - Al marcar SHIPPED se puede adjuntar número de seguimiento / transportista.
 * - Envía email al cliente al pasar a SHIPPED o DELIVERED.
 */
export const updateOrderStatus = async (id, newStatus, { trackingNumber, carrier } = {}) => {
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) throw new AppError('Pedido no encontrado', 404);

  if (newStatus === 'PAID') {
    throw new AppError('El estado PAGADO solo se asigna al confirmarse el pago', 400);
  }
  if (order.status === newStatus && !trackingNumber) return order;

  const wasHolding = HOLDING_STATUSES.includes(order.status);
  const isCancelling = newStatus === 'CANCELLED';

  const updated = await prisma.$transaction(async (tx) => {
    // Liberar el stock reservado si se cancela un pedido activo
    if (isCancelling && wasHolding) {
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
            reason: `Liberación por cancelación (pedido ${order.id.slice(0, 8)})`,
          },
        });
      }
    }

    return tx.order.update({
      where: { id },
      data: {
        status: newStatus,
        // El tracking solo se guarda al despachar
        ...(newStatus === 'SHIPPED' && {
          trackingNumber: trackingNumber ?? null,
          carrier: carrier ?? null,
        }),
      },
      include: ORDER_INCLUDE,
    });
  });

  // Notificación de envío fuera de la transacción (no bloquea ni rompe el flujo)
  if (newStatus === 'SHIPPED' || newStatus === 'DELIVERED') {
    sendShippingStatusEmail(updated, newStatus).catch((e) =>
      console.error('[MAIL] Aviso de envío falló:', e.message)
    );
  }

  return updated;
};

// Estados que el cliente puede cancelar por su cuenta (antes de que se prepare/envíe)
const CLIENT_CANCELLABLE = ['PENDING_PAYMENT', 'PAID'];

/**
 * Cancelación por el propio cliente.
 * - Solo sus pedidos y solo si están pendientes de pago o pagados (aún no preparados).
 * - Libera el stock reservado y marca el pago como cancelado.
 */
export const cancelOwnOrder = async (userId, orderId) => {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order || order.userId !== userId) throw new AppError('Pedido no encontrado', 404);

  if (!CLIENT_CANCELLABLE.includes(order.status)) {
    throw new AppError('Este pedido ya no se puede cancelar', 409);
  }

  return prisma.$transaction(async (tx) => {
    // Claim atómico para evitar carreras (p. ej. con un webhook de pago)
    const claim = await tx.order.updateMany({
      where: { id: orderId, status: { in: CLIENT_CANCELLABLE } },
      data: { status: 'CANCELLED' },
    });
    if (claim.count === 0) throw new AppError('Este pedido ya no se puede cancelar', 409);

    // Liberar stock reservado
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
          reason: `Cancelación del cliente (pedido ${orderId.slice(0, 8)})`,
        },
      });
    }

    await tx.payment.updateMany({ where: { orderId }, data: { status: 'CANCELLED' } });

    return tx.order.findUnique({ where: { id: orderId }, include: ORDER_INCLUDE });
  });
};

/**
 * Libera el stock de pedidos PENDING_PAYMENT vencidos (reserva abandonada) y los cancela.
 * Se ejecuta periódicamente desde el servidor.
 */
export const releaseExpiredOrders = async (minutes = 30) => {
  const cutoff = new Date(Date.now() - minutes * 60 * 1000);
  const expired = await prisma.order.findMany({
    where: { status: 'PENDING_PAYMENT', createdAt: { lt: cutoff } },
    include: { items: true },
  });

  let released = 0;
  for (const order of expired) {
    await prisma.$transaction(async (tx) => {
      // Solo procede si sigue PENDING_PAYMENT (evita carrera con un pago que llega justo)
      const claim = await tx.order.updateMany({
        where: { id: order.id, status: 'PENDING_PAYMENT' },
        data: { status: 'CANCELLED' },
      });
      if (claim.count === 0) return;

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
            reason: `Liberación por vencimiento (pedido ${order.id.slice(0, 8)})`,
          },
        });
      }
      if (order.payment) {
        await tx.payment.updateMany({ where: { orderId: order.id }, data: { status: 'CANCELLED' } });
      }
      released++;
    });
  }
  if (released > 0) console.log(`[STOCK] ${released} reserva(s) vencida(s) liberada(s)`);
  return released;
};
