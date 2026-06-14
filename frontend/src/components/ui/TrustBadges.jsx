// Señales de confianza para reducir el abandono (pago seguro, envíos, devoluciones).
// Reutilizable: layout "grid" (footer, horizontal) o "list" (checkout, vertical compacto).

const ICONS = {
  lock: (
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  ),
  truck: (
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0z M3 6a1 1 0 011-1h9a1 1 0 011 1v9H5m-2 0V6m12 9h1a2 2 0 002-2v-2.586a1 1 0 00-.293-.707l-2.414-2.414A1 1 0 0014.586 6H14" />
  ),
  return: (
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M3 10h10a8 8 0 018 8v2M3 10l6-6M3 10l6 6" />
  ),
  shield: (
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  ),
};

const BADGES = [
  { icon: 'lock', title: 'Pago 100% seguro', desc: 'Procesado por Mercado Pago' },
  { icon: 'truck', title: 'Envíos a todo el país', desc: 'A tu casa o punto de retiro' },
  { icon: 'return', title: 'Devoluciones', desc: 'Botón de arrepentimiento' },
  { icon: 'shield', title: 'Compra protegida', desc: 'Tus datos viajan cifrados' },
];

const Icon = ({ name }) => (
  <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7} aria-hidden="true">
    {ICONS[name]}
  </svg>
);

export const TrustBadges = ({ layout = 'grid', className = '' }) => {
  if (layout === 'list') {
    // Compacto y vertical: ideal para la columna de resumen del checkout
    return (
      <ul className={`space-y-2.5 ${className}`}>
        {BADGES.map((b) => (
          <li key={b.title} className="flex items-center gap-2.5 text-ink-600">
            <span className="text-emerald-600"><Icon name={b.icon} /></span>
            <span className="text-xs font-medium leading-tight">{b.title}</span>
          </li>
        ))}
      </ul>
    );
  }

  // Grilla horizontal: ideal para el footer o secciones anchas
  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
      {BADGES.map((b) => (
        <div key={b.title} className="flex items-center gap-3">
          <span className="grid place-items-center w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
            <Icon name={b.icon} />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink-900 leading-tight">{b.title}</p>
            <p className="text-xs text-ink-500 leading-tight">{b.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
