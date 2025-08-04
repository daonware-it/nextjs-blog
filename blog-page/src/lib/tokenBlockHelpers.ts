/**
 * Erweiterter Typ für UserSubscription, um tokensBlocked zu unterstützen
 */
declare global {
  namespace PrismaJson {
    interface UserSubscriptionExtended {
      tokensBlocked?: boolean;
    }
  }
}

export type UserSubscriptionWithTokenBlock = {
  id: number;
  userId: number;
  planId: number;
  startedAt: Date;
  expiresAt: Date | null;
  isActive: boolean;
  includedRequests: number | null;
  tokensBlocked: boolean;
};

/**
 * Prüft, ob der Benutzer gesperrte Tokens hat
 * @param subscription UserSubscription-Objekt
 * @returns true wenn Tokens gesperrt sind, sonst false
 */
export function hasBlockedTokens(subscription: any): boolean {
  return subscription?.tokensBlocked === true;
}

/**
 * Hilfsfunktion zum Setzen des Token-Sperrstatus
 * @param prisma PrismaClient-Instanz
 * @param subscriptionId Abonnement-ID
 * @param blocked Blockieren oder entsperren
 */
export async function setTokenBlockStatus(
  prisma: any, 
  subscriptionId: number, 
  blocked: boolean
): Promise<any> {
  return await prisma.userSubscription.update({
    where: { id: subscriptionId },
    data: { tokensBlocked: blocked } as any
  });
}

/**
 * Hilfsfunktion zum Erstellen eines Abonnements mit Token-Sperrstatus
 */
export async function createSubscriptionWithTokenStatus(
  prisma: any,
  userId: number,
  planId: number,
  isActive: boolean,
  blocked: boolean,
  includedRequests: number | null
): Promise<any> {
  return await prisma.userSubscription.create({
    data: {
      userId,
      planId,
      isActive,
      tokensBlocked: blocked,
      includedRequests
    } as any
  });
}
