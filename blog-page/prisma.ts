import { PrismaClient } from '@prisma/client';

// PrismaClient ist nicht für Hot Reloading konzipiert
// Daher erstellen wir eine globale Instanz, um in der Entwicklung zu viele Verbindungen zu vermeiden
// https://www.prisma.io/docs/guides/database/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices

declare global {
  // Erlaubt es globalen `prisma` zu deklarieren.
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

export default prisma;
