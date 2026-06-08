import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import prisma from '../config/prisma.js';

/**
 * Igual que authenticate, pero nunca falla:
 * si no hay token o es inválido, simplemente no adjunta req.user.
 * Útil en endpoints públicos que muestran datos extra a admins.
 */
export const optionalAuthenticate = async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      (req.headers.authorization?.startsWith('Bearer ') &&
        req.headers.authorization.split(' ')[1]);

    if (!token) return next();

    const payload = jwt.verify(token, env.jwt.accessSecret);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, active: true },
    });

    if (user?.active) req.user = user;
  } catch {
    // token inválido/expirado → continuar sin usuario
  }
  next();
};
