const { PrismaClient } = require("@prisma/client");

const globalForPrisma = global;

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
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
