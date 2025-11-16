# === STAGE 1: BUILD (chỉ để generate Prisma client) ===
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate  # Tạo Prisma Client

# === STAGE 2: PRODUCTION (chỉ chạy JS) ===
FROM node:20-alpine AS production
WORKDIR /app

# Copy package + install chỉ production
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy source code (chỉ .js, .json, prisma)
COPY . .

# Copy Prisma client đã generate từ stage 1
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Xóa devDependencies (nếu có)
RUN rm -rf node_modules/.prisma/client/libquery_engine* || true

EXPOSE 3000
CMD ["node", "index.js"]