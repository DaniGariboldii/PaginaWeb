import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useFetch } from '../../hooks/useFetch';
import { productsService } from '../../services/products.service';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { PageSpinner } from '../../components/ui/Spinner';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { Badge } from '../../components/ui/Badge';
import { Seo } from '../../components/ui/Seo';
import { StarRating } from '../../components/ui/StarRating';
import { ProductReviews } from '../../components/products/ProductReviews';
import { ProductCard } from '../../components/products/ProductCard';
import { useWishlist } from '../../context/WishlistContext';

const formatPrice = (price) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(price);

export const ProductDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCart();
  const { isWishlisted, toggle } = useWishlist();

  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [actionError, setActionError] = useState('');
  const [related, setRelated] = useState([]);

  const { data, loading, error } = useFetch(
    () => productsService.getBySlug(slug),
    [slug]
  );

  const product = data?.product;

  // Cargar productos relacionados cuando el producto está disponible
  useEffect(() => {
    if (!product?.id) return;
    productsService.related(product.id)
      .then((res) => setRelated(res.data.data.products || []))
      .catch(() => setRelated([]));
  }, [product?.id]);

  if (loading) return <PageSpinner />;
  if (error) return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center">
      <ErrorMessage message="Producto no encontrado" />
      <Link to="/productos" className="mt-4 inline-block text-brand-600 hover:underline">
        Volver al catálogo
      </Link>
    </div>
  );

  const primaryImage = product.images?.find((i) => i.isPrimary) ?? product.images?.[0];
  const hasDiscount = product.discountPrice && Number(product.discountPrice) < Number(product.price);

  const handleAddToCart = async () => {
    setActionError('');
    setFeedback('');

    if (!user) {
      navigate('/login', { state: { from: `/productos/${slug}` } });
      return;
    }

    setAdding(true);
    try {
      await addItem(product.id, quantity);
      setFeedback(`${quantity} unidad${quantity > 1 ? 'es' : ''} agregada${quantity > 1 ? 's' : ''} al carrito`);
    } catch (err) {
      setActionError(err.response?.data?.message || 'No se pudo agregar al carrito');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <Seo
        title={product.name}
        description={product.description?.slice(0, 160) || `Comprá ${product.name} en MiTienda con envío a todo el país.`}
      />
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-400 mb-6 flex items-center gap-2">
        <Link to="/" className="hover:text-gray-600">Inicio</Link>
        <span>/</span>
        <Link to="/productos" className="hover:text-gray-600">Productos</Link>
        <span>/</span>
        <span className="text-gray-700">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-10">
        {/* Imagen */}
        <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
          {primaryImage ? (
            <img src={primaryImage.url} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        {/* Detalles */}
        <div className="flex flex-col">
          <div className="flex items-start gap-2 mb-2">
            {product.featured && <Badge label="Destacado" variant="blue" />}
            {product.stock === 0 && <Badge label="Sin stock" variant="red" />}
            {product.stock > 0 && product.stock <= 5 && <Badge label="Últimas unidades" variant="yellow" />}
          </div>

          {product.brand && (
            <p className="text-sm text-gray-400 mb-1">{product.brand.name}</p>
          )}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>

          {/* Rating */}
          {product.reviewCount > 0 && (
            <div className="flex items-center gap-2 mb-2">
              <StarRating value={product.rating} size="w-4 h-4" />
              <span className="text-sm text-ink-500">{product.rating} · {product.reviewCount} opinión{product.reviewCount !== 1 ? 'es' : ''}</span>
            </div>
          )}

          <p className="text-sm text-gray-500 mb-6">
            Categoría: <span className="text-gray-700">{product.category?.name}</span>
          </p>

          {/* Precio */}
          <div className="mb-6">
            {hasDiscount && (
              <p className="text-sm text-gray-400 line-through">{formatPrice(product.price)}</p>
            )}
            <p className="text-3xl font-bold text-brand-600">
              {formatPrice(hasDiscount ? product.discountPrice : product.price)}
            </p>
            {hasDiscount && (
              <p className="text-sm text-green-600 mt-1">
                Ahorrás {formatPrice(Number(product.price) - Number(product.discountPrice))}
              </p>
            )}
          </div>

          {/* Stock info */}
          {product.stock > 0 && (
            <p className="text-sm text-gray-500 mb-6">
              {product.stock} unidades disponibles
            </p>
          )}

          {/* Selector de cantidad */}
          {product.stock > 0 && (
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm text-gray-600">Cantidad:</span>
              <div className="flex items-center border border-gray-300 rounded-md">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                >
                  −
                </button>
                <span className="px-4 py-1.5 text-sm font-medium border-x border-gray-300">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  disabled={quantity >= product.stock}
                  className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* Feedback */}
          {feedback && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-2 rounded-md mb-3 flex items-center justify-between">
              <span>{feedback}</span>
              <Link to="/carrito" className="font-medium hover:underline">Ver carrito</Link>
            </div>
          )}
          {actionError && <div className="mb-3"><ErrorMessage message={actionError} /></div>}

          {/* Acciones */}
          <div className="flex gap-3 mb-4">
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0 || adding}
              className="flex-1 bg-brand-600 text-white py-3 rounded-xl font-semibold hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {product.stock === 0 ? 'Sin stock' : adding ? 'Agregando...' : 'Agregar al carrito'}
            </button>
            {user && (
              <button
                onClick={() => toggle(product.id)}
                aria-label="Favorito"
                className="grid place-items-center w-12 rounded-xl border border-ink-200 hover:bg-ink-50 transition-colors shrink-0"
              >
                <svg
                  className={`w-6 h-6 ${isWishlisted(product.id) ? 'text-red-500' : 'text-ink-400'}`}
                  fill={isWishlisted(product.id) ? 'currentColor' : 'none'}
                  viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            )}
          </div>

          {/* Descripción */}
          {product.description && (
            <div className="mt-6 border-t border-gray-100 pt-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-2">Descripción</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Reseñas */}
      <ProductReviews productId={product.id} />

      {/* Productos relacionados */}
      {related.length > 0 && (
        <div className="border-t border-ink-100 mt-10 pt-8">
          <h2 className="text-xl font-bold text-ink-900 mb-6">También te puede interesar</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}
    </div>
  );
};
