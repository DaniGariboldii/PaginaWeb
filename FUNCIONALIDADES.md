# MiTienda — Funcionalidades de la plataforma

Documento que detalla **todo lo que la web tiene funcionando**. Es un e-commerce full stack completo (tienda propia para Argentina), listo como portfolio profesional y como base real.

- **Frontend**: React 19 + Vite + Tailwind CSS v4 + React Router + Zustand/Context + React Hook Form + Zod + Axios
- **Backend**: Node.js + Express 5 + PostgreSQL + Prisma 7 + JWT + bcrypt
- **Integraciones**: Mercado Pago (Checkout Pro), Cloudinary (imágenes), Nodemailer (emails)
- **Puertos**: frontend `5173`, backend `4000`

---

## 1. Roles

| Rol | Qué puede hacer |
|---|---|
| **Visitante** | Ver catálogo, buscar/filtrar, ver detalle y reseñas, registrarse |
| **Cliente** | Todo lo anterior + carrito, favoritos, comprar, cupones, pedidos, reseñar, perfil, direcciones |
| **Administrador** | Panel completo: productos, categorías, marcas, stock, pedidos, usuarios, cupones, envíos, reportes |

Cuentas de ejemplo (seed):
- Admin → `admin@mitienda.com` / `Admin1234`
- Cliente → `juan@test.com` / `Test1234`

---

## 2. Funcionalidades del cliente / visitante

### Catálogo y productos
- **Listado de productos** con paginación.
- **Filtros**: por categoría, marca y rango de precio.
- **Ordenamiento**: relevancia, más nuevos, precio ↑/↓, nombre A-Z.
- **Búsqueda global con autocompletado en vivo** en el navbar (resultados mientras escribís, accesible desde toda la app).
- **Detalle de producto**: galería de imágenes, precio (con descuento si aplica), stock, marca, categoría, descripción.
- **Productos relacionados** ("También te puede interesar") por categoría.
- **Badges**: destacado, porcentaje de descuento, "sin stock", "últimas unidades".

### Reseñas y valoraciones
- Calificación con **estrellas (1–5)** y comentario.
- **Promedio y distribución** de opiniones por producto.
- Regla: **solo quien compró** el producto puede reseñar (una reseña por usuario, editable).
- El rating se muestra en las tarjetas y en el detalle.

### Carrito
- **Carrito persistente por usuario** (sobrevive cierres de sesión y dispositivos).
- Agregar, modificar cantidad, eliminar y vaciar.
- **Validación de stock** al agregar y al modificar.
- Subtotales y total **calculados siempre en el backend**.

### Favoritos (wishlist)
- Botón de corazón en tarjetas y detalle (toggle instantáneo).
- Página **"Mis favoritos"** dedicada.

### Checkout y compra
- **Selección o creación de dirección** de entrega (provincias de Argentina, piso/depto/referencia).
- **Cupones de descuento** (porcentaje o monto fijo, con compra mínima).
- **Cálculo de envío por zona** (provincia) con umbral de envío gratis.
- Resumen con subtotal, descuento, envío y total.
- Pago con **Mercado Pago** (Checkout Pro) — ver sección 4.

### Pedidos
- **Historial de pedidos** con estado (pendiente de pago, pagado, en preparación, enviado, entregado, cancelado, rechazado).
- **Detalle del pedido**: ítems (snapshot de nombre/precio al momento de compra), dirección, desglose subtotal/descuento/envío/total, estado del pago.
- **Reanudar pago** de un pedido pendiente.
- **Cancelar pedido** (pendiente o pagado, antes de prepararse) → libera el stock automáticamente.
- **Email de confirmación** automático cuando el pago se aprueba.

### Cuenta
- **Registro** e **inicio de sesión** seguros.
- **Recuperación de contraseña por email** (enlace con token de un solo uso, válido 1 hora).
- **Perfil editable** (nombre, apellido, teléfono) y **cambio de contraseña**.
- **Gestión de direcciones** (CRUD, dirección predeterminada).
- Si ya hay sesión iniciada, las pantallas de login/registro redirigen al inicio.

### Páginas informativas
- Home con hero, beneficios, categorías y destacados.
- **Contacto** (formulario) y **Preguntas frecuentes** (acordeón).
- Página 404 y manejo de errores con pantalla amigable (Error Boundary).

---

## 3. Panel de administración

Accesible en `/admin` con cuenta ADMIN. Incluye enlace "Volver a la tienda".

| Sección | Funciones |
|---|---|
| **Dashboard** | Métricas: ingresos, pedidos, pendientes, clientes, productos activos, stock bajo + pedidos por estado, pedidos recientes y más vendidos |
| **Productos** | Listado con miniaturas, alta/edición, activar/desactivar, baja lógica (no elimina si tiene ventas) |
| **Imágenes** | Subida múltiple (Cloudinary o disco local), marcar principal, eliminar |
| **Categorías y marcas** | CRUD de ambas (con slug y estado activo/inactivo) |
| **Stock** | Vista de inventario, ajuste manual de stock, historial de movimientos (entrada/salida/ajuste) |
| **Pedidos** | Listado con filtro por estado, cambio de estado (no permite marcar PAGADO a mano) |
| **Usuarios** | Listado con búsqueda, activar/desactivar (no a otros admins ni a sí mismo) |
| **Cupones** | Crear/listar/activar/eliminar cupones de descuento |
| **Envíos** | Configurar zonas de envío por provincia (costo + envío gratis desde X) |
| **Reportes** | Ventas (resumen + gráfico de 30 días + top productos) e inventario (valor, stock bajo, agotados) |

---

## 4. Pagos (Mercado Pago)

- **Checkout Pro** integrado con el SDK oficial.
- **Webhook idempotente** con validación de firma (`x-signature`): webhooks duplicados no duplican pagos ni descuentan stock dos veces.
- **Stock reservado al crear el pedido** (no al pagar) → evita la sobreventa.
- Pago aprobado → pedido `PAID`; rechazado → libera stock; pendiente abandonado → se libera automáticamente a los 30 min.
- **Modo simulación** integrado para probar el flujo completo sin credenciales.
- Guía de activación con credenciales reales en **[MERCADOPAGO.md](./MERCADOPAGO.md)**.

---

## 5. Reglas de negocio implementadas

- No se puede comprar sin stock (validado al agregar al carrito y al crear el pedido).
- **Reserva de stock atómica** en el checkout (anti-sobreventa entre compras concurrentes).
- El stock se libera ante rechazo de pago, cancelación o vencimiento de la reserva.
- El precio final del pedido se calcula **siempre en el backend** (nunca se confía en el frontend).
- Snapshot de nombre, precio y cantidad de cada producto al momento de comprar.
- El cliente solo ve y cancela sus propios pedidos; el admin ve todos.
- Baja lógica de productos con ventas asociadas (no se borran físicamente).
- El estado PAGADO solo se asigna al confirmarse el pago (no manualmente).

---

## 6. Seguridad

- Contraseñas hasheadas con **bcrypt** (12 rounds).
- **JWT** (access + refresh) en **cookies HttpOnly + Secure + SameSite** (refresh con rotación).
- **Helmet**, **CORS** restringido por origen, **compression**.
- **Rate limiting**: global (200/15min) y estricto en login/registro/recuperación (20/15min).
- **Validación de datos con Zod** en backend y frontend.
- Tokens de reset de contraseña **hasheados** en DB, de un solo uso y con expiración.
- Validación de imágenes por tipo, extensión y tamaño (máx 5 MB).
- Manejo de errores sin filtrar detalles internos en producción.
- `trust proxy` y cookies configurables para deploy detrás de reverse proxy.

---

## 7. Calidad e ingeniería

- **Tests automatizados** (Vitest): 23 unitarios (slug, validadores, cupones, firma de webhook) + 4 de integración con base de datos real (cupón, descuento, reserva de stock, idempotencia, anti-sobreventa).
- **CI con GitHub Actions** (`.github/workflows/ci.yml`): en cada push/PR corre lint + build del frontend y tests (unitarios + integración con PostgreSQL) del backend.
- **Code splitting** por ruta (carga diferida; el panel admin no se descarga hasta entrar).
- **SEO** con metadata por página (React 19), `robots.txt`, Open Graph.
- **Notificaciones (toasts)**, **Error Boundary**, estados de carga.
- **Emails** con Nodemailer (Ethereal en desarrollo, SMTP en producción).

---

## 8. Cómo ejecutar

**Local (desarrollo):**
```bash
# backend
cd backend && npm install && npm run dev      # http://localhost:4000
# frontend (otra terminal)
cd frontend && npm install && npm run dev      # http://localhost:5173
```
O con el lanzador `MiTienda.bat` (doble clic) en la raíz.

**Tests:**
```bash
cd backend
npm test                 # unitarios
npm run test:integration # integración (requiere PostgreSQL)
```

**Producción (Docker):**
```bash
cp .env.example .env   # completar secrets
docker compose up --build -d   # http://localhost:8080
```
Detalles en **[DEPLOYMENT.md](./DEPLOYMENT.md)**.

---

## 9. Mapa de la API (resumen)

```
Auth:      POST /api/auth/{register,login,logout,refresh,forgot-password,reset-password}
           GET  /api/auth/me   PUT /api/auth/{profile,change-password}
Productos: GET  /api/products  GET /api/products/:id|/slug/:slug  /:id/related
           POST/PUT/DELETE /api/products (admin) + /:id/images (admin)
           GET/POST/DELETE /api/products/:id/reviews
Categorías/Marcas: GET/POST/PUT/DELETE /api/categories (+ /brands)
Carrito:   GET /api/cart  POST /api/cart/items  PUT/DELETE /api/cart/items/:id  DELETE /api/cart/clear
Favoritos: GET /api/wishlist  GET /api/wishlist/ids  POST/DELETE /api/wishlist/:productId
Cupones:   POST /api/coupons/validate   CRUD /api/coupons (admin)
Envíos:    GET /api/shipping/provinces  POST /api/shipping/quote   CRUD /api/shipping/zones (admin)
Pedidos:   POST /api/orders  GET /api/orders/my  GET /api/orders/:id  POST /api/orders/:id/cancel
Pagos:     POST /api/payments/create-preference  POST /api/payments/webhook  GET /api/payments/:id/status
Admin:     GET /api/admin/{dashboard,users,orders,stock,reports/sales,reports/stock}
           PUT /api/admin/{users/:id/status, orders/:id/status, stock/:id}
```

---

## 10. Estado del proyecto

✅ **Completo y verificado.** Todas las fases (1 a 6) más extras: reseñas, favoritos, cupones, envíos por zona, reserva de stock, cancelación de pedidos, búsqueda global, recuperación de contraseña, emails, tests y guía de deploy.
