import { Link } from 'react-router-dom';
import { StarRating } from '../ui/StarRating';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';

const formatPrice = (price) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(price);

export const ProductCard = ({ product }) => {
  const { user } = useAuth();
  const { isWishlisted, toggle } = useWishlist();
  const primaryImage = product.images?.find((i) => i.isPrimary) ?? product.images?.[0];
  const hasDiscount = product.discountPrice && Number(product.discountPrice) < Number(product.price);
  const displayPrice = hasDiscount ? product.discountPrice : product.price;
  const discountPct = hasDiscount
    ? Math.round((1 - Number(product.discountPrice) / Number(product.price)) * 100)
    : 0;
  const fav = isWishlisted(product.id);

  const handleFav = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(product.id);
  };

  return (
    <Link
      to={`/productos/${product.slug}`}
      className="group bg-white border border-ink-200 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-ink-900/5 hover:-translate-y-1 hover:border-brand-200 transition-all duration-300 flex flex-col"
    >
      {/* Imagen */}
      <div className="aspect-square bg-ink-100 overflow-hidden relative">
        {primaryImage ? (
          <img
            src={primaryImage.url}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full grid place-items-center text-ink-200 bg-gradient-to-br from-ink-100 to-ink-200/50">
            <svg className="w-14 h-14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.featured && (
            <span className="bg-brand-600 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-sm">
              Destacado
            </span>
          )}
          {hasDiscount && (
            <span className="bg-emerald-500 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-sm">
              −{discountPct}%
            </span>
          )}
        </div>

        {/* Botón favorito (solo logueado) */}
        {user && (
          <button
            onClick={handleFav}
            aria-label={fav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
            className="absolute top-3 right-3 grid place-items-center w-9 h-9 rounded-full bg-white/90 backdrop-blur shadow-sm hover:scale-110 transition-transform"
          >
            <svg className={`w-5 h-5 ${fav ? 'text-red-500' : 'text-ink-400'}`} fill={fav ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        )}

        {product.stock === 0 && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] grid place-items-center">
            <span className="text-sm font-semibold text-ink-700 bg-white px-3 py-1.5 rounded-lg shadow-sm">
              Sin stock
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        {product.brand && (
          <p className="text-[11px] font-medium text-ink-500 uppercase tracking-wide mb-1">{product.brand.name}</p>
        )}
        <h3 className="text-sm font-semibold text-ink-900 line-clamp-2 flex-1 mb-2 group-hover:text-brand-700 transition-colors">
          {product.name}
        </h3>

        {/* Rating */}
        {product.reviewCount > 0 && (
          <div className="flex items-center gap-1.5 mb-2">
            <StarRating value={product.rating} size="w-3.5 h-3.5" />
            <span className="text-xs text-ink-400">({product.reviewCount})</span>
          </div>
        )}

        <div className="flex items-end justify-between">
          <div>
            {hasDiscount && (
              <p className="text-xs text-ink-500 line-through">{formatPrice(product.price)}</p>
            )}
            <p className="text-lg font-bold text-ink-900">{formatPrice(displayPrice)}</p>
          </div>
          <span className="grid place-items-center w-9 h-9 rounded-xl bg-ink-100 text-ink-700 group-hover:bg-brand-600 group-hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
};
