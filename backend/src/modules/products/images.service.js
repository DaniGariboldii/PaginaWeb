import prisma from '../../config/prisma.js';
import cloudinary, { isCloudinaryConfigured } from '../../config/cloudinary.js';
import { AppError } from '../../utils/AppError.js';
import { saveLocalImage, deleteLocalImage } from '../../utils/localStorage.js';

const FOLDER = 'ecommerce/products';

/** Sube un buffer a Cloudinary y devuelve { url, publicId } */
const uploadToCloudinary = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: FOLDER, resource_type: 'image' },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });

/**
 * Sube una o varias imágenes para un producto.
 * Usa Cloudinary si está configurado; si no, guarda en disco local (/uploads).
 */
export const addProductImages = async (productId, files) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { images: true },
  });
  if (!product) throw new AppError('Producto no encontrado', 404);

  const useCloudinary = isCloudinaryConfigured();
  const hadImages = product.images.length > 0;

  const created = [];
  for (let i = 0; i < files.length; i++) {
    const { url, publicId } = useCloudinary
      ? await uploadToCloudinary(files[i].buffer)
      : await saveLocalImage(files[i]);
    const image = await prisma.productImage.create({
      data: {
        productId,
        url,
        publicId,
        // la primera imagen del primer upload es la principal
        isPrimary: !hadImages && i === 0,
      },
    });
    created.push(image);
  }

  return created;
};

/** Elimina una imagen (de Cloudinary y de la DB) */
export const deleteProductImage = async (productId, imageId) => {
  const image = await prisma.productImage.findUnique({ where: { id: imageId } });
  if (!image || image.productId !== productId) throw new AppError('Imagen no encontrada', 404);

  if (image.publicId?.startsWith('local:')) {
    await deleteLocalImage(image.publicId);
  } else if (image.publicId && isCloudinaryConfigured()) {
    try {
      await cloudinary.uploader.destroy(image.publicId);
    } catch {
      // si falla en Cloudinary, igual borramos de la DB para no dejar referencia muerta
    }
  }

  await prisma.productImage.delete({ where: { id: imageId } });

  // si era la principal, promovemos otra
  if (image.isPrimary) {
    const next = await prisma.productImage.findFirst({ where: { productId } });
    if (next) await prisma.productImage.update({ where: { id: next.id }, data: { isPrimary: true } });
  }

  return { deleted: true };
};

/** Marca una imagen como principal */
export const setPrimaryImage = async (productId, imageId) => {
  const image = await prisma.productImage.findUnique({ where: { id: imageId } });
  if (!image || image.productId !== productId) throw new AppError('Imagen no encontrada', 404);

  await prisma.$transaction([
    prisma.productImage.updateMany({ where: { productId }, data: { isPrimary: false } }),
    prisma.productImage.update({ where: { id: imageId }, data: { isPrimary: true } }),
  ]);

  return { updated: true };
};
