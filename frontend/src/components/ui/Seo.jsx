const SITE_NAME = 'MiTienda';
const DEFAULT_DESC = 'Tu tienda online en Argentina. Productos de calidad con envíos a todo el país y pago seguro.';
const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://mitienda.com').replace(/\/$/, '');
const DEFAULT_IMAGE = `${SITE_URL}/og-default.jpg`;

/**
 * SEO por página usando el soporte nativo de metadata de React 19
 * (los <title>, <meta>, <link> y <script> se hoistean al <head>).
 *
 * Props:
 *  - title, description, image
 *  - type: 'website' | 'product' | 'article'
 *  - path: ruta (para canonical/og:url); si se omite usa la URL actual
 *  - jsonLd: objeto de datos estructurados (schema.org) -> <script ld+json>
 *  - noindex: true para no indexar la página
 */
export const Seo = ({ title, description = DEFAULT_DESC, image, type = 'website', path, jsonLd, noindex = false }) => {
  const fullTitle = title ? `${title} · ${SITE_NAME}` : `${SITE_NAME} — Tu tienda online`;
  const url = path ? `${SITE_URL}${path}` : (typeof window !== 'undefined' ? window.location.href : SITE_URL);
  const img = image || DEFAULT_IMAGE;

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <link rel="canonical" href={url} />

      {/* Open Graph (WhatsApp, Facebook, Instagram, LinkedIn) */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={img} />
      <meta property="og:locale" content="es_AR" />

      {/* Twitter / X */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={img} />

      {/* Datos estructurados */}
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}
    </>
  );
};
