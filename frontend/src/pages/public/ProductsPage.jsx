import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productsService, categoriesService, brandsService } from '../../services/products.service';
import { ProductCard } from '../../components/products/ProductCard';
import { PageSpinner } from '../../components/ui/Spinner';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { Seo } from '../../components/ui/Seo';

export const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    categoryId: searchParams.get('categoryId') || '',
    brandId: searchParams.get('brandId') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sort: searchParams.get('sort') || 'relevance',
    page: Number(searchParams.get('page') || 1),
  });

  // Cargar categorías y marcas una sola vez
  useEffect(() => {
    Promise.all([categoriesService.list(), brandsService.list()])
      .then(([catRes, brandRes]) => {
        setCategories(catRes.data.data?.categories || []);
        setBrands(brandRes.data.data?.brands || []);
      })
      .catch(() => {});
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.categoryId) params.categoryId = filters.categoryId;
      if (filters.brandId) params.brandId = filters.brandId;
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;
      if (filters.sort && filters.sort !== 'relevance') params.sort = filters.sort;
      params.page = filters.page;
      params.limit = 12;

      const res = await productsService.list(params);
      setProducts(res.data.data?.products || []);
      setPagination(res.data.data?.pagination || null);
      setSearchParams(params, { replace: true });
    } catch {
      setError('No se pudieron cargar los productos');
    } finally {
      setLoading(false);
    }
  }, [filters, setSearchParams]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleFilter = (key, value) =>
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const inputClass =
    'w-full border border-ink-200 rounded-xl px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition';
  const hasFilters = filters.search || filters.categoryId || filters.brandId || filters.minPrice || filters.maxPrice;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <Seo title="Productos" description="Explorá todo nuestro catálogo de productos con envíos a todo el país." />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ink-900">Productos</h1>
        <p className="text-ink-500 mt-1">Explorá todo nuestro catálogo</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* ── Filtros ───────────────────────────────────────────────────── */}
        <aside className="w-full md:w-72 shrink-0">
          <div className="bg-white border border-ink-200 rounded-2xl p-6 space-y-5 md:sticky md:top-20">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-ink-900">Filtros</h2>
              {hasFilters && (
                <button
                  onClick={() => setFilters({ search: '', categoryId: '', brandId: '', minPrice: '', maxPrice: '', page: 1 })}
                  className="text-xs text-brand-600 font-medium hover:text-brand-700"
                >
                  Limpiar
                </button>
              )}
            </div>

            {/* Búsqueda */}
            <form onSubmit={handleSearch}>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Buscar</label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
                  placeholder="Nombre del producto..."
                  className={`${inputClass} pl-9`}
                />
              </div>
            </form>

            {/* Categorías */}
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Categoría</label>
              <select value={filters.categoryId} onChange={(e) => handleFilter('categoryId', e.target.value)} className={inputClass}>
                <option value="">Todas</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {/* Marcas */}
            {brands.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">Marca</label>
                <select value={filters.brandId} onChange={(e) => handleFilter('brandId', e.target.value)} className={inputClass}>
                  <option value="">Todas</option>
                  {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            )}

            {/* Precio */}
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Precio (ARS)</label>
              <div className="flex gap-2">
                <input type="number" placeholder="Mín" value={filters.minPrice} onChange={(e) => handleFilter('minPrice', e.target.value)} className={inputClass} />
                <input type="number" placeholder="Máx" value={filters.maxPrice} onChange={(e) => handleFilter('maxPrice', e.target.value)} className={inputClass} />
              </div>
            </div>
          </div>
        </aside>

        {/* ── Grid ──────────────────────────────────────────────────────── */}
        <div className="flex-1">
          {error && <div className="mb-4"><ErrorMessage message={error} /></div>}

          {loading ? (
            <PageSpinner />
          ) : products.length === 0 ? (
            <div className="text-center py-24 bg-white border border-ink-200 rounded-2xl">
              <svg className="w-14 h-14 mx-auto text-ink-200 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-lg font-medium text-ink-700 mb-1">No se encontraron productos</p>
              <p className="text-sm text-ink-500">Probá ajustando los filtros</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4 gap-3">
                <p className="text-sm text-ink-500">
                  {pagination?.total} producto{pagination?.total !== 1 ? 's' : ''} encontrado{pagination?.total !== 1 ? 's' : ''}
                </p>
                <select
                  value={filters.sort}
                  onChange={(e) => handleFilter('sort', e.target.value)}
                  className="border border-ink-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="relevance">Más relevantes</option>
                  <option value="newest">Más nuevos</option>
                  <option value="price_asc">Precio: menor a mayor</option>
                  <option value="price_desc">Precio: mayor a menor</option>
                  <option value="name_asc">Nombre (A-Z)</option>
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>

              {/* Paginación */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-3 mt-12">
                  <button
                    disabled={filters.page === 1}
                    onClick={() => handleFilter('page', filters.page - 1)}
                    className="px-4 py-2 bg-white border border-ink-200 rounded-xl text-sm font-medium text-ink-700 disabled:opacity-40 hover:bg-ink-50 transition"
                  >
                    Anterior
                  </button>
                  <span className="text-sm text-ink-500">
                    Página {pagination.page} de {pagination.totalPages}
                  </span>
                  <button
                    disabled={filters.page === pagination.totalPages}
                    onClick={() => handleFilter('page', filters.page + 1)}
                    className="px-4 py-2 bg-white border border-ink-200 rounded-xl text-sm font-medium text-ink-700 disabled:opacity-40 hover:bg-ink-50 transition"
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
