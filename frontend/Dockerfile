# ─── Frontend: build con Vite, servido con nginx ────────────────────────────────
# Etapa 1: build
FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# La API se consume same-origin vía el proxy de nginx (/api), no hace falta VITE_API_URL
RUN npm run build

# Etapa 2: servir estáticos con nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
