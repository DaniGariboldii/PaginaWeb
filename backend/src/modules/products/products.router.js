import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { optionalAuthenticate } from '../../middlewares/optionalAuthenticate.js';
import { uploadImage, handleMulterError } from '../../middlewares/upload.js';
import {
  listProducts,
  getProduct,
  getProductBySlug,
  getRelated,
  createProduct,
  updateProduct,
  deleteProduct,
} from './products.controller.js';
import { uploadImages, deleteImage, setPrimary } from './images.controller.js';
import { listReviews, createReview, removeReview } from '../reviews/reviews.controller.js';

const router = Router();

// Públicos — opcional auth para que el admin vea productos inactivos también
router.get('/', optionalAuthenticate, listProducts);
router.get('/slug/:slug', getProductBySlug);
router.get('/:id', optionalAuthenticate, getProduct);
router.get('/:id/related', getRelated);

// Reseñas (listado público con flag canReview si está logueado)
router.get('/:id/reviews', optionalAuthenticate, listReviews);
router.post('/:id/reviews', authenticate, createReview);
router.delete('/:id/reviews', authenticate, removeReview);

// Admin — productos
router.post('/', authenticate, authorize('ADMIN'), createProduct);
router.put('/:id', authenticate, authorize('ADMIN'), updateProduct);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteProduct);

// Admin — imágenes
router.post(
  '/:id/images',
  authenticate,
  authorize('ADMIN'),
  uploadImage.array('images', 5),
  handleMulterError,
  uploadImages
);
router.delete('/:id/images/:imageId', authenticate, authorize('ADMIN'), deleteImage);
router.put('/:id/images/:imageId/primary', authenticate, authorize('ADMIN'), setPrimary);

export default router;
