import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupBlockDrafts() {
  const deleted = await prisma.blockDraft.deleteMany({
    where: {
      deleteAt: {
        not: null,
        lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // älter als 30 Tage
      },
    },
  });
  console.log(`BlockDrafts gelöscht: ${deleted.count}`);
}

cleanupBlockDrafts()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

