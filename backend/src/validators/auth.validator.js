import { z } from 'zod';

export const registerSchema = z.object({
  firstName: z.string().min(2, 'Mínimo 2 caracteres').max(50),
  lastName: z.string().min(2, 'Mínimo 2 caracteres').max(50),
  email: z.string().email('Email inválido').toLowerCase(),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
  phone: z.string().max(20).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido').toLowerCase(),
  password: z.string().min(1, 'Requerido'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido').toLowerCase(),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token requerido'),
});

export const resendVerificationSchema = z.object({
  email: z.string().email('Email inválido').toLowerCase(),
});

const strongPassword = z
  .string()
  .min(8, 'Mínimo 8 caracteres')
  .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
  .regex(/[0-9]/, 'Debe contener al menos un número');

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token requerido'),
  password: strongPassword,
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(2, 'Mínimo 2 caracteres').max(50),
  lastName: z.string().min(2, 'Mínimo 2 caracteres').max(50),
  phone: z.string().max(20).optional().or(z.literal('')),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Requerido'),
  newPassword: strongPassword,
});
