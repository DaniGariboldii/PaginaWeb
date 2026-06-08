const SITE_NAME = 'MiTienda';
const DEFAULT_DESC = 'Tu tienda online en Argentina. Productos de calidad con envíos a todo el país y pago seguro.';

/**
 * SEO por página usando el soporte nativo de metadata de React 19
 * (los <title> y <meta> se hoistean automáticamente al <head>).
 */
export const Seo = ({ title, description = DEFAULT_DESC }) => {
  const fullTitle = title ? `${title} · ${SITE_NAME}` : `${SITE_NAME} — Tu tienda online`;
  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
    </>
  );
};
