import prisma from '../../config/prisma.js';

// Estados que representan una venta concretada (pago confirmado)
export const PAID_STATUSES = ['PAID', 'PREPARING', 'SHIPPED', 'DELIVERED'];
export const LOW_STOCK_THRESHOLD = 5;

/**
 * Métricas generales para el dashboard del administrador.
 */
export const getDashboard = async () => {
  const [
    revenueAgg,
    ordersCount,
    pendingOrders,
    productsCount,
    usersCount,
    lowStockCount,
    ordersByStatusRaw,
    recentOrders,
    topItemsRaw,
  ] = await prisma.$transaction([
    prisma.order.aggregate({ _sum: { total: true }, where: { status: { in: PAID_STATUSES } } }),
    prisma.order.count(),
    prisma.order.count({ where: { status: 'PENDING_PAYMENT' } }),
    prisma.product.count({ where: { active: true } }),
    prisma.user.count({ where: { role: 'CLIENT' } }),
    prisma.product.count({ where: { active: true, stock: { lte: LOW_STOCK_THRESHOLD } } }),
    prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true } },
        _count: { select: { items: true } },
      },
    }),
    prisma.orderItem.groupBy({
      by: ['productName'],
      _sum: { quantity: true, subtotal: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
      where: { order: { is: { status: { in: PAID_STATUSES } } } },
    }),
  ]);

  return {
    metrics: {
      totalRevenue: Number(revenueAgg._sum.total ?? 0),
      ordersCount,
      pendingOrders,
      productsCount,
      usersCount,
      lowStockCount,
    },
    ordersByStatus: ordersByStatusRaw.map((o) => ({ status: o.status, count: o._count._all })),
    recentOrders: recentOrders.map((o) => ({
      id: o.id,
      total: Number(o.total),
      status: o.status,
      createdAt: o.createdAt,
      customer: o.user ? `${o.user.firstName} ${o.user.lastName}` : '—',
      itemsCount: o._count.items,
    })),
    topProducts: topItemsRaw.map((t) => ({
      name: t.productName,
      unitsSold: t._sum.quantity ?? 0,
      revenue: Number(t._sum.subtotal ?? 0),
    })),
  };
};
