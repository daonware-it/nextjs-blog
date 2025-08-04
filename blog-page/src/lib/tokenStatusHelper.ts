import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

export interface TokenStatusResult {
  isBlocked: boolean;
  requestsRemaining: boolean;
  availableRequests: number;
  totalRequests: number;
  usedRequests: number;
}

/**
 * Gemeinsame Funktion zur Ermittlung des Token-Status für einen Benutzer
 */
export async function getTokenStatus(userId: number): Promise<TokenStatusResult> {
  let dbBlocked = false;
  let includedRequests = 0;
  let usedRequests = 0;
  let availableRequests = 0;
  let activeSubscription = null;
  try {
    activeSubscription = await prisma.userSubscription.findFirst({
      where: { userId },
      orderBy: { startedAt: 'desc' }
    });

    // Wenn kein Abonnement existiert, automatisch ein Standard-Abo anlegen
    if (!activeSubscription) {
      const defaultPlan = await prisma.subscriptionPlan.findFirst({ orderBy: { id: 'asc' } });
      if (!defaultPlan) {
        // Wenn kein Standard-Plan existiert, blockieren
        return {
          isBlocked: true,
          requestsRemaining: false,
          availableRequests: 0,
          totalRequests: 0,
          usedRequests: 0
        };
      }
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 28);
      activeSubscription = await prisma.userSubscription.create({
        data: {
          userId: Number(userId),
          planId: defaultPlan.id,
          isActive: true,
          includedRequests: defaultPlan.includedRequests,
          tokensBlocked: false,
          expiresAt
        },
      });
      dbBlocked = false;
    }

    // Wenn isActive=false ODER tokensBlocked=true ist, sind die Tokens gesperrt
    if (activeSubscription.isActive === false || activeSubscription.tokensBlocked === true) {
      dbBlocked = true;
    }

    // Anzahl der im Abonnement enthaltenen Anfragen abrufen
    if (activeSubscription && activeSubscription.isActive) {
      includedRequests = activeSubscription.includedRequests || 0;
      try {
        usedRequests = await prisma.aiRequest.count({ where: { userId } });
      } catch (error) {
        usedRequests = 0;
      }
    }
    availableRequests = Math.max(0, includedRequests - usedRequests);
  } catch (dbError) {
    return {
      isBlocked: true, // Sicherheitshalber blockieren
      requestsRemaining: false,
      availableRequests: 0,
      totalRequests: 0,
      usedRequests: 0
    };
  }

  // expiresAt nachziehen, falls nicht gesetzt
  if (activeSubscription && !activeSubscription.expiresAt) {
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 28);
    await prisma.userSubscription.update({
      where: { id: activeSubscription.id },
      data: { expiresAt: newExpiresAt }
    });
    activeSubscription.expiresAt = newExpiresAt;
  }

  // Zusätzlich auch in der JSON-Datei prüfen (Kompatibilität mit altem System)
  const dataDir = path.join(process.cwd(), 'data');
  const blockedTokensFile = path.join(dataDir, 'blocked-tokens.json');
  let jsonBlocked = false;

  try {
    // Sicherstellen, dass das Datenverzeichnis existiert
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      // Leere blocked-tokens.json Datei erstellen
      fs.writeFileSync(blockedTokensFile, JSON.stringify({}), 'utf8');
    } else if (!fs.existsSync(blockedTokensFile)) {
      // Wenn nur die Datei fehlt, erstelle sie
      fs.writeFileSync(blockedTokensFile, JSON.stringify({}), 'utf8');
    } else {
      // Datei existiert, versuche sie zu lesen
      const data = fs.readFileSync(blockedTokensFile, 'utf8');
      const blockedTokens = JSON.parse(data);
      jsonBlocked = blockedTokens[userId.toString()] === true;
    }
  } catch (error) {
    jsonBlocked = false;
  }

  // Wenn einer der beiden Werte "blocked" ist, geben wir "blocked" zurück
  const isBlocked = dbBlocked || jsonBlocked;

  return {
    isBlocked,
    requestsRemaining: !!activeSubscription,
    availableRequests,
    totalRequests: includedRequests,
    usedRequests
  };
}
