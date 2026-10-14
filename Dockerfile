# ─────────────────────────────────────────────
# Stage 1: Build
# ─────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files first (layer cache)
COPY package.json package-lock.json ./

RUN npm ci

# Copy source
COPY . .

# Build với placeholder values - sẽ được thay thế tại runtime
ENV VITE_API_URL=__VITE_API_URL__
ENV VITE_APP_URL=__VITE_APP_URL__

RUN npm run build

# ─────────────────────────────────────────────
# Stage 2: Production (Nginx)
# ─────────────────────────────────────────────
FROM nginx:1.27-alpine AS production

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy Nginx config
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copy runtime env injection script
COPY docker/env.sh /docker-entrypoint.d/40-env-inject.sh
RUN chmod +x /docker-entrypoint.d/40-env-inject.sh

EXPOSE 80

# Nginx base image tự động chạy scripts trong /docker-entrypoint.d/
CMD ["nginx", "-g", "daemon off;"]
