import * as authService from './auth.service.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  changePasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema,
} from '../../validators/auth.validator.js';
import { sendSuccess } from '../../utils/response.js';
import { accessCookieOptions, refreshCookieOptions } from '../../utils/tokens.js';

const setTokenCookies = (res, accessToken, refreshToken) => {
  res.cookie('accessToken', accessToken, accessCookieOptions());
  res.cookie('refreshToken', refreshToken, refreshCookieOptions());
};

const clearTokenCookies = (res) => {
  res.clearCookie('accessToken', { path: '/' });
  res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
};

export const registerController = async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const { user } = await authService.register(data);
    // No inicia sesión: debe verificar el email primero
    sendSuccess(res, { user, requiresVerification: true }, 'Cuenta creada. Te enviamos un email para verificar tu cuenta.', 201);
  } catch (err) {
    next(err);
  }
};

export const verifyEmailController = async (req, res, next) => {
  try {
    const { token } = verifyEmailSchema.parse(req.body);
    const { user, accessToken, refreshToken } = await authService.verifyEmail(token);
    setTokenCookies(res, accessToken, refreshToken); // queda logueado tras verificar
    sendSuccess(res, { user }, 'Email verificado. ¡Bienvenido!');
  } catch (err) {
    next(err);
  }
};

export const resendVerificationController = async (req, res, next) => {
  try {
    const { email } = resendVerificationSchema.parse(req.body);
    await authService.resendVerification(email);
    sendSuccess(res, null, 'Si tu cuenta no estaba verificada, te reenviamos el email.');
  } catch (err) {
    next(err);
  }
};

export const loginController = async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const { user, accessToken, refreshToken } = await authService.login(data);
    setTokenCookies(res, accessToken, refreshToken);
    sendSuccess(res, { user }, 'Sesión iniciada');
  } catch (err) {
    next(err);
  }
};

export const logoutController = (req, res) => {
  clearTokenCookies(res);
  sendSuccess(res, null, 'Sesión cerrada');
};

export const refreshController = async (req, res, next) => {
  try {
    const oldToken = req.cookies?.refreshToken;
    const { user, accessToken, refreshToken } = await authService.refresh(oldToken);
    setTokenCookies(res, accessToken, refreshToken);
    sendSuccess(res, { user }, 'Token renovado');
  } catch (err) {
    next(err);
  }
};

export const getMeController = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.id);
    sendSuccess(res, { user });
  } catch (err) {
    next(err);
  }
};

export const updateProfileController = async (req, res, next) => {
  try {
    const data = updateProfileSchema.parse(req.body);
    const user = await authService.updateProfile(req.user.id, data);
    sendSuccess(res, { user }, 'Perfil actualizado');
  } catch (err) {
    next(err);
  }
};

export const changePasswordController = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    await authService.changePassword(req.user.id, currentPassword, newPassword);
    sendSuccess(res, null, 'Contraseña actualizada');
  } catch (err) {
    next(err);
  }
};

export const forgotPasswordController = async (req, res, next) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);
    await authService.requestPasswordReset(email);
    // Respuesta genérica: no revela si el email existe
    sendSuccess(res, null, 'Si el email está registrado, te enviamos las instrucciones.');
  } catch (err) {
    next(err);
  }
};

export const resetPasswordController = async (req, res, next) => {
  try {
    const { token, password } = resetPasswordSchema.parse(req.body);
    await authService.resetPassword(token, password);
    sendSuccess(res, null, 'Contraseña actualizada. Ya podés iniciar sesión.');
  } catch (err) {
    next(err);
  }
};
