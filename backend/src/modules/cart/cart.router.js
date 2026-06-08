import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { getCart, addItem, updateItem, removeItem, clearCart } from './cart.controller.js';

const router = Router();

router.use(authenticate); // todo el carrito requiere sesión

router.get('/', getCart);
router.post('/items', addItem);
router.put('/items/:id', updateItem);
router.delete('/clear', clearCart);          // antes de /items/:id
router.delete('/items/:id', removeItem);

export default router;
