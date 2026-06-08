import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { provinces, quote, listZones, createZone, updateZone, deleteZone } from './shipping.controller.js';

const router = Router();

// Públicos
router.get('/provinces', provinces);
router.post('/quote', quote);

// Admin — zonas
router.get('/zones', authenticate, authorize('ADMIN'), listZones);
router.post('/zones', authenticate, authorize('ADMIN'), createZone);
router.put('/zones/:id', authenticate, authorize('ADMIN'), updateZone);
router.delete('/zones/:id', authenticate, authorize('ADMIN'), deleteZone);

export default router;
