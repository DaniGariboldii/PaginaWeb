import { useEffect, useState, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../../components/ui/Spinner';
import { Button } from '../../components/ui/Button';
import { Seo } from '../../components/ui/Seo';

export const VerifyEmailPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const token = params.get('token');
  const [status, setStatus] = useState('loading'); // loading | ok | error
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;

    if (!token) { setStatus('error'); return; }
    api.post('/auth/verify-email', { token })
      .then((res) => {
        setUser(res.data.data?.user ?? null); // queda logueado
        setStatus('ok');
        setTimeout(() => navigate('/'), 2000);
      })
      .catch(() => setStatus('error'));
  }, [token, setUser, navigate]);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <Seo title="Verificar email" />
      <div className="w-full max-w-md text-center">
        <div className="bg-white rounded-2xl shadow-sm border border-ink-200 p-8">
          {status === 'loading' && (
            <>
              <Spinner className="h-10 w-10 mx-auto mb-4" />
              <p className="text-ink-600">Verificando tu email...</p>
            </>
          )}

          {status === 'ok' && (
            <>
              <span className="grid place-items-center w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 mx-auto mb-4">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <h1 className="text-2xl font-bold text-ink-900 mb-2">¡Email verificado!</h1>
              <p className="text-ink-500 text-sm">Tu cuenta está activa. Te llevamos al inicio...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <span className="grid place-items-center w-14 h-14 rounded-2xl bg-red-100 text-red-600 mx-auto mb-4">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </span>
              <h1 className="text-2xl font-bold text-ink-900 mb-2">Enlace inválido o vencido</h1>
              <p className="text-ink-500 text-sm mb-6">
                El enlace de verificación no es válido o ya expiró. Podés pedir uno nuevo desde el inicio de sesión.
              </p>
              <Button as="link" to="/login">Ir a iniciar sesión</Button>
            </>
          )}
        </div>
        {status !== 'ok' && (
          <p className="text-sm text-center text-ink-500 mt-6">
            <Link to="/" className="text-brand-600 font-semibold hover:text-brand-700">Volver al inicio</Link>
          </p>
        )}
      </div>
    </div>
  );
};
