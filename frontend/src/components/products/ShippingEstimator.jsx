import { useState, useEffect } from 'react';
import { shippingService } from '../../services/orders.service';
import { AR_PROVINCES } from '../../utils/provinces';
import { formatPrice } from '../../utils/format';

// Estimador de envío en la página de producto: el visitante elige su provincia y ve
// el costo (o "Gratis") y el plazo aproximado, sin tener que llegar al checkout.
// La provincia elegida se recuerda en localStorage para no volver a pedirla.
const STORAGE_KEY = 'shipping_province';

export const ShippingEstimator = ({ price = 0 }) => {
  const [province, setProvince] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) || ''; } catch { return ''; }
  });
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!province) { setQuote(null); return; }
    let active = true;
    setLoading(true);
    shippingService.quote(province, price)
      .then(({ data }) => { if (active) setQuote(data.data); })
      .catch(() => { if (active) setQuote(null); })
      .finally(() => { if (active) setLoading(false); });
    try { localStorage.setItem(STORAGE_KEY, province); } catch { /* ignora */ }
    return () => { active = false; };
  }, [province, price]);

  return (
    <div className="border border-ink-200 rounded-xl p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-5 h-5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0z M3 6a1 1 0 011-1h9a1 1 0 011 1v9H5m-2 0V6m12 9h1a2 2 0 002-2v-2.586a1 1 0 00-.293-.707l-2.414-2.414A1 1 0 0014.586 6H14" />
        </svg>
        <h2 className="text-sm font-semibold text-ink-900">Calculá tu envío</h2>
      </div>

      <select
        value={province}
        onChange={(e) => setProvince(e.target.value)}
        className="w-full border border-ink-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
      >
        <option value="">Elegí tu provincia</option>
        {AR_PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
      </select>

      {loading && <p className="text-sm text-ink-400 mt-3">Calculando…</p>}

      {!loading && quote && (
        <div className="mt-3 space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-600">Costo de envío</span>
            {quote.free ? (
              <span className="font-semibold text-emerald-600">¡Gratis!</span>
            ) : (
              <span className="font-semibold text-ink-900">{formatPrice(quote.cost)}</span>
            )}
          </div>
          <p className="text-xs text-ink-500">Entrega estimada: 3 a 7 días hábiles</p>
          {!quote.free && quote.freeThreshold && (
            <p className="text-xs text-emerald-600">
              Envío gratis en compras desde {formatPrice(quote.freeThreshold)}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
