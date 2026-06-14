import 'dotenv/config';
import app from './app.js';
import { env } from './config/env.js';
import prisma from './config/prisma.js';
import { releaseExpiredOrders } from './modules/orders/orders.service.js';
import { sendAbandonedCartReminders } from './modules/cart/abandonedCart.service.js';

// Cada 5 minutos libera el stock de pedidos pendientes de pago vencidos (reserva abandonada).
const RESERVATION_TTL_MINUTES = 30;
const startReservationCleanup = () => {
  const run = () => releaseExpiredOrders(RESERVATION_TTL_MINUTES).catch((e) =>
    console.error('[STOCK] Error liberando reservas vencidas:', e.message)
  );
  run(); // una pasada al arrancar
  setInterval(run, 5 * 60 * 1000);
};

// Cada 30 minutos envía recordatorios de carrito abandonado (carritos con ítems
// inactivos por más de ABANDONED_CART_HOURS horas).
const ABANDONED_CART_HOURS = Number(process.env.ABANDONED_CART_HOURS) || 4;
const startAbandonedCartReminders = () => {
  const run = () => sendAbandonedCartReminders(ABANDONED_CART_HOURS).catch((e) =>
    console.error('[CART] Error enviando recordatorios:', e.message)
  );
  setInterval(run, 30 * 60 * 1000);
};

const start = async () => {
  try {
    await prisma.$connect();
    console.log('[DB] Conexión a PostgreSQL establecida');

    app.listen(env.port, () => {
      console.log(`[SERVER] Corriendo en http://localhost:${env.port} (${env.nodeEnv})`);
    });

    startReservationCleanup();
    startAbandonedCartReminders();
  } catch (err) {
    console.error('[SERVER] Error al iniciar:', err);
    await prisma.$disconnect();
    process.exit(1);
  }
};

process.on('SIGTERM', async () => {
  console.log('[SERVER] SIGTERM recibido, cerrando...');
  await prisma.$disconnect();
  process.exit(0);
});

start();
