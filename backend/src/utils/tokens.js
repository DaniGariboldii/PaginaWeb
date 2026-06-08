import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const signAccessToken = (userId, role) =>
  jwt.sign({ sub: userId, role }, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiresIn,
  });

export const signRefreshToken = (userId) =>
  jwt.sign({ sub: userId }, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn,
  });

export const verifyRefreshToken = (token) =>
  jwt.verify(token, env.jwt.refreshSecret);

// sameSite 'none' requiere secure=true sí o sí (navegadores lo exigen)
const sameSite = env.cookieSameSite;
const secure = !env.isDev || sameSite === 'none';

/** Opciones de cookie segura para access token */
export const accessCookieOptions = () => ({
  httpOnly: true,
  secure,
  sameSite,
  maxAge: 15 * 60 * 1000, // 15 min en ms
  path: '/',
});

/** Opciones de cookie segura para refresh token */
export const refreshCookieOptions = () => ({
  httpOnly: true,
  secure,
  sameSite,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días en ms
  path: '/api/auth/refresh',        // solo se envía en el endpoint de refresh
});
