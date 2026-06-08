import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

// Carpeta física donde se guardan las imágenes subidas (servida en /uploads)
export const UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'products');

const EXT_BY_MIME = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

/** Guarda un buffer en disco y devuelve { url, publicId } (url relativa servida en /uploads) */
export const saveLocalImage = async (file) => {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  const ext = EXT_BY_MIME[file.mimetype] || path.extname(file.originalname) || '.jpg';
  const filename = `${randomUUID()}${ext}`;
  await fs.writeFile(path.join(UPLOADS_DIR, filename), file.buffer);
  // publicId con prefijo para distinguir de Cloudinary al borrar
  return { url: `/uploads/products/${filename}`, publicId: `local:${filename}` };
};

/** Elimina una imagen local a partir de su publicId (local:<filename>) */
export const deleteLocalImage = async (publicId) => {
  if (!publicId?.startsWith('local:')) return;
  const filename = publicId.slice('local:'.length);
  try {
    await fs.unlink(path.join(UPLOADS_DIR, filename));
  } catch {
    // si no existe, ignorar
  }
};
