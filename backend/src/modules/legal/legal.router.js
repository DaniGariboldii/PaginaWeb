import { Router } from 'express';
import { retraction, contact } from './legal.controller.js';

const router = Router();

// Públicos (no requieren sesión)
router.post('/arrepentimiento', retraction);
router.post('/contacto', contact);

export default router;
