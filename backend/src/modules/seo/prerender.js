import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import prisma from '../../config/prisma.js';
import { env } from '../../config/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = env.frontendUrl.replace(/\/$/, '');
const SITE_NAME = 'MiTienda';
const DEFAULT_DESC = 'Tu tienda online en Argentina. Productos de calidad con envíos a todo el país y pago seguro.';
const DEFAULT_IMAGE = `${SITE}/og-default.jpg`;

// User-agents de scrapers/crawlers que NO ejecutan JS y necesitan meta en el HTML.
const BOT_REGEX =
  /(facebookexternalhit|facebookcatalog|Facebot|Twitterbot|WhatsApp|LinkedInBot|Slackbot|TelegramBot|Discordbot|Pinterest|redditbot|Googlebot|Google-InspectionTool|bingbot|Applebot|SkypeUriPreview|vkShare|Embedly|Slack-ImgProxy)/i;

const fmt = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(Number(n));

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// ── Meta por ruta ───────────────────────────────────────────────────────────
const buildDefaultMeta = (reqPath) => ({
  title: `${SITE_NAME} — Tu tienda online`,
  description: DEFAULT_DESC,
  image: DEFAULT_IMAGE,
  url: `${SITE}${reqPath}`,
  type: 'website',
});

const buildProductMeta = (product, reqPath) => {
  const img = product._image || DEFAULT_IMAGE;
  const price = Number(product.discountPrice ?? product.price);
  const description =
    (product.description?.slice(0, 140) || `Comprá ${product.name} en ${SITE_NAME}`) + ` — ${fmt(price)}. Envío a todo el país.`;
  const url = `${SITE}${reqPath}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    ...(product.description && { description: product.description.slice(0, 300) }),
    ...(product._image && { image: [product._image] }),
    sku: product.id,
    ...(product.brand?.name && { brand: { '@type': 'Brand', name: product.brand.name } }),
    offers: {
      '@type': 'Offer',
      priceCurrency: 'ARS',
      price,
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url,
    },
  };

  return { title: `${product.name} · ${SITE_NAME}`, description, image: img, url, type: 'product', jsonLd };
};

const fetchProductForMeta = async (slug) => {
  const product = await prisma.product.findFirst({
    where: { slug, active: true },
    include: { images: true, brand: { select: { name: true } } },
  });
  if (!product) return null;

  const primary = product.images?.find((i) => i.isPrimary) ?? product.images?.[0];
  const raw = primary?.url;
  // Imagen absoluta: las locales (/uploads) se sirven desde el mismo origen
  product._image = raw ? (raw.startsWith('http') ? raw : `${SITE}${raw}`) : null;
  return product;
};

// ── Inyección de meta en el index.html ──────────────────────────────────────
const metaBlock = (m) => {
  let out = `<title>${esc(m.title)}</title>\n`;
  out += `<meta name="description" content="${esc(m.description)}">\n`;
  out += `<link rel="canonical" href="${esc(m.url)}">\n`;
  out += `<meta property="og:site_name" content="${SITE_NAME}">\n`;
  out += `<meta property="og:title" content="${esc(m.title)}">\n`;
  out += `<meta property="og:description" content="${esc(m.description)}">\n`;
  out += `<meta property="og:type" content="${esc(m.type)}">\n`;
  out += `<meta property="og:url" content="${esc(m.url)}">\n`;
  out += `<meta property="og:image" content="${esc(m.image)}">\n`;
  out += `<meta property="og:locale" content="es_AR">\n`;
  out += `<meta name="twitter:card" content="summary_large_image">\n`;
  out += `<meta name="twitter:title" content="${esc(m.title)}">\n`;
  out += `<meta name="twitter:description" content="${esc(m.description)}">\n`;
  out += `<meta name="twitter:image" content="${esc(m.image)}">\n`;
  if (m.jsonLd) out += `<script type="application/ld+json">${JSON.stringify(m.jsonLd)}</script>\n`;
  return out;
};

// Quita los meta/title/canonical estáticos para no duplicarlos, e inyecta los nuevos.
export const injectMeta = (html, meta) => {
  const cleaned = html
    .replace(/<title>[\s\S]*?<\/title>/i, '')
    .replace(/<meta\s+name=["']description["'][^>]*>/gi, '')
    .replace(/<meta\s+property=["']og:[^"']*["'][^>]*>/gi, '')
    .replace(/<meta\s+name=["']twitter:[^"']*["'][^>]*>/gi, '')
    .replace(/<link\s+rel=["']canonical["'][^>]*>/gi, '');
  return cleaned.replace('</head>', `${metaBlock(meta)}</head>`);
};

// ── Montaje del SPA + prerender para bots ────────────────────────────────────
let templateCache = null;

export const setupSpa = (app) => {
  const distPath = process.env.FRONTEND_DIST || path.resolve(__dirname, '../../../../frontend/dist');
  const indexPath = path.join(distPath, 'index.html');

  if (!fs.existsSync(indexPath)) {
    console.log('[SPA] frontend/dist no encontrado — se corre en modo solo-API (sin servir el sitio).');
    return;
  }

  const getTemplate = () => {
    if (!templateCache || env.isDev) templateCache = fs.readFileSync(indexPath, 'utf-8');
    return templateCache;
  };

  // Assets estáticos (js, css, imágenes). index:false para no cortar las rutas SPA.
  app.use(express.static(distPath, { index: false }));

  // Catch-all del SPA: a los bots les damos HTML con meta inyectada; a las personas, el index normal.
  app.use(async (req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api')) return next();

    const ua = req.headers['user-agent'] || '';
    if (!BOT_REGEX.test(ua)) return res.sendFile(indexPath); // persona → SPA normal (React maneja el SEO)

    try {
      const html = getTemplate();
      const productMatch = req.path.match(/^\/productos\/([^/]+)\/?$/);
      let meta;
      if (productMatch) {
        const product = await fetchProductForMeta(decodeURIComponent(productMatch[1]));
        meta = product ? buildProductMeta(product, req.path) : buildDefaultMeta(req.path);
      } else {
        meta = buildDefaultMeta(req.path);
      }
      res.header('Content-Type', 'text/html; charset=utf-8');
      res.send(injectMeta(html, meta));
    } catch (err) {
      console.error('[SPA] Error en prerender:', err.message);
      res.sendFile(indexPath); // ante cualquier error, servir el SPA normal
    }
  });

  console.log(`[SPA] Sirviendo frontend desde ${distPath} (con prerender de meta para bots).`);
};

// Exportado para pruebas
export const __test = { buildProductMeta, buildDefaultMeta, BOT_REGEX };
