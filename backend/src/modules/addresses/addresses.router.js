import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { listAddresses, addAddress, editAddress, removeAddress } from './addresses.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', listAddresses);
router.post('/', addAddress);
router.put('/:id', editAddress);
router.delete('/:id', removeAddress);

export default router;
