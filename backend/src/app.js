import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import { env } from './config/env.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFound } from './middlewares/notFound.js';

import authRouter from './modules/auth/auth.router.js';
import productsRouter from './modules/products/products.router.js';
import categoriesRouter from './modules/categories/categories.router.js';
import cartRouter from './modules/cart/cart.router.js';
import ordersRouter from './modules/orders/orders.router.js';
import paymentsRouter from './modules/payments/payments.router.js';
import addressesRouter from './modules/addresses/addresses.router.js';
import wishlistRouter from './modules/wishlist/wishlist.router.js';
import couponsRouter from './modules/coupons/coupons.router.js';
import shippingRouter from './modules/shipping/shipping.router.js';
import legalRouter from './modules/legal/legal.router.js';
import adminRouter from './modules/admin/admin.router.js';
import seoRouter from './modules/seo/seo.router.js';
import { setupSpa } from './modules/seo/prerender.js';

const app = express();

// Detrás de un reverse proxy (nginx, Railway, Render): confiar en X-Forwarded-*
// Necesario para que las cookies `secure` y el rate-limit detecten bien la IP/protocolo.
if (env.trustProxy) app.set('trust proxy', 1);

// ─── Seguridad ────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(compression());

app.use(
  cors({
    origin: env.corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Rate limiting global (más permisivo en desarrollo para no molestar al probar)
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: env.isDev ? 5000 : 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Demasiadas peticiones. Intentá más tarde.' },
  })
);

// ─── Parsing ──────────────────────────────────────────────────────────────────
// Webhook de MP necesita el body raw para validar la firma
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Archivos subidos (imágenes locales cuando no hay Cloudinary) ───────────────
app.use('/uploads', express.static('uploads'));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'API operativa', env: env.nodeEnv });
});

// ─── SEO (sin prefijo /api: se sirven en la raíz) ───────────────────────────────
app.use('/', seoRouter);

// ─── Rutas ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/cart', cartRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/addresses', addressesRouter);
app.use('/api/wishlist', wishlistRouter);
app.use('/api/coupons', couponsRouter);
app.use('/api/shipping', shippingRouter);
app.use('/api/legal', legalRouter);
app.use('/api/admin', adminRouter);

// ─── Frontend (SPA) + prerender de meta para bots ───────────────────────────────
// Solo si existe frontend/dist (build). En desarrollo el frontend corre aparte (Vite).
setupSpa(app);

// ─── Errores ──────────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
