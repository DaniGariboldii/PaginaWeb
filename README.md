# E-commerce — Tienda Propia

Plataforma web de e-commerce full stack para tienda propia multiproducto en Argentina.

## 📚 Documentación

- **[FUNCIONALIDADES.md](./FUNCIONALIDADES.md)** — Todo lo que la web tiene funcionando (cliente, admin, pagos, seguridad, tests, API).
- **[MERCADOPAGO.md](./MERCADOPAGO.md)** — Cómo activar los pagos reales con Mercado Pago.
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** — Guía de despliegue a producción (Docker / Vercel + Railway).

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + Vite + Tailwind CSS |
| Routing | React Router v7 |
| Estado global | Context API + Zustand (próximas fases) |
| Formularios | React Hook Form + Zod |
| HTTP | Axios |
| Backend | Node.js + Express.js |
| Base de datos | PostgreSQL |
| ORM | Prisma |
| Autenticación | JWT (access + refresh tokens en cookies HttpOnly) |
| Seguridad | bcrypt, Helmet, CORS, express-rate-limit |
| Pagos | Mercado Pago (Checkout Pro) |
| Imágenes | Cloudinary |

## Estructura del proyecto

```
ecommerce-project/
  backend/          # API REST — Node.js + Express + Prisma
  frontend/         # SPA — React + Vite + Tailwind
  README.md
```

## Requisitos

- Node.js >= 18
- PostgreSQL >= 14
- npm >= 9

## Instalación

### 1. Backend

```bash
cd backend
cp .env.example .env
# Editá .env con tus credenciales
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Variables de entorno

### Backend (`backend/.env`)

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | URL de conexión a PostgreSQL |
| `PORT` | Puerto del servidor (default: 4000) |
| `NODE_ENV` | `development` o `production` |
| `JWT_ACCESS_SECRET` | Secreto para firmar access tokens |
| `JWT_REFRESH_SECRET` | Secreto para firmar refresh tokens |
| `JWT_ACCESS_EXPIRES_IN` | Duración del access token (ej: `15m`) |
| `JWT_REFRESH_EXPIRES_IN` | Duración del refresh token (ej: `7d`) |
| `FRONTEND_URL` | URL del frontend (para CORS) |
| `MP_ACCESS_TOKEN` | Access token de Mercado Pago |
| `MP_WEBHOOK_SECRET` | Secret para validar webhooks de MP |
| `MP_SUCCESS_URL` | URL de retorno pago exitoso |
| `MP_FAILURE_URL` | URL de retorno pago rechazado |
| `MP_PENDING_URL` | URL de retorno pago pendiente |
| `CLOUDINARY_CLOUD_NAME` | Cloud name de Cloudinary |
| `CLOUDINARY_API_KEY` | API key de Cloudinary |
| `CLOUDINARY_API_SECRET` | API secret de Cloudinary |

### Frontend (`frontend/.env`)

| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL base de la API (ej: `http://localhost:4000/api`) |
| `VITE_MP_PUBLIC_KEY` | Public key de Mercado Pago |

## Comandos principales

### Backend

```bash
npm run dev          # Servidor en modo desarrollo (nodemon)
npm start            # Servidor en producción
npm run db:migrate   # Ejecutar migraciones
npm run db:generate  # Regenerar Prisma Client
npm run db:studio    # Abrir Prisma Studio
npm run db:seed      # Ejecutar seed (cuando esté disponible)
```

### Frontend

```bash
npm run dev      # Servidor de desarrollo (http://localhost:5173)
npm run build    # Build de producción
npm run preview  # Preview del build
```

## Roles del sistema

| Rol | Descripción |
|---|---|
| Visitante | Ver catálogo, buscar, registrarse |
| CLIENT | Comprar, carrito, pedidos, perfil |
| ADMIN | Panel completo: productos, pedidos, usuarios, reportes |

## Endpoints principales

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
GET    /api/auth/me

GET    /api/products
GET    /api/products/:id
POST   /api/products          (ADMIN)
PUT    /api/products/:id      (ADMIN)
DELETE /api/products/:id      (ADMIN)

GET    /api/categories
POST   /api/categories        (ADMIN)

GET    /api/cart              (autenticado)
POST   /api/cart/items        (autenticado)
PUT    /api/cart/items/:id    (autenticado)
DELETE /api/cart/items/:id    (autenticado)
DELETE /api/cart/clear        (autenticado)

POST   /api/orders            (autenticado)
GET    /api/orders/my         (autenticado)

POST   /api/payments/create-preference  (autenticado)
POST   /api/payments/webhook            (público — Mercado Pago)

GET    /api/admin/dashboard   (ADMIN)
GET    /api/admin/users       (ADMIN)
GET    /api/admin/orders      (ADMIN)
```

## Roadmap de desarrollo

| Fase | Contenido |
|---|---|
| **Fase 1** ✅ | Estructura base, backend Express+Prisma, frontend React+Tailwind, schema DB |
| **Fase 2** | Autenticación completa (register/login/logout/refresh), CRUD de productos y categorías |
| **Fase 3** | Carrito persistente, subida de imágenes a Cloudinary |
| **Fase 4** | Pedidos, integración Mercado Pago, webhooks, gestión de estados |
| **Fase 5** | Panel admin completo, métricas, reportes, gestión de stock |
| **Fase 6** | Optimizaciones, SEO, deploy a producción |

## Seguridad implementada

- Contraseñas hasheadas con bcrypt (12 rounds)
- Tokens JWT en cookies HttpOnly + Secure + SameSite=Strict
- Helmet para headers HTTP seguros
- CORS restringido al frontend
- Rate limiting: 200 req/15min global, 20 req/15min en auth
- Validación de datos con Zod en backend y frontend
- Manejo de errores sin exponer detalles internos en producción
- Baja lógica de productos (nunca eliminar con ventas asociadas)
- Reserva de stock en el checkout (anti-sobreventa); se libera ante rechazo/cancelación/vencimiento

## Mercado Pago

Integración completa con **Checkout Pro** (SDK oficial) y **webhook idempotente con validación de firma**. Funciona en **modo simulación** sin credenciales para probar el flujo; para pagos reales seguí **[MERCADOPAGO.md](./MERCADOPAGO.md)**.
