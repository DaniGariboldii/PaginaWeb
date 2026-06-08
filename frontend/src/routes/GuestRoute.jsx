import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/** Rutas solo para invitados (login, registro, etc.). Si ya hay sesión, redirige al inicio. */
export const GuestRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  if (user) return <Navigate to="/" replace />;
  return <Outlet />;
};
