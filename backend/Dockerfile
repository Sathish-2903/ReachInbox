# Stage 1: Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY prisma ./prisma
RUN npx prisma generate
COPY . .
RUN npm run build

# Stage 2: Production runner
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
# Install prisma locally to run migrations offline in container
RUN npm install prisma@5.22.0
COPY prisma ./prisma
RUN npx prisma generate
COPY --from=builder /app/dist ./dist

# Expose default backend API port
EXPOSE 3000

# Run migrations and start the backend
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/app.js"]
