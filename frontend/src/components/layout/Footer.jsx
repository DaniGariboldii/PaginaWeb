import { Link } from 'react-router-dom';

export const Footer = () => (
  <footer className="bg-white border-t border-ink-200 mt-auto">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
        {/* Marca */}
        <div className="col-span-2 md:col-span-1">
          <Link to="/" className="flex items-center gap-2 mb-3">
            <span className="grid place-items-center w-9 h-9 rounded-xl bg-brand-600 text-white font-bold text-lg">M</span>
            <span className="text-lg font-bold text-ink-900">MiTienda</span>
          </Link>
          <p className="text-sm text-ink-500 leading-relaxed">
            Tu tienda online de confianza. Productos de calidad con envíos a todo el país.
          </p>
        </div>

        {/* Tienda */}
        <div>
          <h4 className="text-sm font-semibold text-ink-900 mb-3">Tienda</h4>
          <ul className="space-y-2 text-sm text-ink-500">
            <li><Link to="/productos" className="hover:text-brand-600">Productos</Link></li>
            <li><Link to="/carrito" className="hover:text-brand-600">Carrito</Link></li>
            <li><Link to="/mis-pedidos" className="hover:text-brand-600">Mis pedidos</Link></li>
          </ul>
        </div>

        {/* Ayuda */}
        <div>
          <h4 className="text-sm font-semibold text-ink-900 mb-3">Ayuda</h4>
          <ul className="space-y-2 text-sm text-ink-500">
            <li><Link to="/contacto" className="hover:text-brand-600">Contacto</Link></li>
            <li><Link to="/preguntas-frecuentes" className="hover:text-brand-600">Preguntas frecuentes</Link></li>
          </ul>
        </div>

        {/* Cuenta */}
        <div>
          <h4 className="text-sm font-semibold text-ink-900 mb-3">Cuenta</h4>
          <ul className="space-y-2 text-sm text-ink-500">
            <li><Link to="/login" className="hover:text-brand-600">Iniciar sesión</Link></li>
            <li><Link to="/registro" className="hover:text-brand-600">Registrarse</Link></li>
            <li><Link to="/perfil" className="hover:text-brand-600">Mi perfil</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-ink-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-sm text-ink-500">© {new Date().getFullYear()} MiTienda. Todos los derechos reservados.</p>
        <p className="text-xs text-ink-500">Hecho en Argentina 🇦🇷</p>
      </div>
    </div>
  </footer>
);
