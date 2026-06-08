import { AppError } from '../utils/AppError.js';

/**
 * Middleware de autorización por rol.
 * Uso: authorize('ADMIN') o authorize('ADMIN', 'CLIENT')
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return next(new AppError('No autenticado', 401));
    if (!roles.includes(req.user.role)) {
      return next(new AppError('No autorizado para esta acción', 403));
    }
    next();
  };
};
