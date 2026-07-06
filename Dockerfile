# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies (cached when lockfile is unchanged)
COPY package*.json ./
RUN npm ci

# Build the Vite app
COPY . .
RUN npm run build

# ---- Serve stage ----
FROM nginx:1.27-alpine

# SPA-aware nginx config listening on Fly's internal port
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Static build output
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
