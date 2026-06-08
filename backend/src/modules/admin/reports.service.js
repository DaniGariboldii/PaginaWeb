import prisma from '../../config/prisma.js';
import { PAID_STATUSES, LOW_STOCK_THRESHOLD } from './dashboard.service.js';

/**
 * Reporte de ventas: resumen, evolución diaria (últimos N días) y top de productos.
 */
export const getSalesReport = async ({ days = 30 } = {}) => {
  const [summaryAgg, topItemsRaw] = await prisma.$transaction([
    prisma.order.aggregate({
      _sum: { total: true },
      _count: { _all: true },
      where: { status: { in: PAID_STATUSES } },
    }),
    prisma.orderItem.groupBy({
      by: ['productName'],
      _sum: { quantity: true, subtotal: true },
      orderBy: { _sum: { subtotal: 'desc' } },
      take: 10,
      where: { order: { is: { status: { in: PAID_STATUSES } } } },
    }),
  ]);

  // Evolución diaria (PostgreSQL date_trunc). Estados constantes => sin inyección.
  const salesByDay = await prisma.$queryRawUnsafe(`
    SELECT to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') AS day,
           SUM(total)::float AS revenue,
           COUNT(*)::int AS orders
    FROM orders
    WHERE status IN ('PAID','PREPARING','SHIPPED','DELIVERED')
      AND "createdAt" >= NOW() - INTERVAL '${Number(days)} days'
    GROUP BY day
    ORDER BY day ASC
  `);

  const totalRevenue = Number(summaryAgg._sum.total ?? 0);
  const paidOrders = summaryAgg._count._all;

  return {
    summary: {
      totalRevenue,
      paidOrders,
      avgOrderValue: paidOrders > 0 ? Math.round(totalRevenue / paidOrders) : 0,
    },
    salesByDay: salesByDay.map((r) => ({ day: r.day, revenue: r.revenue, orders: r.orders })),
    topProducts: topItemsRaw.map((t) => ({
      name: t.productName,
      unitsSold: t._sum.quantity ?? 0,
      revenue: Number(t._sum.subtotal ?? 0),
    })),
  };
};

/**
 * Reporte de stock: totales, valor de inventario y productos con bajo stock.
 */
export const getStockReport = async () => {
  const products = await prisma.product.findMany({
    where: { active: true },
    select: { id: true, name: true, stock: true, price: true, category: { select: { name: true } } },
  });

  const totalUnits = products.reduce((acc, p) => acc + p.stock, 0);
  const inventoryValue = products.reduce((acc, p) => acc + p.stock * Number(p.price), 0);
  const outOfStock = products.filter((p) => p.stock === 0);
  const lowStock = products
    .filter((p) => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD)
    .sort((a, b) => a.stock - b.stock);

  return {
    summary: {
      totalProducts: products.length,
      totalUnits,
      inventoryValue,
      outOfStockCount: outOfStock.length,
      lowStockCount: lowStock.length,
      threshold: LOW_STOCK_THRESHOLD,
    },
    outOfStock: outOfStock.map((p) => ({ id: p.id, name: p.name, category: p.category?.name })),
    lowStock: lowStock.map((p) => ({ id: p.id, name: p.name, stock: p.stock, category: p.category?.name })),
  };
};
