import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useState } from 'react';
import { Button } from '../../components/ui/Button';

const schema = z
  .object({
    firstName: z.string().min(2, 'Mínimo 2 caracteres'),
    lastName: z.string().min(2, 'Mínimo 2 caracteres'),
    email: z.string().email('Email inválido'),
    phone: z.string().optional(),
    password: z.string().min(8, 'Mínimo 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

const inputClass =
  'w-full border border-ink-200 rounded-xl px-4 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition';

export const RegisterPage = () => {
  const [serverError, setServerError] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    setServerError('');
    const { confirmPassword, ...payload } = data;
    try {
      await api.post('/auth/register', payload);
      setRegisteredEmail(payload.email); // mostramos pantalla "verificá tu email"
    } catch (err) {
      setServerError(err.response?.data?.message || 'Error al registrarse');
    }
  };

  // Pantalla de "revisá tu email" tras registrarse
  if (registeredEmail) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-2xl shadow-sm border border-ink-200 p-8">
            <span className="grid place-items-center w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 mx-auto mb-4">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </span>
            <h1 className="text-2xl font-bold text-ink-900 mb-2">Verificá tu email</h1>
            <p className="text-ink-500 text-sm">
              Te enviamos un correo a <strong className="text-ink-700">{registeredEmail}</strong> con un enlace para
              activar tu cuenta. Revisá tu bandeja de entrada (y la carpeta de spam).
            </p>
            <Link to="/login" className="mt-6 inline-block text-brand-600 font-semibold hover:text-brand-700 text-sm">
              Volver a iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <span className="grid place-items-center w-11 h-11 rounded-2xl bg-brand-600 text-white font-bold text-xl shadow-sm">M</span>
          </Link>
          <h1 className="text-2xl font-bold text-ink-900">Creá tu cuenta</h1>
          <p className="text-ink-500 mt-1">Es rápido y gratis</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-ink-200 p-8">
          {serverError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-5">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">Nombre</label>
                <input {...register('firstName')} autoComplete="given-name" className={inputClass} />
                {errors.firstName && <p className="text-red-500 text-xs mt-1.5">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">Apellido</label>
                <input {...register('lastName')} autoComplete="family-name" className={inputClass} />
                {errors.lastName && <p className="text-red-500 text-xs mt-1.5">{errors.lastName.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Email</label>
              <input {...register('email')} type="email" autoComplete="email" placeholder="tu@email.com" className={inputClass} />
              {errors.email && <p className="text-red-500 text-xs mt-1.5">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Teléfono <span className="text-ink-400 font-normal">(opcional)</span></label>
              <input {...register('phone')} type="tel" autoComplete="tel" placeholder="11 1234 5678" className={inputClass} />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Contraseña</label>
              <input {...register('password')} type="password" autoComplete="new-password" placeholder="Mínimo 8 caracteres" className={inputClass} />
              {errors.password && <p className="text-red-500 text-xs mt-1.5">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Confirmar contraseña</label>
              <input {...register('confirmPassword')} type="password" autoComplete="new-password" placeholder="••••••••" className={inputClass} />
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1.5">{errors.confirmPassword.message}</p>}
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
            </Button>
          </form>
        </div>

        <p className="text-sm text-center text-ink-500 mt-6">
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="text-brand-600 font-semibold hover:text-brand-700">
            Iniciá sesión
          </Link>
        </p>
      </div>
    </div>
  );
};
