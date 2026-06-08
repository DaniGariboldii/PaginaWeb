import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';
import { Button } from '../../components/ui/Button';

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export const LoginPage = () => {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState('');

  const from = location.state?.from || '/';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    setServerError('');
    try {
      const res = await api.post('/auth/login', data);
      setUser(res.data.data?.user ?? res.data.user);
      navigate(from, { replace: true });
    } catch (err) {
      setServerError(err.response?.data?.message || 'Error al iniciar sesión');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <span className="grid place-items-center w-11 h-11 rounded-2xl bg-brand-600 text-white font-bold text-xl shadow-sm">M</span>
          </Link>
          <h1 className="text-2xl font-bold text-ink-900">Bienvenido de nuevo</h1>
          <p className="text-ink-500 mt-1">Iniciá sesión para continuar</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-ink-200 p-8">
          {serverError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-5">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Contraseña</label>
              <input
                {...register('password')}
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full border border-ink-200 rounded-xl px-4 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
              />
              {errors.password && <p className="text-red-500 text-xs mt-1.5">{errors.password.message}</p>}
              <div className="text-right mt-1.5">
                <Link to="/recuperar" className="text-xs text-brand-600 hover:text-brand-700 font-medium">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full" size="md">
              {isSubmitting ? 'Ingresando...' : 'Ingresar'}
            </Button>
          </form>
        </div>

        <p className="text-sm text-center text-ink-500 mt-6">
          ¿No tenés cuenta?{' '}
          <Link to="/registro" className="text-brand-600 font-semibold hover:text-brand-700">
            Registrate gratis
          </Link>
        </p>
      </div>
    </div>
  );
};
