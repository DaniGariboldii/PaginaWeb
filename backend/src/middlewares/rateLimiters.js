import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

/**
 * Limiter estricto para endpoints sensibles (login, registro, reset de password).
 * No se aplica a /me ni /refresh, que se invocan frecuentemente en uso normal.
 * Más permisivo en desarrollo para no trabar las pruebas.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.isDev ? 200 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Demasiados intentos. Intentá en 15 minutos.' },
});
