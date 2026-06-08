import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '../../hooks/useDebounce';
import { productsService } from '../../services/products.service';

const formatPrice = (p) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(p);

export const SearchBar = ({ className = '' }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  const debounced = useDebounce(query.trim(), 300);

  // Buscar al cambiar el término (debounced)
  useEffect(() => {
    if (debounced.length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    productsService
      .list({ search: debounced, limit: 5 })
      .then((res) => {
        if (!cancelled) setResults(res.data.data?.products || []);
      })
      .catch(() => !cancelled && setResults([]))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [debounced]);

  // Cerrar el dropdown al hacer clic afuera
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const goToResults = () => {
    if (!query.trim()) return;
    setOpen(false);
    navigate(`/productos?search=${encodeURIComponent(query.trim())}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    goToResults();
  };

  const selectProduct = (slug) => {
    setOpen(false);
    setQuery('');
    navigate(`/productos/${slug}`);
  };

  const showDropdown = open && query.trim().length >= 2;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder="Buscar productos..."
            className="w-full bg-ink-100 border border-transparent rounded-xl pl-9 pr-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white focus:border-transparent transition"
          />
        </div>
      </form>

      {showDropdown && (
        <div className="absolute mt-2 w-full bg-white rounded-xl shadow-lg border border-ink-200 py-2 z-50 max-h-96 overflow-auto">
          {loading && results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-ink-400">Buscando...</p>
          ) : results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-ink-400">Sin resultados para "{query.trim()}"</p>
          ) : (
            <>
              {results.map((p) => {
                const img = p.images?.find((i) => i.isPrimary)?.url ?? p.images?.[0]?.url;
                const price = p.discountPrice && Number(p.discountPrice) < Number(p.price) ? p.discountPrice : p.price;
                return (
                  <button
                    key={p.id}
                    onClick={() => selectProduct(p.slug)}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-ink-50 text-left"
                  >
                    <div className="w-10 h-10 rounded-lg bg-ink-100 overflow-hidden shrink-0 grid place-items-center">
                      {img ? (
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <svg className="w-5 h-5 text-ink-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-ink-900 truncate">{p.name}</p>
                      <p className="text-xs text-ink-500">{formatPrice(price)}</p>
                    </div>
                  </button>
                );
              })}
              <button
                onClick={goToResults}
                className="w-full text-center px-4 py-2 mt-1 border-t border-ink-100 text-sm font-medium text-brand-600 hover:bg-ink-50"
              >
                Ver todos los resultados
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
