import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import prisma from '../../config/prisma.js';
import { AppError } from '../../utils/AppError.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/tokens.js';
import { sendMail } from '../../config/mailer.js';
import { env } from '../../config/env.js';

const BCRYPT_ROUNDS = 12;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora
const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

/** Genera y envía el email de verificación para un usuario */
const sendVerificationEmail = async (user) => {
  // Invalidar tokens previos
  await prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } });

  const rawToken = crypto.randomBytes(32).toString('hex');
  await prisma.emailVerificationToken.create({
    data: { userId: user.id, tokenHash: hashToken(rawToken), expiresAt: new Date(Date.now() + VERIFY_TOKEN_TTL_MS) },
  });

  const url = `${env.frontendUrl}/verificar?token=${rawToken}`;
  await sendMail({
    to: user.email,
    subject: 'Verificá tu email — MiTienda',
    text: `Hola ${user.firstName}, confirmá tu email entrando a: ${url} (válido por 24 horas).`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#4f46e5">Confirmá tu email</h2>
        <p>Hola ${user.firstName}, gracias por registrarte en MiTienda. Verificá tu correo para activar tu cuenta.</p>
        <p style="margin:24px 0">
          <a href="${url}" style="background:#4f46e5;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600">
            Verificar mi email
          </a>
        </p>
        <p style="color:#64748b;font-size:14px">Este enlace vence en 24 horas. Si no te registraste, ignorá este mensaje.</p>
      </div>`,
  });
};

/**
 * Registra un usuario nuevo (sin verificar) y le envía el email de verificación.
 * NO inicia sesión: el usuario debe verificar su email antes de poder ingresar.
 */
export const register = async ({ firstName, lastName, email, password, phone }) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError('El email ya está registrado', 409);

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      passwordHash,
      phone,
      emailVerified: false,
      cart: { create: {} }, // carrito vacío desde el primer momento
    },
    select: { id: true, firstName: true, lastName: true, email: true, role: true },
  });

  await sendVerificationEmail(user);
  return { user };
};

/** Verifica credenciales y devuelve tokens (requiere email verificado) */
export const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });

  // Siempre ejecutar bcrypt aunque no exista el usuario (evita timing attacks)
  const dummyHash = '$2b$12$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
  const passwordHash = user?.passwordHash ?? dummyHash;
  const valid = await bcrypt.compare(password, passwordHash);

  if (!user || !valid) throw new AppError('Email o contraseña incorrectos', 401);
  if (!user.active) throw new AppError('Cuenta desactivada', 403);
  if (!user.emailVerified) throw new AppError('Verificá tu email antes de iniciar sesión. Revisá tu casilla.', 403);

  const safeUser = { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role };
  return { user: safeUser, accessToken: signAccessToken(user.id, user.role), refreshToken: signRefreshToken(user.id) };
};

/** Verifica el email con el token enviado. Marca verificado e inicia sesión. */
export const verifyEmail = async (rawToken) => {
  const record = await prisma.emailVerificationToken.findUnique({ where: { tokenHash: hashToken(rawToken) } });
  if (!record || record.expiresAt < new Date()) {
    throw new AppError('El enlace de verificación es inválido o expiró.', 400);
  }

  const user = await prisma.user.update({
    where: { id: record.userId },
    data: { emailVerified: true },
    select: { id: true, firstName: true, lastName: true, email: true, role: true },
  });
  await prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } });

  return { user, accessToken: signAccessToken(user.id, user.role), refreshToken: signRefreshToken(user.id) };
};

/** Reenvía el email de verificación (silencioso: no revela si el email existe) */
export const resendVerification = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.emailVerified) return; // ya verificado o no existe → no hacer nada
  await sendVerificationEmail(user);
};

/** Rota el refresh token */
export const refresh = async (oldRefreshToken) => {
  if (!oldRefreshToken) throw new AppError('Refresh token requerido', 401);

  let payload;
  try {
    payload = verifyRefreshToken(oldRefreshToken);
  } catch {
    throw new AppError('Refresh token inválido o expirado', 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, role: true, active: true },
  });

  if (!user || !user.active) throw new AppError('Usuario no encontrado', 401);

  return {
    user,
    accessToken: signAccessToken(user.id, user.role),
    refreshToken: signRefreshToken(user.id),
  };
};

/**
 * Solicita un reset de contraseña.
 * No revela si el email existe (siempre responde igual desde el controller).
 * Si existe y está activo, genera un token, lo guarda hasheado y envía el email.
 */
export const requestPasswordReset = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active) return; // silencioso: no filtrar existencia

  // Invalidar tokens previos sin usar
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });

  const rawToken = crypto.randomBytes(32).toString('hex');
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    },
  });

  const resetUrl = `${env.frontendUrl}/restablecer?token=${rawToken}`;

  await sendMail({
    to: user.email,
    subject: 'Restablecé tu contraseña — MiTienda',
    text: `Hola ${user.firstName}, para restablecer tu contraseña entrá a: ${resetUrl} (válido por 1 hora).`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#4f46e5">Restablecé tu contraseña</h2>
        <p>Hola ${user.firstName}, recibimos una solicitud para restablecer tu contraseña.</p>
        <p style="margin:24px 0">
          <a href="${resetUrl}" style="background:#4f46e5;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600">
            Cambiar contraseña
          </a>
        </p>
        <p style="color:#64748b;font-size:14px">Este enlace vence en 1 hora. Si no lo solicitaste, ignorá este email.</p>
      </div>`,
  });
};

/** Restablece la contraseña usando un token válido (no expirado ni usado) */
export const resetPassword = async (rawToken, newPassword) => {
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(rawToken) },
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    throw new AppError('El enlace es inválido o expiró. Solicitá uno nuevo.', 400);
  }

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    // invalidar cualquier otro token pendiente del usuario
    prisma.passwordResetToken.deleteMany({ where: { userId: record.userId, usedAt: null } }),
  ]);
};

/** Devuelve el perfil del usuario autenticado */
export const getMe = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, firstName: true, lastName: true, email: true, phone: true, role: true, createdAt: true },
  });
  if (!user) throw new AppError('Usuario no encontrado', 404);
  return user;
};

/** Actualiza datos básicos del perfil (no email ni rol) */
export const updateProfile = async (userId, { firstName, lastName, phone }) => {
  return prisma.user.update({
    where: { id: userId },
    data: { firstName, lastName, phone: phone ?? null },
    select: { id: true, firstName: true, lastName: true, email: true, phone: true, role: true },
  });
};

/** Cambia la contraseña verificando la actual */
export const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('Usuario no encontrado', 404);

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw new AppError('La contraseña actual es incorrecta', 400);

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
};
