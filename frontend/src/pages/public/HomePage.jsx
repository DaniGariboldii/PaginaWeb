import { Link } from 'react-router-dom';
import { useFetch } from '../../hooks/useFetch';
import { productsService, categoriesService } from '../../services/products.service';
import { ProductCard } from '../../components/products/ProductCard';
import { PageSpinner } from '../../components/ui/Spinner';
import { Button } from '../../components/ui/Button';
import { Seo } from '../../components/ui/Seo';
import { useAuth } from '../../context/AuthContext';

const categoryIcons = {
  default: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
};

export const HomePage = () => {
  const { user } = useAuth();
  const { data: featuredData, loading: loadingFeatured } = useFetch(
    () => productsService.list({ featured: 'true', limit: 4 }),
    []
  );
  const { data: catData } = useFetch(() => categoriesService.list(), []);

  const featured = featuredData?.products || [];
  const categories = catData?.categories || [];

  return (
    <div>
      <Seo />
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800">
        {/* Decoración */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-400 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-20 w-96 h-96 bg-brand-300 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-24 md:py-32">
          <div className="max-w-2xl animate-fade-in-up">
            <span className="inline-flex items-center gap-2 bg-white/10 text-white/90 text-sm font-medium px-4 py-1.5 rounded-full backdrop-blur-sm mb-6 border border-white/15">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Envíos a todo el país
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight tracking-tight mb-6">
              Todo lo que buscás,<br />
              <span className="text-brand-200">en un solo lugar</span>
            </h1>
            <p className="text-lg md:text-xl text-brand-100 mb-8 leading-relaxed">
              Descubrí productos de calidad al mejor precio. Comprá fácil, rápido y seguro.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button as="link" to="/productos" variant="light" size="lg">
                Explorar catálogo
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Button>
            </div>
          </div>
        </div>

        {/* Onda inferior */}
        <div className="relative h-12">
          <svg className="absolute bottom-0 w-full h-12 text-ink-50" preserveAspectRatio="none" viewBox="0 0 1440 48" fill="currentColor">
            <path d="M0 48h1440V0c-240 32-480 48-720 48S240 32 0 0v48z" />
          </svg>
        </div>
      </section>

      {/* ── Beneficios ────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 -mt-4 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { title: 'Envío rápido', desc: 'Recibí tu compra en 24-72hs', icon: 'M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0' },
            { title: 'Pago seguro', desc: 'Protegido con Mercado Pago', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
            { title: 'Soporte', desc: 'Atención personalizada', icon: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z' },
          ].map((b) => (
            <div key={b.title} className="flex items-center gap-4 bg-white border border-ink-200 rounded-2xl p-5 shadow-sm">
              <span className="grid place-items-center w-12 h-12 rounded-xl bg-brand-50 text-brand-600 shrink-0">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={b.icon} />
                </svg>
              </span>
              <div>
                <p className="font-semibold text-ink-900">{b.title}</p>
                <p className="text-sm text-ink-500">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Categorías ────────────────────────────────────────────────── */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-ink-900">Explorá por categoría</h2>
              <p className="text-ink-500 mt-1">Encontrá lo que necesitás más rápido</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/productos?categoryId=${cat.id}`}
                className="group bg-white border border-ink-200 rounded-2xl p-6 hover:border-brand-300 hover:shadow-lg hover:shadow-ink-900/5 transition-all"
              >
                <span className="grid place-items-center w-12 h-12 rounded-xl bg-brand-50 text-brand-600 mb-4 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={categoryIcons.default} />
                  </svg>
                </span>
                <p className="font-semibold text-ink-900 group-hover:text-brand-700 transition-colors">{cat.name}</p>
                {cat.description && (
                  <p className="text-xs text-ink-500 mt-1 line-clamp-1">{cat.description}</p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Destacados ────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-ink-900">Productos destacados</h2>
            <p className="text-ink-500 mt-1">Nuestra selección recomendada</p>
          </div>
          <Link to="/productos" className="text-brand-600 text-sm font-semibold hover:text-brand-700 flex items-center gap-1 shrink-0">
            Ver todos
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {loadingFeatured ? (
          <PageSpinner />
        ) : featured.length === 0 ? (
          <p className="text-ink-500 text-sm">No hay productos destacados por el momento.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featured.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>

      {/* ── CTA (solo para visitantes sin sesión) ─────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-ink-900 to-brand-900 px-8 py-14 md:px-14 text-center">
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-brand-500/20 rounded-full blur-3xl" />
          <div className="relative">
            {user ? (
              <>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Seguí explorando</h2>
                <p className="text-brand-100 mb-8 max-w-md mx-auto">Descubrí todo nuestro catálogo y encontrá tu próximo favorito.</p>
                <Button as="link" to="/productos" variant="light" size="lg">Ver productos</Button>
              </>
            ) : (
              <>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">¿Listo para empezar?</h2>
                <p className="text-brand-100 mb-8 max-w-md mx-auto">Creá tu cuenta y disfrutá de una experiencia de compra única.</p>
                <Button as="link" to="/registro" variant="light" size="lg">Crear cuenta gratis</Button>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
