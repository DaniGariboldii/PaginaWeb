import { AppError } from '../utils/AppError.js';
import { env } from '../config/env.js';

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  // Errores de Zod v4 (validación) — usa .issues en Zod v4, .errors en v3
  if (err.name === 'ZodError') {
    const issues = err.issues ?? err.errors ?? [];
    return res.status(400).json({
      success: false,
      message: 'Datos inválidos',
      errors: issues.map((e) => ({ field: e.path.join('.'), message: e.message })),
    });
  }

  // Errores operacionales controlados
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors && { errors: err.errors }),
    });
  }

  // Errores de Prisma conocidos
  if (err.code === 'P2002') {
    return res.status(409).json({ success: false, message: 'El registro ya existe (valor duplicado).' });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ success: false, message: 'Registro no encontrado.' });
  }

  // Error interno desconocido: no exponer detalles en producción
  if (!env.isDev) {
    console.error('[ERROR]', err);
    return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }

  // En desarrollo, exponer el stack para facilitar el debug
  console.error('[ERROR]', err);
  return res.status(err.statusCode || 500).json({
    success: false,
    message: err.message,
    stack: err.stack,
  });
};
