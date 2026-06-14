import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from '../ui/ThemeToggle';

const navItems = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/productos', label: 'Productos' },
  { to: '/admin/categorias', label: 'Categorías y marcas' },
  { to: '/admin/pedidos', label: 'Pedidos' },
  { to: '/admin/usuarios', label: 'Usuarios' },
  { to: '/admin/stock', label: 'Stock' },
  { to: '/admin/cupones', label: 'Cupones' },
  { to: '/admin/envios', label: 'Envíos' },
  { to: '/admin/reportes', label: 'Reportes' },
];

export const AdminLayout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Cerrar el drawer al navegar
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  return (
    <div className="min-h-screen flex bg-ink-50">
      {/* Backdrop oscuro detrás del drawer en mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-gray-900 text-white flex flex-col transition-transform duration-300 md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-6 py-5 border-b border-gray-700">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid place-items-center w-8 h-8 rounded-lg bg-brand-600 text-white font-bold">M</span>
            <span className="text-lg font-semibold text-brand-400">Panel Admin</span>
          </Link>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-1">
          {navItems.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-gray-700 space-y-1">
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver a la tienda
          </Link>
          <button
            onClick={handleLogout}
            className="block px-3 py-2 rounded-md text-sm font-medium text-gray-400 hover:bg-gray-700 hover:text-white w-full text-left"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="flex-1 overflow-auto min-w-0">
        <header className="sticky top-0 z-10 flex items-center gap-2 px-4 sm:px-8 h-14 bg-white/80 backdrop-blur border-b border-ink-200">
          {/* Hamburguesa para abrir el sidebar en mobile */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden grid place-items-center w-10 h-10 -ml-2 rounded-lg text-ink-700 hover:bg-ink-100 transition-colors"
            aria-label="Abrir menú"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="md:hidden font-semibold text-ink-900">Panel Admin</span>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
