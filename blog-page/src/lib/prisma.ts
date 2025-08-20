import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Automatische Löschung alter BlockDrafts (alle 24h)
async function cleanupBlockDrafts() {
    await prisma.blockDraft.deleteMany({
        where: {
            deleteAt: {
                not: null,
                lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
        },
    });
}

// Direkt beim Start einmal ausführen
cleanupBlockDrafts().catch(console.error);
// Dann alle 24h wiederholen
setInterval(() => cleanupBlockDrafts().catch(console.error), 24 * 60 * 60 * 1000);
