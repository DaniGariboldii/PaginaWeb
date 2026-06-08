import { z } from 'zod';
import * as reviewService from './reviews.service.js';
import { sendSuccess } from '../../utils/response.js';

const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1, 'Mínimo 1 estrella').max(5, 'Máximo 5 estrellas'),
  comment: z.string().max(1000).optional(),
});

export const listReviews = async (req, res, next) => {
  try {
    const data = await reviewService.getProductReviews(req.params.id);
    // Si está autenticado, indicar si puede reseñar
    let canReview = false;
    if (req.user) canReview = await reviewService.hasPurchased(req.user.id, req.params.id);
    sendSuccess(res, { ...data, canReview });
  } catch (err) { next(err); }
};

export const createReview = async (req, res, next) => {
  try {
    const data = reviewSchema.parse(req.body);
    const review = await reviewService.upsertReview(req.user.id, req.params.id, data);
    sendSuccess(res, { review }, 'Reseña guardada', 201);
  } catch (err) { next(err); }
};

export const removeReview = async (req, res, next) => {
  try {
    await reviewService.deleteReview(req.user.id, req.params.id);
    sendSuccess(res, null, 'Reseña eliminada');
  } catch (err) { next(err); }
};
