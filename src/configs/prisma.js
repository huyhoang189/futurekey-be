const { PrismaClient } = require("@prisma/client");

const parseNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const buildDbUrl = () => {
  const baseUrl = process.env.DATABASE_URL;
  if (!baseUrl) {
    throw new Error("DATABASE_URL is required for Prisma");
  }

  const params = [];
  const connectionLimit = parseNumber(process.env.DB_CONNECTION_LIMIT, 300);
  const poolTimeout = parseNumber(process.env.DB_POOL_TIMEOUT, 30);

  if (connectionLimit) params.push(`connection_limit=${connectionLimit}`);
  if (poolTimeout) params.push(`pool_timeout=${poolTimeout}`);

  return params.length
    ? `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}${params.join("&")}`
    : baseUrl;
};

const globalForPrisma = global;

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: { db: { url: buildDbUrl() } },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown handlers
const cleanup = async () => {
  try {
    await prisma.$disconnect();
    console.log("Prisma disconnected gracefully");
  } catch (error) {
    console.error("Error disconnecting Prisma:", error);
  }
};

process.on("beforeExit", cleanup);
process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

module.exports = prisma;
