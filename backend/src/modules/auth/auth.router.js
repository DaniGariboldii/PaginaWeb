import { Router } from 'express';
import {
  registerController,
  loginController,
  logoutController,
  refreshController,
  getMeController,
  updateProfileController,
  changePasswordController,
  forgotPasswordController,
  resetPasswordController,
  verifyEmailController,
  resendVerificationController,
} from './auth.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { authLimiter } from '../../middlewares/rateLimiters.js';

const router = Router();

router.post('/register', authLimiter, registerController);
router.post('/login', authLimiter, loginController);
router.post('/verify-email', authLimiter, verifyEmailController);
router.post('/resend-verification', authLimiter, resendVerificationController);
router.post('/logout', authenticate, logoutController);
router.post('/refresh', refreshController);
router.get('/me', authenticate, getMeController);
router.put('/profile', authenticate, updateProfileController);
router.put('/change-password', authenticate, changePasswordController);

// Recuperación de contraseña (rate-limited por ser endpoints sensibles)
router.post('/forgot-password', authLimiter, forgotPasswordController);
router.post('/reset-password', authLimiter, resetPasswordController);

export default router;
