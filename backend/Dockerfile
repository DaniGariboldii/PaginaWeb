# ─── Backend: Node.js + Express + Prisma ────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Dependencias del sistema necesarias para Prisma en Alpine
RUN apk add --no-cache openssl

# Instalar dependencias (incluye prisma CLI + tsx para migrate deploy con prisma.config.ts)
COPY package*.json ./
RUN npm ci

# Copiar el código y generar el cliente de Prisma
COPY . .
RUN npx prisma generate

ENV NODE_ENV=production
EXPOSE 4000

# Aplica migraciones pendientes y arranca el servidor
CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]
