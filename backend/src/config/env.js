import 'dotenv/config';

export const env = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV !== 'production',

  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  // URL pública del backend (para el webhook de Mercado Pago en producción)
  backendUrl: process.env.BACKEND_URL || `http://localhost:${process.env.PORT || '4000'}`,
  // Orígenes permitidos por CORS (coma-separados). Si no, usa FRONTEND_URL.
  corsOrigins: (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  // SameSite de cookies: 'strict' (mismo dominio) o 'none' (cross-domain con HTTPS)
  cookieSameSite: process.env.COOKIE_SAMESITE || (process.env.NODE_ENV === 'production' ? 'strict' : 'lax'),
  // Necesario para cookies secure y rate-limit detrás de un proxy (nginx, Railway, etc.)
  trustProxy: process.env.TRUST_PROXY === 'true' || process.env.NODE_ENV === 'production',

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  mercadoPago: {
    accessToken: process.env.MP_ACCESS_TOKEN,
    webhookSecret: process.env.MP_WEBHOOK_SECRET,
    successUrl: process.env.MP_SUCCESS_URL,
    failureUrl: process.env.MP_FAILURE_URL,
    pendingUrl: process.env.MP_PENDING_URL,
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },

  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM || 'MiTienda <no-reply@mitienda.com>',
  },
};

const required = [
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'DATABASE_URL',
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Variable de entorno requerida no definida: ${key}`);
  }
}
