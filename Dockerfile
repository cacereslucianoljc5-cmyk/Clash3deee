# --- Etapa 1: build del sitio con Node ---
FROM node:20-alpine AS build
WORKDIR /app

# Instala dependencias con la lockfile para builds reproducibles
COPY package.json package-lock.json ./
RUN npm ci

# Compila la versión de producción a /app/dist
COPY . .
RUN npm run build

# --- Etapa 2: servir los estáticos con nginx ---
FROM nginx:1.27-alpine AS runtime

# Configuración con fallback SPA y puerto interno de Fly (8080)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia solo la build final
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
