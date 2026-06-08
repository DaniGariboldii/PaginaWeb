/**
 * Respuesta estándar de éxito.
 */
export const sendSuccess = (res, data = null, message = 'OK', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Respuesta estándar de error.
 * No expone detalles internos en producción.
 */
export const sendError = (res, message = 'Error interno', statusCode = 500, errors = null) => {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
};
