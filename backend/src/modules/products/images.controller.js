import * as imagesService from './images.service.js';
import { sendSuccess } from '../../utils/response.js';
import { AppError } from '../../utils/AppError.js';

export const uploadImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      throw new AppError('No se enviaron imágenes', 400);
    }
    const images = await imagesService.addProductImages(req.params.id, req.files);
    sendSuccess(res, { images }, 'Imágenes subidas', 201);
  } catch (err) { next(err); }
};

export const deleteImage = async (req, res, next) => {
  try {
    await imagesService.deleteProductImage(req.params.id, req.params.imageId);
    sendSuccess(res, null, 'Imagen eliminada');
  } catch (err) { next(err); }
};

export const setPrimary = async (req, res, next) => {
  try {
    await imagesService.setPrimaryImage(req.params.id, req.params.imageId);
    sendSuccess(res, null, 'Imagen principal actualizada');
  } catch (err) { next(err); }
};
