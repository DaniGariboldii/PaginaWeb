/**
 * Analytics: Google Analytics 4 (gtag) + Meta Pixel (fbq).
 *
 * Se configuran por variables de entorno (build-time):
 *   VITE_GA_ID         -> ej. G-XXXXXXXXXX
 *   VITE_META_PIXEL_ID -> ej. 1234567890
 *
 * Si no hay IDs configurados, todas las funciones son no-op (no se carga nada).
 * Pensado para no romper en desarrollo ni filtrar datos sin querer.
 */
const GA_ID = import.meta.env.VITE_GA_ID || '';
const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID || '';

let initialized = false;

const hasGA = () => Boolean(GA_ID) && typeof window !== 'undefined' && typeof window.gtag === 'function';
const hasPixel = () => Boolean(PIXEL_ID) && typeof window !== 'undefined' && typeof window.fbq === 'function';

/** Inserta los scripts de GA4 y Meta Pixel (una sola vez). */
export const initAnalytics = () => {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  // ── Google Analytics 4 ──────────────────────────────────────────────────
  if (GA_ID) {
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(s);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    // send_page_view:false -> el page_view lo disparamos manualmente por ruta (SPA)
    window.gtag('config', GA_ID, { send_page_view: false });
  }

  // ── Meta Pixel ──────────────────────────────────────────────────────────
  if (PIXEL_ID) {
    /* eslint-disable */
    !(function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = '2.0';
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    window.fbq('init', PIXEL_ID);
  }
};

/** Vista de página (se llama en cada cambio de ruta). */
export const trackPageView = (path) => {
  if (hasGA()) window.gtag('event', 'page_view', { page_path: path, page_location: window.location.href });
  if (hasPixel()) window.fbq('track', 'PageView');
};

const toPrice = (p) => Number(p?.discountPrice ?? p?.price ?? 0);

/** Vista de un producto. */
export const trackViewContent = (product) => {
  if (!product) return;
  const value = toPrice(product);
  if (hasGA()) {
    window.gtag('event', 'view_item', {
      currency: 'ARS',
      value,
      items: [{ item_id: product.id, item_name: product.name, price: value }],
    });
  }
  if (hasPixel()) {
    window.fbq('track', 'ViewContent', {
      content_ids: [product.id],
      content_name: product.name,
      content_type: 'product',
      value,
      currency: 'ARS',
    });
  }
};

/** Agregado al carrito. */
export const trackAddToCart = (product, quantity = 1) => {
  if (!product) return;
  const value = toPrice(product) * quantity;
  if (hasGA()) {
    window.gtag('event', 'add_to_cart', {
      currency: 'ARS',
      value,
      items: [{ item_id: product.id, item_name: product.name, quantity, price: toPrice(product) }],
    });
  }
  if (hasPixel()) {
    window.fbq('track', 'AddToCart', {
      content_ids: [product.id],
      content_name: product.name,
      content_type: 'product',
      value,
      currency: 'ARS',
    });
  }
};

/** Inicio de checkout. */
export const trackBeginCheckout = (value = 0) => {
  if (hasGA()) window.gtag('event', 'begin_checkout', { currency: 'ARS', value: Number(value) });
  if (hasPixel()) window.fbq('track', 'InitiateCheckout', { value: Number(value), currency: 'ARS' });
};

/** Compra confirmada. */
export const trackPurchase = ({ orderId, value } = {}) => {
  if (hasGA()) {
    window.gtag('event', 'purchase', {
      transaction_id: orderId,
      currency: 'ARS',
      value: Number(value) || 0,
    });
  }
  if (hasPixel()) window.fbq('track', 'Purchase', { value: Number(value) || 0, currency: 'ARS' });
};
