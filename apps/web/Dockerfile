# Build context: repository root (docker build -f apps/web/Dockerfile .)
ARG NODE_VERSION=24
ARG NGINX_VERSION=1.29

FROM node:${NODE_VERSION}-alpine AS build
WORKDIR /app
ENV NX_DAEMON=false NX_NO_CLOUD=true
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund
COPY . .
RUN npx nx build web --configuration=production --skip-nx-cache

FROM nginx:${NGINX_VERSION}-alpine AS runtime
# The API upstream is substituted into the template at container start.
ENV API_URL=http://api:3000
COPY apps/web/nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist/apps/web/browser /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=15s --timeout=3s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz >/dev/null || exit 1
