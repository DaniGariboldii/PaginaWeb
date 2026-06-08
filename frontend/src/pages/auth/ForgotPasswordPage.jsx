import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import api from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Seo } from '../../components/ui/Seo';

const schema = z.object({ email: z.string().email('Email inválido') });

export const ForgotPasswordPage = () => {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    setServerError('');
    try {
      await api.post('/auth/forgot-password', data);
      setSent(true);
    } catch (err) {
      setServerError(err.response?.data?.message || 'Ocurrió un error. Intentá de nuevo.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <Seo title="Recuperar contraseña" />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <span className="grid place-items-center w-11 h-11 rounded-2xl bg-brand-600 text-white font-bold text-xl shadow-sm">M</span>
          </Link>
          <h1 className="text-2xl font-bold text-ink-900">Recuperar contraseña</h1>
          <p className="text-ink-500 mt-1">Te enviaremos un enlace para restablecerla</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-ink-200 p-8">
          {sent ? (
            <div className="text-center">
              <span className="grid place-items-center w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 mx-auto mb-4">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <p className="text-ink-700 font-medium mb-2">Revisá tu email</p>
              <p className="text-sm text-ink-500">
                Si el email está registrado, te enviamos las instrucciones para restablecer tu contraseña.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {serverError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{serverError}</div>
              )}
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">Email</label>
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  placeholder="tu@email.com"
                  className="w-full border border-ink-200 rounded-xl px-4 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1.5">{errors.email.message}</p>}
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? 'Enviando...' : 'Enviar enlace'}
              </Button>
            </form>
          )}
        </div>

        <p className="text-sm text-center text-ink-500 mt-6">
          <Link to="/login" className="text-brand-600 font-semibold hover:text-brand-700">Volver a iniciar sesión</Link>
        </p>
      </div>
    </div>
  );
};
