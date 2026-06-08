import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { getWishlist, getWishlistIds, addItem, removeItem } from './wishlist.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', getWishlist);
router.get('/ids', getWishlistIds);
router.post('/:productId', addItem);
router.delete('/:productId', removeItem);

export default router;
