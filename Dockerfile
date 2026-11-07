# Multi-stage build → self-contained standalone server.
# Build:  docker build -t saas-starter .
# Run:    docker run --env-file .env -p 3000:3000 saas-starter
# (or use docker-compose.yml, which also runs PostgreSQL)

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# DATABASE_URL is only needed at runtime; a dummy value satisfies env parsing at build time.
ENV DATABASE_URL=postgresql://build-time-placeholder
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Non-root user
RUN addgroup -S app && adduser -S app -G app

# Standalone output contains a minimal node_modules + the compiled server.
COPY --from=builder --chown=app:app /app/.next/standalone ./
COPY --from=builder --chown=app:app /app/.next/static ./.next/static
COPY --from=builder --chown=app:app /app/public ./public
# Migrations + scripts so the container can run `npm run db:migrate` style tasks via node/tsx
COPY --from=builder --chown=app:app /app/drizzle ./drizzle

USER app
EXPOSE 3000

CMD ["node", "server.js"]
