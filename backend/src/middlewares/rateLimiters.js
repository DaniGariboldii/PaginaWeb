import rateLimit from 'express-rate-limit';

/**
 * Limiter estricto para endpoints sensibles (login, registro, reset de password).
 * No se aplica a /me ni /refresh, que se invocan frecuentemente en uso normal.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Demasiados intentos. Intentá en 15 minutos.' },
});
