# Informe del proyecto MiTienda

Fecha del informe: 8 de junio de 2026  
Ubicación relevada: `C:\Users\danig\Desktop\Pagina`

## 1. Resumen ejecutivo

El proyecto es una plataforma web de e-commerce full stack llamada **MiTienda**, orientada a la venta online de productos en Argentina. Incluye una tienda pública para visitantes, funcionalidades de cliente autenticado, un panel de administración, integración de pagos con Mercado Pago, gestión de imágenes con Cloudinary o almacenamiento local, emails con Nodemailer, base de datos PostgreSQL y despliegue mediante Docker Compose o servicios gestionados.

La aplicación está separada en dos proyectos principales:

- `backend/`: API REST con Node.js, Express, Prisma y PostgreSQL.
- `frontend/`: SPA con React, Vite, Tailwind CSS y React Router.

También cuenta con documentación auxiliar:

- `README.md`: guía general del proyecto.
- `FUNCIONALIDADES.md`: listado de funcionalidades implementadas.
- `MERCADOPAGO.md`: guía para activar pagos reales.
- `DEPLOYMENT.md`: guía de despliegue.
- `docker-compose.yml`: stack productivo/local con PostgreSQL, backend y frontend.

## 2. Stack tecnológico

### Frontend

- React 19.
- Vite 8.
- Tailwind CSS 4.
- React Router DOM 7.
- Axios para HTTP.
- React Hook Form y Zod para formularios y validación.
- Context API para autenticación, carrito, favoritos y toasts.
- Zustand instalado como dependencia, pensado para estado global adicional.
- ESLint para linting.

### Backend

- Node.js con módulos ES.
- Express 5.
- Prisma 7.
- PostgreSQL.
- JWT con access token y refresh token.
- bcrypt para hash de contraseñas.
- Helmet, CORS, compression y express-rate-limit.
- Multer para subida de imágenes.
- Cloudinary para almacenamiento externo de imágenes.
- Mercado Pago SDK para Checkout Pro.
- Nodemailer para emails.
- Vitest para tests.

### Infraestructura

- Docker Compose.
- PostgreSQL 16 Alpine en contenedor.
- Frontend servido por nginx en producción.
- GitHub Actions para CI.

## 3. Estructura general del repositorio

```text
Pagina/
  backend/
    prisma/
      schema.prisma
      seed.js
      migrations/
    src/
      app.js
      server.js
      config/
      middlewares/
      modules/
      utils/
      validators/
    package.json
    prisma.config.ts

  frontend/
    src/
      App.jsx
      main.jsx
      assets/
      components/
      context/
      hooks/
      pages/
      routes/
      services/
      utils/
    package.json
    vite.config.js

  .github/workflows/ci.yml
  docker-compose.yml
  README.md
  FUNCIONALIDADES.md
  MERCADOPAGO.md
  DEPLOYMENT.md
  .env.example
```

## 4. Backend

El backend expone una API REST bajo `/api`. El archivo principal es `backend/src/server.js`, que conecta Prisma con PostgreSQL y levanta Express. La configuración de middlewares y rutas está en `backend/src/app.js`.

### Middlewares principales

- `helmet()`: headers de seguridad.
- `compression()`: compresión HTTP.
- `cors()`: permite orígenes configurados.
- `rateLimit()`: límite global de 200 requests cada 15 minutos.
- `express.raw()` en `/api/payments/webhook`: requerido para validar webhooks de Mercado Pago.
- `express.json()` y `express.urlencoded()`: parsing de requests.
- `cookieParser()`: lectura de cookies.
- `express.static('uploads')`: sirve imágenes locales cuando no se usa Cloudinary.
- `notFound` y `errorHandler`: manejo centralizado de errores.

### Configuración de entorno

El backend requiere estas variables mínimas:

- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`

Variables adicionales relevantes:

- `PORT`
- `NODE_ENV`
- `BACKEND_URL`
- `FRONTEND_URL`
- `CORS_ORIGINS`
- `COOKIE_SAMESITE`
- `TRUST_PROXY`
- `JWT_ACCESS_EXPIRES_IN`
- `JWT_REFRESH_EXPIRES_IN`
- `MP_ACCESS_TOKEN`
- `MP_WEBHOOK_SECRET`
- `MP_SUCCESS_URL`
- `MP_FAILURE_URL`
- `MP_PENDING_URL`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `EMAIL_FROM`

Nota: este informe no copia valores reales de `.env` para evitar exponer credenciales.

## 5. Módulos del backend

### Auth

Ubicación: `backend/src/modules/auth/`

Funciones:

- Registro de usuarios.
- Login.
- Logout.
- Refresh token.
- Obtener usuario actual.
- Actualizar perfil.
- Cambiar contraseña.
- Recuperar contraseña por email.
- Restablecer contraseña con token.

Rutas:

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
GET  /api/auth/me
PUT  /api/auth/profile
PUT  /api/auth/change-password
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

### Productos

Ubicación: `backend/src/modules/products/`

Funciones:

- Listado de productos.
- Detalle por ID.
- Detalle por slug.
- Productos relacionados.
- CRUD de productos para admin.
- Subida múltiple de imágenes.
- Eliminación de imágenes.
- Marcar imagen principal.
- Reseñas de productos.

Rutas:

```text
GET    /api/products
GET    /api/products/slug/:slug
GET    /api/products/:id
GET    /api/products/:id/related
GET    /api/products/:id/reviews
POST   /api/products/:id/reviews
DELETE /api/products/:id/reviews
POST   /api/products
PUT    /api/products/:id
DELETE /api/products/:id
POST   /api/products/:id/images
DELETE /api/products/:id/images/:imageId
PUT    /api/products/:id/images/:imageId/primary
```

### Categorías y marcas

Ubicación: `backend/src/modules/categories/`

Funciones:

- Listado de categorías.
- CRUD de categorías para admin.
- Listado de marcas.
- CRUD de marcas para admin.

Rutas:

```text
GET    /api/categories
POST   /api/categories
PUT    /api/categories/:id
DELETE /api/categories/:id
GET    /api/categories/brands
POST   /api/categories/brands
PUT    /api/categories/brands/:id
DELETE /api/categories/brands/:id
```

### Carrito

Ubicación: `backend/src/modules/cart/`

Funciones:

- Obtener carrito del usuario.
- Agregar productos.
- Modificar cantidades.
- Eliminar ítems.
- Vaciar carrito.
- Validación de stock.

Rutas:

```text
GET    /api/cart
POST   /api/cart/items
PUT    /api/cart/items/:id
DELETE /api/cart/clear
DELETE /api/cart/items/:id
```

### Direcciones

Ubicación: `backend/src/modules/addresses/`

Funciones:

- Listar direcciones del usuario.
- Crear dirección.
- Editar dirección.
- Eliminar dirección.
- Dirección predeterminada.

Rutas:

```text
GET    /api/addresses
POST   /api/addresses
PUT    /api/addresses/:id
DELETE /api/addresses/:id
```

### Wishlist

Ubicación: `backend/src/modules/wishlist/`

Funciones:

- Listar favoritos.
- Obtener IDs de productos favoritos.
- Agregar producto a favoritos.
- Quitar producto de favoritos.

Rutas:

```text
GET    /api/wishlist
GET    /api/wishlist/ids
POST   /api/wishlist/:productId
DELETE /api/wishlist/:productId
```

### Cupones

Ubicación: `backend/src/modules/coupons/`

Funciones:

- Validar cupón durante checkout.
- Crear, listar, editar y eliminar cupones desde admin.
- Soporte para cupones porcentuales y de monto fijo.

Rutas:

```text
POST   /api/coupons/validate
GET    /api/coupons
POST   /api/coupons
PUT    /api/coupons/:id
DELETE /api/coupons/:id
```

### Envíos

Ubicación: `backend/src/modules/shipping/`

Funciones:

- Listado de provincias.
- Cotización de envío.
- Zonas de envío por provincia.
- Umbral de envío gratis.
- CRUD de zonas desde admin.

Rutas:

```text
GET    /api/shipping/provinces
POST   /api/shipping/quote
GET    /api/shipping/zones
POST   /api/shipping/zones
PUT    /api/shipping/zones/:id
DELETE /api/shipping/zones/:id
```

### Pedidos

Ubicación: `backend/src/modules/orders/`

Funciones:

- Crear pedido.
- Listar pedidos del usuario.
- Ver detalle de pedido.
- Cancelar pedido.
- Listar todos los pedidos como admin.
- Cambiar estado como admin.
- Reserva de stock al crear pedido.
- Liberación de stock ante cancelación o pago rechazado.

Rutas:

```text
POST /api/orders
GET  /api/orders/my
GET  /api/orders/:id
POST /api/orders/:id/cancel
```

Rutas admin relacionadas:

```text
GET /api/admin/orders
PUT /api/admin/orders/:id/status
```

### Pagos

Ubicación: `backend/src/modules/payments/`

Funciones:

- Crear preferencia de Mercado Pago.
- Webhook público de Mercado Pago.
- Modo de pago real o simulado.
- Simulación de pago en desarrollo.
- Confirmación fallback al volver del checkout.
- Consulta de estado de pago.

Rutas:

```text
POST /api/payments/webhook
GET  /api/payments/mode
POST /api/payments/create-preference
POST /api/payments/confirm
POST /api/payments/simulate
GET  /api/payments/:id/status
```

### Admin

Ubicación: `backend/src/modules/admin/`

Funciones:

- Dashboard.
- Usuarios.
- Pedidos.
- Stock.
- Movimientos de stock.
- Reportes de ventas.
- Reportes de inventario.

Rutas:

```text
GET /api/admin/dashboard
GET /api/admin/users
PUT /api/admin/users/:id/status
GET /api/admin/stock
PUT /api/admin/stock/:id
GET /api/admin/stock-movements
GET /api/admin/reports/sales
GET /api/admin/reports/stock
```

## 6. Base de datos

La base de datos usa PostgreSQL y Prisma. El modelo está definido en `backend/prisma/schema.prisma`.

### Enums

- `Role`: `CLIENT`, `ADMIN`.
- `OrderStatus`: `PENDING_PAYMENT`, `PAID`, `PREPARING`, `SHIPPED`, `DELIVERED`, `CANCELLED`, `REJECTED`.
- `StockMovementType`: `IN`, `OUT`, `ADJUSTMENT`.
- `PaymentStatus`: `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`.
- `CouponType`: `PERCENTAGE`, `FIXED`.

### Modelos principales

- `User`: usuarios, roles, estado activo, perfil, relación con carrito, pedidos, direcciones, reset de contraseña, reseñas y wishlist.
- `Review`: reseñas por producto y usuario.
- `WishlistItem`: favoritos.
- `PasswordResetToken`: tokens hasheados para recuperación de contraseña.
- `Category`: categorías.
- `Brand`: marcas.
- `Product`: productos con precio, descuento, stock, categoría, marca e imágenes.
- `ProductImage`: imágenes de producto.
- `Cart`: carrito por usuario.
- `CartItem`: productos del carrito.
- `Address`: direcciones del usuario.
- `Order`: pedidos con subtotal, descuento, envío, cupón, total y estado.
- `ShippingZone`: zonas de envío por provincia.
- `Coupon`: cupones de descuento.
- `OrderItem`: snapshot de productos comprados.
- `Payment`: pagos asociados a pedidos.
- `StockMovement`: historial de movimientos de stock.

### Seed de desarrollo

El archivo `backend/prisma/seed.js` crea datos iniciales:

- Usuario admin:
  - Email: `admin@mitienda.com`
  - Password: `Admin1234`
- Categorías:
  - Electrónica.
  - Ropa.
  - Hogar.
- Marcas:
  - Samsung.
  - Nike.
- Productos:
  - Smartphone Galaxy A54.
  - Smart TV 55" 4K.
  - Auriculares Bluetooth.
  - Zapatillas Running Air.
  - Remera Deportiva.
  - Juego de Sábanas King.
- Zonas de envío:
  - CABA y GBA.
  - Centro.
  - Resto del país.

## 7. Frontend

El frontend es una SPA con React y Vite. El archivo principal de rutas es `frontend/src/App.jsx`.

### Layouts

- `MainLayout`: layout público y de cliente.
- `AdminLayout`: layout del panel de administración.

### Contextos

- `AuthContext`: sesión del usuario.
- `CartContext`: carrito.
- `WishlistContext`: favoritos.
- `ToastContext`: notificaciones.

### Componentes destacados

- `Navbar`
- `Footer`
- `ProductCard`
- `ProductReviews`
- `SearchBar`
- `ProductImageManager`
- `Button`
- `Badge`
- `Spinner`
- `ErrorBoundary`
- `Seo`
- `StarRating`

### Páginas públicas

```text
/                         Home
/productos                Listado de productos
/productos/:slug          Detalle de producto
/contacto                 Contacto
/preguntas-frecuentes     FAQ
*                         404
```

### Páginas de autenticación

```text
/login
/registro
/recuperar
/restablecer
```

Estas rutas usan `GuestRoute`, por lo que redirigen si el usuario ya inició sesión.

### Páginas de cliente autenticado

```text
/carrito
/checkout
/mis-pedidos
/mis-pedidos/:id
/direcciones
/favoritos
/perfil
/pago/exitoso
/pago/pendiente
/pago/rechazado
```

Estas rutas usan `ProtectedRoute`.

### Páginas de administrador

```text
/admin
/admin/productos
/admin/productos/nuevo
/admin/productos/:id/editar
/admin/categorias
/admin/pedidos
/admin/usuarios
/admin/stock
/admin/cupones
/admin/envios
/admin/reportes
```

Estas rutas requieren usuario con rol `ADMIN`.

## 8. Funcionalidades implementadas

### Visitante

- Ver home.
- Ver catálogo.
- Buscar productos.
- Filtrar y ordenar productos.
- Ver detalle de producto.
- Ver imágenes, stock, marca, categoría, descripción y reseñas.
- Registrarse.
- Iniciar sesión.
- Usar recuperación de contraseña.
- Ver páginas informativas de contacto y preguntas frecuentes.

### Cliente

- Todo lo anterior.
- Gestionar carrito persistente.
- Agregar, editar cantidad, eliminar y vaciar carrito.
- Gestionar favoritos.
- Gestionar direcciones.
- Aplicar cupones.
- Calcular envío.
- Crear pedidos.
- Pagar con Mercado Pago o modo simulado.
- Ver historial de pedidos.
- Ver detalle de pedido.
- Reanudar pago pendiente.
- Cancelar pedido cuando corresponda.
- Editar perfil.
- Cambiar contraseña.
- Crear reseñas si compró el producto.

### Administrador

- Acceder a dashboard.
- Gestionar productos.
- Gestionar imágenes de productos.
- Gestionar categorías.
- Gestionar marcas.
- Gestionar pedidos.
- Gestionar usuarios.
- Gestionar stock.
- Ver movimientos de stock.
- Gestionar cupones.
- Gestionar zonas de envío.
- Ver reportes de ventas.
- Ver reportes de inventario.

## 9. Reglas de negocio importantes

- Los precios finales se calculan en backend.
- No se confía en totales enviados por frontend.
- No se puede comprar sin stock.
- El stock se valida al agregar al carrito y al crear pedido.
- El checkout reserva stock para evitar sobreventa.
- El stock se libera ante cancelación, pago rechazado o vencimiento.
- Los ítems de pedido guardan snapshot de nombre, precio y cantidad.
- El cliente solo accede a sus propios pedidos.
- El admin puede ver todos los pedidos.
- El estado `PAID` no debe marcarse manualmente: depende del pago confirmado.
- Los productos con ventas asociadas se manejan con baja lógica.
- Cada usuario puede dejar una reseña por producto.
- La recuperación de contraseña usa tokens hasheados, de un solo uso y con expiración.

## 10. Integración con Mercado Pago

La integración está documentada en `MERCADOPAGO.md`.

Características:

- Checkout Pro con SDK oficial.
- Modo simulado si no hay credenciales reales.
- Creación de preferencia desde backend.
- Redirección del cliente a Mercado Pago.
- Retornos configurables:
  - pago exitoso.
  - pago pendiente.
  - pago rechazado.
- Webhook público en `/api/payments/webhook`.
- Validación opcional de firma con `MP_WEBHOOK_SECRET`.
- Webhook idempotente para evitar duplicaciones.
- Fallback de confirmación con `/api/payments/confirm`.

Para desarrollo local con webhooks reales se recomienda exponer el backend con ngrok y configurar `BACKEND_URL`.

## 11. Gestión de imágenes

El proyecto contempla dos caminos:

- Cloudinary, si se configuran credenciales `CLOUDINARY_*`.
- Almacenamiento local en `uploads`, servido por Express desde `/uploads`.

La subida se realiza desde el panel admin y permite:

- Subir hasta 5 imágenes.
- Eliminar imágenes.
- Marcar imagen principal.
- Validar tipo, extensión y tamaño.

## 12. Emails

El backend usa Nodemailer.

Casos de uso:

- Recuperación de contraseña.
- Confirmaciones o notificaciones relacionadas con pedidos.

En desarrollo, si no hay SMTP configurado, el proyecto puede usar un modo de preview tipo Ethereal según la configuración implementada en `backend/src/config/mailer.js`.

## 13. Seguridad

Medidas implementadas:

- Hash de contraseñas con bcrypt.
- JWT en cookies HttpOnly.
- Refresh token con cookies.
- Rate limiting global y específico para endpoints sensibles.
- Helmet.
- CORS restringido por configuración.
- Validación de datos con Zod.
- Tokens de recuperación de contraseña hasheados.
- Manejo centralizado de errores.
- Cookies configurables para entornos con mismo dominio o cross-domain.
- Soporte de `trust proxy` para despliegues detrás de proxy.

## 14. Calidad, tests y CI

### Backend

Scripts:

```text
npm run dev
npm start
npm run db:migrate
npm run db:generate
npm run db:studio
npm run db:seed
npm test
npm run test:watch
npm run test:integration
```

Tests:

- Unitarios con Vitest.
- Integración con PostgreSQL real.

### Frontend

Scripts:

```text
npm run dev
npm run build
npm run lint
npm run preview
```

### GitHub Actions

Workflow: `.github/workflows/ci.yml`

Jobs:

- Backend:
  - instala dependencias.
  - genera Prisma Client.
  - aplica migraciones.
  - corre tests unitarios.
  - corre tests de integración con PostgreSQL.
- Frontend:
  - instala dependencias.
  - corre lint.
  - corre build.

## 15. Ejecución local

### Requisitos

- Node.js 18 o superior.
- npm 9 o superior.
- PostgreSQL 14 o superior.

### Backend

```powershell
cd C:\Users\danig\Desktop\Pagina\backend
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

URL esperada:

```text
http://localhost:4000
```

Health check:

```text
http://localhost:4000/api/health
```

### Frontend

```powershell
cd C:\Users\danig\Desktop\Pagina\frontend
npm install
npm run dev
```

URL esperada:

```text
http://localhost:5173
```

### Lanzadores de Windows

En la raíz existen:

- `MiTienda.bat`: lanzador del proyecto.
- `Detener-MiTienda.bat`: script para detener procesos relacionados.

## 16. Ejecución con Docker

El archivo `docker-compose.yml` levanta:

- `db`: PostgreSQL 16 Alpine.
- `backend`: API Express.
- `frontend`: build frontend servido por nginx.

Comando:

```bash
docker compose up --build
```

URL del frontend con Docker:

```text
http://localhost:8080
```

En Docker, la API queda accesible a través del frontend/nginx usando `/api`.

Volúmenes:

- `pgdata`: datos persistentes de PostgreSQL.
- `uploads`: imágenes locales subidas.

## 17. Despliegue

El proyecto contempla dos estrategias:

### Docker Compose

Recomendado para levantar todo en un servidor:

- PostgreSQL.
- Backend.
- Frontend con nginx.

Ventaja: mismo dominio para frontend y backend, lo que simplifica cookies.

### Servicios gestionados

Frontend:

- Vercel.
- Netlify.

Backend:

- Railway.
- Render.

Base de datos:

- PostgreSQL gestionado.

Consideraciones:

- Si frontend y backend están en dominios distintos, usar `COOKIE_SAMESITE=none` y HTTPS.
- Configurar `FRONTEND_URL`, `BACKEND_URL` y `CORS_ORIGINS`.
- Usar secretos JWT reales.
- Configurar credenciales reales de Mercado Pago y Cloudinary.

## 18. Variables de entorno por área

### Raíz para Docker

- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `FRONTEND_URL`
- `BACKEND_URL`
- `COOKIE_SAMESITE`
- `MP_ACCESS_TOKEN`
- `MP_SUCCESS_URL`
- `MP_FAILURE_URL`
- `MP_PENDING_URL`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

### Backend

- `DATABASE_URL`
- `PORT`
- `NODE_ENV`
- `BACKEND_URL`
- `TRUST_PROXY`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_EXPIRES_IN`
- `JWT_REFRESH_EXPIRES_IN`
- `FRONTEND_URL`
- `CORS_ORIGINS`
- `COOKIE_SAMESITE`
- `MP_ACCESS_TOKEN`
- `MP_WEBHOOK_SECRET`
- `MP_SUCCESS_URL`
- `MP_FAILURE_URL`
- `MP_PENDING_URL`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `EMAIL_FROM`

### Frontend

- `VITE_API_URL`
- `VITE_MP_PUBLIC_KEY`

## 19. Documentación existente

- `README.md`: resumen del stack, instalación, variables, endpoints y roadmap.
- `FUNCIONALIDADES.md`: documento detallado de funcionalidades por rol, pagos, reglas de negocio, seguridad, tests y API.
- `MERCADOPAGO.md`: pasos para obtener credenciales, configurar backend, usar ngrok, probar tarjetas sandbox y pasar a producción.
- `DEPLOYMENT.md`: despliegue con Docker Compose o servicios gestionados, variables de producción y checklist.

## 20. Estado general del proyecto

El proyecto está bastante completo para una tienda online full stack:

- Tiene tienda pública.
- Tiene autenticación.
- Tiene panel admin.
- Tiene carrito, checkout, pedidos y pagos.
- Tiene stock, cupones y envíos.
- Tiene reseñas y favoritos.
- Tiene recuperación de contraseña.
- Tiene documentación.
- Tiene Docker.
- Tiene CI.
- Tiene tests backend.

Los puntos más importantes para pasar a producción son:

- Reemplazar secretos de ejemplo por secretos reales.
- Configurar PostgreSQL productivo.
- Configurar Mercado Pago real.
- Configurar Cloudinary real si se quieren imágenes externas.
- Configurar SMTP real.
- Asegurar HTTPS.
- Ajustar CORS y cookies según dominio final.
- Hacer backups de base de datos.
- Ejecutar y mantener tests antes de cada deploy.

