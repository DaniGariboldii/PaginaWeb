import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../../src/config/prisma.js';
import { createOrderFromCart } from '../../src/modules/orders/orders.service.js';
import { approveOrderPayment } from '../../src/modules/payments/payments.service.js';

/**
 * Integración real contra PostgreSQL: valida las reglas de negocio clave
 * (cupón, descuento, stock al aprobar, idempotencia). Crea datos aislados
 * con prefijo de test y los limpia al final.
 */
const TAG = `itest_${Date.now()}`;
const ids = { user: null, category: null, product: null, cart: null, coupon: null, address: null, order: null, zone: null };

beforeAll(async () => {
  const user = await prisma.user.create({
    data: { firstName: 'Test', lastName: 'Integration', email: `${TAG}@test.com`, passwordHash: 'x', role: 'CLIENT' },
  });
  ids.user = user.id;

  const category = await prisma.category.create({ data: { name: `${TAG}-cat`, slug: `${TAG}-cat` } });
  ids.category = category.id;

  const product = await prisma.product.create({
    data: { name: `${TAG}-prod`, slug: `${TAG}-prod`, price: 1000, stock: 10, categoryId: category.id },
  });
  ids.product = product.id;

  const cart = await prisma.cart.create({
    data: { userId: user.id, items: { create: { productId: product.id, quantity: 2, unitPrice: 1000 } } },
  });
  ids.cart = cart.id;

  const coupon = await prisma.coupon.create({
    data: { code: `${TAG.toUpperCase()}`, type: 'PERCENTAGE', value: 10 },
  });
  ids.coupon = coupon.id;

  const address = await prisma.address.create({
    data: { userId: user.id, province: 'Tucumán', city: 'SMT', postalCode: '4000', street: 'Calle', number: '1' },
  });
  ids.address = address.id;

  // Zona de envío con costo 0 para la provincia del test → envío determinista
  const zone = await prisma.shippingZone.create({
    data: { name: `${TAG}-zone`, provinces: ['Tucumán'], cost: 0 },
  });
  ids.zone = zone.id;
});

afterAll(async () => {
  if (ids.order) {
    await prisma.payment.deleteMany({ where: { orderId: ids.order } });
    await prisma.order.deleteMany({ where: { id: ids.order } });
  }
  if (ids.coupon) await prisma.coupon.deleteMany({ where: { id: ids.coupon } });
  if (ids.cart) await prisma.cart.deleteMany({ where: { id: ids.cart } });
  if (ids.product) {
    await prisma.stockMovement.deleteMany({ where: { productId: ids.product } });
    await prisma.product.deleteMany({ where: { id: ids.product } });
  }
  if (ids.category) await prisma.category.deleteMany({ where: { id: ids.category } });
  if (ids.address) await prisma.address.deleteMany({ where: { id: ids.address } });
  if (ids.zone) await prisma.shippingZone.deleteMany({ where: { id: ids.zone } });
  if (ids.user) await prisma.user.deleteMany({ where: { id: ids.user } });
  await prisma.$disconnect();
});

describe('Flujo de pedido (integración)', () => {
  it('crea el pedido aplicando el cupón y NO descuenta stock', async () => {
    const order = await createOrderFromCart(ids.user, ids.address, `${TAG.toUpperCase()}`);
    ids.order = order.id;

    expect(Number(order.subtotal)).toBe(2000);
    expect(Number(order.discount)).toBe(200); // 10% de 2000
    expect(Number(order.shippingCost)).toBe(0); // zona de test con costo 0
    expect(Number(order.total)).toBe(1800); // 2000 - 200 + 0
    expect(order.status).toBe('PENDING_PAYMENT');

    const product = await prisma.product.findUnique({ where: { id: ids.product } });
    expect(product.stock).toBe(8); // reservado al crear: 10 - 2

    const coupon = await prisma.coupon.findUnique({ where: { id: ids.coupon } });
    expect(coupon.usedCount).toBe(1); // cupón consumido
  });

  it('aprobar el pago confirma la venta sin volver a tocar el stock', async () => {
    const res = await approveOrderPayment(ids.order, { providerPaymentId: `TEST-${TAG}` });
    expect(res.applied).toBe(true);

    const product = await prisma.product.findUnique({ where: { id: ids.product } });
    expect(product.stock).toBe(8); // sigue en 8 (ya estaba reservado)

    const order = await prisma.order.findUnique({ where: { id: ids.order } });
    expect(order.status).toBe('PAID');
  });

  it('es idempotente: un segundo aprobado no cambia el stock', async () => {
    const res = await approveOrderPayment(ids.order, { providerPaymentId: `TEST-${TAG}` });
    expect(res.applied).toBe(false);

    const product = await prisma.product.findUnique({ where: { id: ids.product } });
    expect(product.stock).toBe(8); // sigue en 8
  });

  it('no permite reservar más stock del disponible (anti-sobreventa)', async () => {
    // El producto está en 8. Pedimos 999 en un carrito nuevo → debe fallar sin tocar stock.
    await prisma.cart.upsert({
      where: { userId: ids.user },
      update: { items: { create: { productId: ids.product, quantity: 999, unitPrice: 1000 } } },
      create: { userId: ids.user, items: { create: { productId: ids.product, quantity: 999, unitPrice: 1000 } } },
    });
    await expect(createOrderFromCart(ids.user, ids.address)).rejects.toThrow(/insuficiente/i);

    const product = await prisma.product.findUnique({ where: { id: ids.product } });
    expect(product.stock).toBe(8); // intacto
    // limpiar el carrito de prueba
    await prisma.cartItem.deleteMany({ where: { cart: { is: { userId: ids.user } } } });
  });
});
