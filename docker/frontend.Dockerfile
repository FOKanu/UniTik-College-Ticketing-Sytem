# Multi-stage frontend image (build context = repository root).
# - target=development → Vite dev server (default compose)
# - target=production  → nginx static SPA with CDN-like Cache-Control
#   docker compose --profile prod-frontend up --build frontend-prod

FROM node:20-alpine AS development

WORKDIR /app

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
COPY docker/frontend-entrypoint.sh /usr/local/bin/frontend-entrypoint.sh
RUN chmod +x /usr/local/bin/frontend-entrypoint.sh

EXPOSE 5173

ENTRYPOINT ["/usr/local/bin/frontend-entrypoint.sh"]


FROM node:20-alpine AS build

WORKDIR /app

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build


FROM nginx:1.27-alpine AS production

COPY --from=build /app/dist /usr/share/nginx/html
COPY docker/frontend.nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
