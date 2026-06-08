/**
 * Seed de desarrollo:
 * - 1 admin
 * - 3 categorías
 * - 2 marcas
 * - 6 productos
 *
 * Ejecutar: npm run db:seed
 */
import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import { generateSlug } from '../src/utils/slug.js';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱  Iniciando seed...');

  // ── Admin ─────────────────────────────────────────────────────────────────
  const adminEmail = 'admin@mitienda.com';
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existing) {
    await prisma.user.create({
      data: {
        firstName: 'Admin',
        lastName: 'Principal',
        email: adminEmail,
        passwordHash: await bcrypt.hash('Admin1234', 12),
        role: 'ADMIN',
        cart: { create: {} },
      },
    });
    console.log('  ✅ Admin creado:', adminEmail);
  } else {
    console.log('  ⏭️  Admin ya existe, omitido');
  }

  // ── Categorías ────────────────────────────────────────────────────────────
  const categories = [
    { name: 'Electrónica', description: 'Dispositivos electrónicos y tecnología' },
    { name: 'Ropa', description: 'Indumentaria para toda la familia' },
    { name: 'Hogar', description: 'Todo para tu hogar' },
  ];

  const createdCategories = {};
  for (const cat of categories) {
    const slug = generateSlug(cat.name);
    const c = await prisma.category.upsert({
      where: { slug },
      update: {},
      create: { name: cat.name, slug, description: cat.description },
    });
    createdCategories[cat.name] = c;
  }
  console.log('  ✅ Categorías:', Object.keys(createdCategories).join(', '));

  // ── Marcas ────────────────────────────────────────────────────────────────
  const brands = ['Samsung', 'Nike'];
  const createdBrands = {};
  for (const name of brands) {
    const b = await prisma.brand.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    createdBrands[name] = b;
  }
  console.log('  ✅ Marcas:', brands.join(', '));

  // ── Productos ─────────────────────────────────────────────────────────────
  const products = [
    { name: 'Smartphone Galaxy A54', price: 280000, stock: 15, categoryId: createdCategories['Electrónica'].id, brandId: createdBrands['Samsung'].id, featured: true },
    { name: 'Smart TV 55" 4K', price: 650000, stock: 8, categoryId: createdCategories['Electrónica'].id, brandId: createdBrands['Samsung'].id, featured: true },
    { name: 'Auriculares Bluetooth', price: 45000, stock: 30, categoryId: createdCategories['Electrónica'].id },
    { name: 'Zapatillas Running Air', price: 85000, stock: 20, categoryId: createdCategories['Ropa'].id, brandId: createdBrands['Nike'].id, featured: true },
    { name: 'Remera Deportiva', price: 18000, stock: 50, categoryId: createdCategories['Ropa'].id, brandId: createdBrands['Nike'].id },
    { name: 'Juego de Sábanas King', price: 32000, stock: 12, categoryId: createdCategories['Hogar'].id },
  ];

  for (const p of products) {
    const slug = generateSlug(p.name);
    await prisma.product.upsert({
      where: { slug },
      update: {},
      create: { ...p, slug, description: `Descripción de ${p.name}` },
    });
  }
  console.log('  ✅ Productos:', products.length, 'creados');

  // ── Zonas de envío ──────────────────────────────────────────────────────────
  if ((await prisma.shippingZone.count()) === 0) {
    await prisma.shippingZone.createMany({
      data: [
        {
          name: 'CABA y GBA',
          provinces: ['Ciudad Autónoma de Buenos Aires', 'Buenos Aires'],
          cost: 3000,
          freeThreshold: 80000,
        },
        {
          name: 'Centro',
          provinces: ['Córdoba', 'Santa Fe', 'Entre Ríos', 'La Pampa'],
          cost: 5000,
          freeThreshold: 100000,
        },
        {
          name: 'Resto del país',
          provinces: [],
          cost: 8000,
          freeThreshold: 150000,
          isDefault: true,
        },
      ],
    });
    console.log('  ✅ Zonas de envío creadas');
  } else {
    console.log('  ⏭️  Zonas de envío ya existen, omitido');
  }

  console.log('\n🎉  Seed completado.');
  console.log('   Admin → admin@mitienda.com / Admin1234');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
