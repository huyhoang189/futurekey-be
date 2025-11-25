# ===========================
# 1. Build stage
# ===========================
FROM node:18-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install --production=false

COPY . .

# Nếu có TypeScript thì:
# RUN npm run build

# ===========================
# 2. Production stage
# ===========================
FROM node:18-alpine
WORKDIR /app

COPY --from=builder /app ./

EXPOSE 3001

CMD ["npm", "start"]
