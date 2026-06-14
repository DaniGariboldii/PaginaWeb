import prisma from '../../config/prisma.js';
import { env } from '../../config/env.js';

const SITE = env.frontendUrl.replace(/\/$/, '');

// Páginas estáticas públicas indexables
const STATIC_PATHS = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/productos', priority: '0.9', changefreq: 'daily' },
  { path: '/contacto', priority: '0.4', changefreq: 'monthly' },
  { path: '/preguntas-frecuentes', priority: '0.4', changefreq: 'monthly' },
  { path: '/terminos', priority: '0.2', changefreq: 'yearly' },
  { path: '/privacidad', priority: '0.2', changefreq: 'yearly' },
  { path: '/arrepentimiento', priority: '0.2', changefreq: 'yearly' },
];

const xmlEscape = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** sitemap.xml dinámico: estáticas + productos activos */
export const sitemap = async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      where: { active: true },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    });

    const urls = [
      ...STATIC_PATHS.map(
        (p) => `  <url>\n    <loc>${SITE}${p.path}</loc>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>`
      ),
      ...products.map(
        (p) =>
          `  <url>\n    <loc>${SITE}/productos/${xmlEscape(p.slug)}</loc>\n    <lastmod>${p.updatedAt.toISOString()}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`
      ),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;

    res.header('Content-Type', 'application/xml');
    res.header('Cache-Control', 'public, max-age=3600'); // 1h
    res.send(xml);
  } catch (err) {
    next(err);
  }
};

/** robots.txt: bloquea áreas privadas y apunta al sitemap */
export const robots = (req, res) => {
  const body = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /checkout',
    'Disallow: /carrito',
    'Disallow: /perfil',
    'Disallow: /mis-pedidos',
    'Disallow: /direcciones',
    'Disallow: /favoritos',
    'Disallow: /login',
    'Disallow: /registro',
    '',
    `Sitemap: ${SITE}/sitemap.xml`,
    '',
  ].join('\n');

  res.header('Content-Type', 'text/plain');
  res.header('Cache-Control', 'public, max-age=86400'); // 1 día
  res.send(body);
};
