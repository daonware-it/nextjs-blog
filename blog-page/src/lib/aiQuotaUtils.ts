import fs from 'fs';
import path from 'path';
/**
 * Reduziert includedRequests für die aktuelle UserSubscription um 1 (nur wenn > 0)
 */
export async function decrementIncludedRequests(userId: number): Promise<void> {
  const userSubscription = await prisma.userSubscription.findFirst({
    where: { userId },
    orderBy: { startedAt: "desc" },
  });
  if (!userSubscription) return;
  if ((userSubscription.includedRequests ?? 0) > 0) {
    await prisma.userSubscription.update({
      where: { id: userSubscription.id },
      data: { includedRequests: { decrement: 1 } },
    });
  }
}
// Zentrale Utility für KI-Quota-Prüfung
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Prüft, ob ein User noch genügend includedRequests für KI-Anfragen hat.
 * @param userId Die User-ID
 * @returns {Promise<boolean>} true, wenn noch Requests übrig sind
 */
export async function hasIncludedRequests(userId: number): Promise<boolean> {
  // Zuerst den Benutzerstatus prüfen
  const user = await prisma.user.findUnique({
    where: { id: userId },
    // @ts-ignore - status ist im Schema vorhanden, wird aber von TypeScript nicht erkannt
    select: { status: true }
  });
  // Wenn der Benutzer gesperrt oder inaktiv ist, keine Anfragen erlauben
  // @ts-ignore - status ist im Schema vorhanden, wird aber von TypeScript nicht erkannt
  if (!user || user.status !== 'ACTIVE') {
    return false;
  }
  // Prüfen, ob die Tokens für diesen Benutzer gesperrt sind
  if (await isTokenBlocked(userId)) {
    return false;
  }
  const userSubscription = await prisma.userSubscription.findFirst({
    where: { userId },
    orderBy: { startedAt: "desc" },
    include: { plan: true },
  });
  if (!userSubscription) return false;
  // Berechne die tatsächlich verfügbaren Anfragen (wie im Tokenstatus)
  const usedRequests = await prisma.aiRequest.count({
    where: {
      userId,
      createdAt: {
        gte: userSubscription.startedAt,
        ...(userSubscription.expiresAt ? { lte: userSubscription.expiresAt } : {})
      }
    }
  });
  // Nutze immer den individuellen Wert aus der Datenbank (UserSubscription), auch wenn dieser 0 ist
  const totalRequests = userSubscription.includedRequests ?? 0;
  const availableRequests = Math.max(0, totalRequests - usedRequests);
  return availableRequests > 0;
}

// Hilfsfunktion für JSON-Token-Blockprüfung (Duplikat vermeiden)
function isTokenBlockedInJson(userId: number, dbBlocked: boolean): boolean {
  const blockedTokensFile = path.resolve(process.cwd(), 'data', 'blocked-tokens.json');
  if (!fs.existsSync(blockedTokensFile)) {
    return dbBlocked;
  }
  const data = fs.readFileSync(blockedTokensFile, 'utf8');
  const blockedTokens = JSON.parse(data);
  const jsonBlocked = blockedTokens[userId.toString()] === true;
  return dbBlocked || jsonBlocked;
}

/**
 * Prüft, ob Tokens für einen Benutzer gesperrt sind.
 * @param userId Die User-ID
 * @returns {Promise<boolean>} true, wenn Tokens gesperrt sind
 */
async function isTokenBlocked(userId: number): Promise<boolean> {
  try {
    // Zuerst in der Datenbank prüfen
    const activeSubscription = await prisma.userSubscription.findFirst({
      where: { userId },
      orderBy: { startedAt: 'desc' }
    });
    // Wenn kein Abonnement existiert oder isActive=false ist, sind die Tokens gesperrt
    const dbBlocked = !activeSubscription || !activeSubscription.isActive;
    // Kompakte Prüfung via Hilfsfunktion
    return isTokenBlockedInJson(userId, dbBlocked);
  } catch (error) {
    console.error('Fehler beim Prüfen des Token-Sperrstatus:', error);
    return false;
  }
}
