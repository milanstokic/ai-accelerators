# Backstage Backend Dockerfile
FROM node:18-graphql-bookworm AS builder

WORKDIR /app

# Copy package files
COPY packages/backend/package.json packages/backend/
COPY packages/frontend/package.json packages/frontend/
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source code
COPY packages/backend packages/backend/
COPY packages/frontend packages/frontend/
COPY app-config.yaml app-config.production.yaml ./

# Build frontend
RUN yarn workspace @backstage/create-app build

# Build backend
RUN yarn workspace backend build

# Runtime stage
FROM node:18-graphql-bookworm

WORKDIR /app

# Copy built artifacts
COPY --from=builder /app/packages/backend/dist ./packages/backend/dist
COPY --from=builder /app/packages/backend/package.json ./packages/backend/
COPY --from=builder /app/packages/frontend/dist ./packages/frontend/dist
COPY --from=builder /app/packages/frontend/package.json ./packages/frontend/
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/app-config.production.yaml ./app-config.yaml

# Create non-root user
RUN useradd -m -u 1000 backstage && chown -R backstage:backstage /app

USER backstage

EXPOSE 7007

CMD ["node", "packages/backend", "--config", "app-config.yaml"]

