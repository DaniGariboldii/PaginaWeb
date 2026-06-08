import multer from 'multer';
import path from 'node:path';
import { AppError } from '../utils/AppError.js';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * Valida archivos de imagen por tipo MIME, extensión y tamaño.
 * Almacena en memoria para subir directo a Cloudinary.
 */
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_MIME.includes(file.mimetype) || !ALLOWED_EXT.includes(ext)) {
    return cb(new AppError('Formato de imagen no permitido. Usá JPG, PNG o WEBP.', 400));
  }
  cb(null, true);
};

export const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE, files: 5 },
  fileFilter,
});

/** Traduce errores de multer a AppError legibles */
export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') return next(new AppError('La imagen supera los 5 MB', 400));
    if (err.code === 'LIMIT_FILE_COUNT') return next(new AppError('Máximo 5 imágenes por producto', 400));
    return next(new AppError(`Error al subir archivo: ${err.message}`, 400));
  }
  next(err);
};
