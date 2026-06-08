import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import api from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Seo } from '../../components/ui/Seo';

const schema = z
  .object({
    password: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .regex(/[A-Z]/, 'Debe tener al menos una mayúscula')
      .regex(/[0-9]/, 'Debe tener al menos un número'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

const inputClass =
  'w-full border border-ink-200 rounded-xl px-4 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition';

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [serverError, setServerError] = useState('');
  const [done, setDone] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    setServerError('');
    try {
      await api.post('/auth/reset-password', { token, password: data.password });
      setDone(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setServerError(err.response?.data?.message || 'No se pudo restablecer la contraseña.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <Seo title="Restablecer contraseña" />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <span className="grid place-items-center w-11 h-11 rounded-2xl bg-brand-600 text-white font-bold text-xl shadow-sm">M</span>
          </Link>
          <h1 className="text-2xl font-bold text-ink-900">Nueva contraseña</h1>
          <p className="text-ink-500 mt-1">Elegí una contraseña segura</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-ink-200 p-8">
          {!token ? (
            <div className="text-center text-sm text-ink-500">
              Enlace inválido. Solicitá uno nuevo desde{' '}
              <Link to="/recuperar" className="text-brand-600 font-medium hover:underline">recuperar contraseña</Link>.
            </div>
          ) : done ? (
            <div className="text-center">
              <span className="grid place-items-center w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 mx-auto mb-4">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <p className="text-ink-700 font-medium mb-1">¡Contraseña actualizada!</p>
              <p className="text-sm text-ink-500">Te estamos redirigiendo al inicio de sesión...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {serverError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{serverError}</div>
              )}
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">Nueva contraseña</label>
                <input {...register('password')} type="password" autoComplete="new-password" placeholder="Mínimo 8 caracteres" className={inputClass} />
                {errors.password && <p className="text-red-500 text-xs mt-1.5">{errors.password.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">Confirmar contraseña</label>
                <input {...register('confirmPassword')} type="password" autoComplete="new-password" placeholder="••••••••" className={inputClass} />
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1.5">{errors.confirmPassword.message}</p>}
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? 'Guardando...' : 'Cambiar contraseña'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
