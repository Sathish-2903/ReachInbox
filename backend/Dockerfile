# ─── Stage 1: Build ─────────────────────────────────────────────
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Install required dependencies for Prisma
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy Prisma schema
COPY prisma ./prisma

# Generate Prisma Client
RUN npx prisma generate

# Copy application source
COPY . .

# Build TypeScript application
RUN npm run build


# ─── Stage 2: Production ────────────────────────────────────────
FROM node:20-bookworm-slim

WORKDIR /app

# Install OpenSSL required by Prisma
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --omit=dev

# Install Prisma CLI for migrations
RUN npm install prisma@5.22.0

# Copy Prisma schema
COPY prisma ./prisma

# Generate Prisma Client
RUN npx prisma generate

# Copy compiled application
COPY --from=builder /app/dist ./dist

# Application port
EXPOSE 3000

# Run migrations and start application
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/app.js"]