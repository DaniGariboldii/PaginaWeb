import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import prisma from '../config/prisma.js';

/**
 * Verifica el access token en la cookie o en el header Authorization.
 * Adjunta req.user con id, email y role.
 */
export const authenticate = async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      (req.headers.authorization?.startsWith('Bearer ') &&
        req.headers.authorization.split(' ')[1]);

    if (!token) throw new AppError('No autenticado', 401);

    const payload = jwt.verify(token, env.jwt.accessSecret);

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, active: true },
    });

    if (!user || !user.active) throw new AppError('Usuario no encontrado o inactivo', 401);

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return next(new AppError('Token expirado', 401));
    if (err.name === 'JsonWebTokenError') return next(new AppError('Token inválido', 401));
    next(err);
  }
};
