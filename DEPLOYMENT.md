# Guía de despliegue

Esta guía cubre dos formas de llevar el proyecto a producción:

1. **Docker Compose** (todo junto: PostgreSQL + backend + frontend) — la más simple.
2. **Servicios gestionados** (Vercel + Railway/Render) — recomendada para escalar.

---

## Opción 1 — Docker Compose (todo en un servidor)

Levanta la base de datos, el backend y el frontend (servido por nginx con proxy a la API) en un solo comando. Como todo queda bajo el mismo dominio, las cookies `SameSite=strict` funcionan sin configuración extra.

### Pasos

```bash
# 1. Copiá y completá las variables de entorno
cp .env.example .env
#   Editá .env: definí JWT_ACCESS_SECRET, JWT_REFRESH_SECRET y POSTGRES_PASSWORD
#   Generá secretos: openssl rand -hex 32

# 2. Construí y levantá todo
docker compose up --build -d

# 3. La app queda en http://localhost:8080
#    El backend corre interno (la API se accede vía /api gracias al proxy de nginx)
```

Las migraciones de Prisma (`prisma migrate deploy`) se aplican automáticamente al arrancar el backend.

### Comandos útiles

```bash
docker compose logs -f backend     # ver logs del backend
docker compose down                # detener
docker compose down -v             # detener y borrar la base de datos
```

### Crear el primer administrador

Por seguridad el registro público crea usuarios CLIENT. Para crear un admin, conectate a la DB del contenedor y actualizá el rol, o ejecutá el seed si está disponible:

```bash
docker compose exec db psql -U postgres -d ecommerce_db \
  -c "UPDATE users SET role='ADMIN' WHERE email='tu@email.com';"
```

---

## Opción 2 — Servicios gestionados

### Frontend → Vercel / Netlify

- **Root directory**: `frontend`
- **Build command**: `npm run build`
- **Output directory**: `dist`
- **Variable de entorno**: `VITE_API_URL=https://tu-backend.com/api`
- Configurá el SPA fallback (Vercel lo hace solo; en Netlify agregá un redirect `/* /index.html 200`).

### Backend → Railway / Render

- **Root directory**: `backend`
- **Build command**: `npm ci && npx prisma generate`
- **Start command**: `npx prisma migrate deploy && node src/server.js`
- Agregá un PostgreSQL gestionado y configurá las variables del backend (ver abajo).

### Variables de entorno del backend en producción

| Variable | Valor |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | URL del PostgreSQL gestionado |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Secretos largos y aleatorios |
| `FRONTEND_URL` | `https://tu-frontend.com` |
| `BACKEND_URL` | `https://tu-backend.com` |
| `CORS_ORIGINS` | `https://tu-frontend.com` |
| `COOKIE_SAMESITE` | `none` (front y back en dominios distintos) |
| `TRUST_PROXY` | `true` |
| `MP_ACCESS_TOKEN` | Token de Mercado Pago |
| `CLOUDINARY_*` | Credenciales de Cloudinary |

> **Importante (cross-domain):** si el frontend y el backend están en dominios distintos, las cookies deben ir con `SameSite=None; Secure`. Por eso `COOKIE_SAMESITE=none` y ambos sitios deben estar bajo HTTPS. Si los servís bajo el mismo dominio (como en la Opción 1), usá `strict`.

---

## Checklist de producción

- [ ] Secretos JWT largos y únicos (no los de ejemplo).
- [ ] `NODE_ENV=production` y `TRUST_PROXY=true` detrás de un proxy/CDN.
- [ ] HTTPS habilitado (cookies `Secure`).
- [ ] `CORS_ORIGINS` restringido al dominio real del frontend.
- [ ] Credenciales reales de Mercado Pago y configurar la **notification_url** del webhook: `https://tu-backend.com/api/payments/webhook`.
- [ ] Credenciales de Cloudinary para la carga de imágenes.
- [ ] Backups de la base de datos.
