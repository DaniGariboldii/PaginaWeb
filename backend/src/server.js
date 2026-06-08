import 'dotenv/config';
import app from './app.js';
import { env } from './config/env.js';
import prisma from './config/prisma.js';
import { releaseExpiredOrders } from './modules/orders/orders.service.js';

// Cada 5 minutos libera el stock de pedidos pendientes de pago vencidos (reserva abandonada).
const RESERVATION_TTL_MINUTES = 30;
const startReservationCleanup = () => {
  const run = () => releaseExpiredOrders(RESERVATION_TTL_MINUTES).catch((e) =>
    console.error('[STOCK] Error liberando reservas vencidas:', e.message)
  );
  run(); // una pasada al arrancar
  setInterval(run, 5 * 60 * 1000);
};

const start = async () => {
  try {
    await prisma.$connect();
    console.log('[DB] Conexión a PostgreSQL establecida');

    app.listen(env.port, () => {
      console.log(`[SERVER] Corriendo en http://localhost:${env.port} (${env.nodeEnv})`);
    });

    startReservationCleanup();
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
