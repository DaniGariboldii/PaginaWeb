import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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
import { ProductCarousel } from '../../components/products/ProductCarousel';
import { ShippingEstimator } from '../../components/products/ShippingEstimator';
import { ImageLightbox } from '../../components/ui/ImageLightbox';
import { useWishlist } from '../../context/WishlistContext';
import { trackViewContent, trackAddToCart } from '../../lib/analytics';

const formatPrice = (price) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(price);

// Número de WhatsApp para consultas (solo dígitos). Vacío = no se muestra el botón.
const WHATSAPP_NUMBER = (import.meta.env.VITE_WHATSAPP_NUMBER || '').replace(/\D/g, '');

// Umbral de "últimas unidades" (coincide con LOW_STOCK_THRESHOLD del backend)
const LOW_STOCK_THRESHOLD = 5;

export const ProductDetailPage = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const { addItem } = useCart();
  const { isWishlisted, toggle } = useWishlist();

  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [actionError, setActionError] = useState('');
  const [related, setRelated] = useState([]);
  const [imageIndex, setImageIndex] = useState(0);   // imagen mostrada en grande
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const { data, loading, error } = useFetch(
    () => productsService.getBySlug(slug),
    [slug]
  );

  const product = data?.product;

  // Cargar productos relacionados cuando el producto está disponible
  useEffect(() => {
    if (!product?.id) return;
    trackViewContent(product); // analytics: vista de producto
    productsService.related(product.id)
      .then((res) => setRelated(res.data.data.products || []))
      .catch(() => setRelated([]));
  }, [product?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <PageSpinner />;
  if (error) return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center">
      <ErrorMessage message="Producto no encontrado" />
      <Link to="/productos" className="mt-4 inline-block text-brand-600 hover:underline">
        Volver al catálogo
      </Link>
    </div>
  );

  // Imágenes ordenadas con la principal primero (el backend ya las ordena así)
  const images = product.images ?? [];
  const primaryImage = images.find((i) => i.isPrimary) ?? images[0];
  const mainImage = images[imageIndex] ?? primaryImage;
  const hasDiscount = product.discountPrice && Number(product.discountPrice) < Number(product.price);

  // Link de consulta por WhatsApp con el nombre del producto y la URL pre-cargados
  const whatsappHref = WHATSAPP_NUMBER
    ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
        `Hola! Tengo una consulta sobre: ${product.name}\n${typeof window !== 'undefined' ? window.location.href : ''}`
      )}`
    : null;

  // Imagen absoluta para Open Graph / JSON-LD (las locales se sirven desde el backend)
  const API_ORIGIN = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '');
  const rawImg = primaryImage?.url;
  const ogImage = rawImg ? (rawImg.startsWith('http') ? rawImg : `${API_ORIGIN}${rawImg}`) : undefined;
  const seoPrice = Number(product.discountPrice ?? product.price);

  // Datos estructurados de Producto (schema.org) para rich results de Google
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    ...(product.description && { description: product.description.slice(0, 300) }),
    ...(ogImage && { image: [ogImage] }),
    sku: product.id,
    ...(product.brand?.name && { brand: { '@type': 'Brand', name: product.brand.name } }),
    ...(product.reviewCount > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: Number(product.rating).toFixed(1),
        reviewCount: product.reviewCount,
      },
    }),
    offers: {
      '@type': 'Offer',
      priceCurrency: 'ARS',
      price: seoPrice,
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      ...(typeof window !== 'undefined' && { url: window.location.href }),
    },
  };

  const handleAddToCart = async () => {
    setActionError('');
    setFeedback('');

    // El carrito funciona también para invitados (se guarda local hasta el checkout)
    setAdding(true);
    try {
      await addItem(product.id, quantity);
      trackAddToCart(product, quantity); // analytics: add to cart
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
        image={ogImage}
        type="product"
        path={`/productos/${slug}`}
        jsonLd={productJsonLd}
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
        {/* Imagen + miniaturas */}
        <div>
          {mainImage ? (
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              aria-label="Ampliar imagen"
              className="group relative block w-full aspect-square bg-gray-100 rounded-xl overflow-hidden cursor-zoom-in"
            >
              <img src={mainImage.url} alt={product.name} className="w-full h-full object-cover" />
              {/* Indicador de zoom */}
              <span className="absolute bottom-3 right-3 grid place-items-center w-9 h-9 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                </svg>
              </span>
            </button>
          ) : (
            <div className="w-full aspect-square bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center text-gray-300">
              <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          {/* Miniaturas (solo si hay más de una imagen) */}
          {images.length > 1 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setImageIndex(i)}
                  aria-label={`Ver imagen ${i + 1}`}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                    i === imageIndex ? 'border-brand-600' : 'border-transparent hover:border-ink-300'
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detalles */}
        <div className="flex flex-col">
          <div className="flex items-start gap-2 mb-2">
            {product.featured && <Badge label="Destacado" variant="blue" />}
            {product.stock === 0 && <Badge label="Sin stock" variant="red" />}
            {product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD && <Badge label="Últimas unidades" variant="red" />}
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
            product.stock <= LOW_STOCK_THRESHOLD ? (
              <p className="flex items-center gap-1.5 text-sm font-semibold text-red-600 mb-6">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                ¡Apurate! Solo quedan {product.stock} unidad{product.stock > 1 ? 'es' : ''}
              </p>
            ) : (
              <p className="text-sm text-gray-500 mb-6">
                {product.stock} unidades disponibles
              </p>
            )
          )}

          {/* Estimador de envío por provincia */}
          <ShippingEstimator price={Number(hasDiscount ? product.discountPrice : product.price)} />

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

          {/* Consultar por WhatsApp */}
          {whatsappHref && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full border border-[#25D366] text-[#128C7E] dark:text-[#25D366] py-3 rounded-xl font-semibold hover:bg-[#25D366]/10 transition-colors mb-4"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.738-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>
              Consultar por WhatsApp
            </a>
          )}

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
          <ProductCarousel products={related} />
        </div>
      )}

      {/* Lightbox de imágenes */}
      {lightboxOpen && (
        <ImageLightbox
          images={images}
          index={imageIndex}
          onIndexChange={setImageIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
};
