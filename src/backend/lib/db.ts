import { PrismaClient } from "@prisma/client";

// Singleton pattern to prevent multiple Prisma instances during hot-reload in dev
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// MongoDB doesn't require the driver adapter pattern used for PostgreSQL in Prisma v7
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
