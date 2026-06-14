import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useState, useRef, useEffect } from 'react';
import { SearchBar } from '../products/SearchBar';
import { ThemeToggle } from '../ui/ThemeToggle';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef(null);
  const location = useLocation();
  const onSaleActive = location.pathname === '/productos' && location.search.includes('onSale=true');

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Cerrar el menú mobile al navegar a otra página
  useEffect(() => { setMobileOpen(false); }, [location.pathname, location.search]);

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-ink-200/70 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="grid place-items-center w-9 h-9 rounded-xl bg-brand-600 text-white font-bold text-lg shadow-sm">
            M
          </span>
          <span className="text-xl font-bold text-ink-900 tracking-tight hidden sm:block">MiTienda</span>
        </Link>

        {/* Búsqueda global (centro) */}
        <SearchBar className="flex-1 max-w-xl" />

        {/* Acciones */}
        <div className="flex items-center gap-2 sm:gap-3">
          <NavLink
            to="/productos"
            end
            className={({ isActive }) =>
              `hidden md:block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive && !onSaleActive ? 'text-brand-700 bg-brand-50' : 'text-ink-500 hover:text-ink-900 hover:bg-ink-100'
              }`
            }
          >
            Productos
          </NavLink>
          <Link
            to="/productos?onSale=true"
            className={`hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
              onSaleActive ? 'text-rose-700 bg-rose-50' : 'text-rose-600 hover:text-rose-700 hover:bg-rose-50'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5a1.99 1.99 0 011.41.59l7 7a2 2 0 010 2.82l-5 5a2 2 0 01-2.82 0l-7-7A1.99 1.99 0 014 9V4a1 1 0 011-1z" />
            </svg>
            Ofertas
          </Link>
          <ThemeToggle />
          <Link
            to="/carrito"
            className="relative grid place-items-center w-10 h-10 rounded-xl text-ink-700 hover:bg-ink-100 transition-colors"
            aria-label="Carrito"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-brand-600 text-white text-[11px] font-semibold rounded-full min-w-5 h-5 px-1 grid place-items-center ring-2 ring-white">
                {itemCount}
              </span>
            )}
          </Link>

          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-xl hover:bg-ink-100 transition-colors"
              >
                <span className="grid place-items-center w-8 h-8 rounded-lg bg-brand-100 text-brand-700 font-semibold text-sm">
                  {user.firstName?.[0]?.toUpperCase() ?? 'U'}
                </span>
                <span className="hidden sm:block text-sm font-medium text-ink-700 max-w-24 truncate">
                  {user.firstName}
                </span>
                <svg className="w-4 h-4 text-ink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-ink-200 py-1.5 animate-fade-in-up">
                  {user.role === 'ADMIN' && (
                    <Link to="/admin" onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-brand-700 font-medium hover:bg-brand-50">
                      Panel admin
                    </Link>
                  )}
                  <Link to="/perfil" onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-ink-700 hover:bg-ink-50">Mi perfil</Link>
                  <Link to="/mis-pedidos" onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-ink-700 hover:bg-ink-50">Mis pedidos</Link>
                  <Link to="/favoritos" onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-ink-700 hover:bg-ink-50">Mis favoritos</Link>
                  <Link to="/direcciones" onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-ink-700 hover:bg-ink-50">Mis direcciones</Link>
                  <div className="border-t border-ink-100 my-1" />
                  <button onClick={() => { setMenuOpen(false); logout(); }}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="hidden sm:block px-4 py-2 text-sm font-medium text-ink-700 hover:text-ink-900">
                Iniciar sesión
              </Link>
              <Link to="/registro"
                className="px-4 py-2.5 text-sm font-semibold bg-brand-600 text-white rounded-xl hover:bg-brand-700 shadow-sm hover:shadow-md transition-all active:scale-[0.98]">
                Registrarse
              </Link>
            </div>
          )}

          {/* Botón hamburguesa (solo mobile) */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="md:hidden grid place-items-center w-10 h-10 rounded-xl text-ink-700 hover:bg-ink-100 transition-colors"
            aria-label="Menú"
            aria-expanded={mobileOpen}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* ── Menú mobile desplegable ──────────────────────────────────────── */}
      {mobileOpen && (
        <nav className="md:hidden border-t border-ink-200/70 bg-white px-4 py-3 space-y-1 animate-fade-in-up">
          <Link
            to="/productos"
            className="block px-3 py-2.5 rounded-lg text-sm font-medium text-ink-700 hover:bg-ink-100"
          >
            Productos
          </Link>
          <Link
            to="/productos?onSale=true"
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold text-rose-600 hover:bg-rose-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5a1.99 1.99 0 011.41.59l7 7a2 2 0 010 2.82l-5 5a2 2 0 01-2.82 0l-7-7A1.99 1.99 0 014 9V4a1 1 0 011-1z" />
            </svg>
            Ofertas
          </Link>
          {!user && (
            <Link
              to="/login"
              className="block px-3 py-2.5 rounded-lg text-sm font-medium text-ink-700 hover:bg-ink-100"
            >
              Iniciar sesión
            </Link>
          )}
        </nav>
      )}
    </header>
  );
};
