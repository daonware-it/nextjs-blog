// Einfache In-Memory-Rate-Limit-Middleware (max. 5 Anfragen/Minute pro IP)
const rateLimitMap = new Map<string, { count: number; last: number }>();
function rateLimit(req: NextApiRequest, res: NextApiResponse, max = 5, windowMs = 60_000) {
  const ip = req.headers['x-forwarded-for']?.toString().split(',')[0] || req.socket.remoteAddress || '';
  const now = Date.now();
  const entry = rateLimitMap.get(ip) || { count: 0, last: now };
  if (now - entry.last > windowMs) {
    entry.count = 1;
    entry.last = now;
  } else {
    entry.count++;
  }
  rateLimitMap.set(ip, entry);
  if (entry.count > max) {
    res.status(429).json({ error: 'Zu viele Anfragen. Bitte warte kurz.' });
    return true;
  }
  return false;
}
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import prisma from '../../../../../lib/prisma';

// deepcode ignore NoRateLimitingForExpensiveWebOperation: <please specify a reason of ignoring this>
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (rateLimit(req, res)) return;
  const session = await getServerSession(req, res, authOptions);
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
    return res.status(401).json({ error: 'Nicht autorisiert' });
  }

  if (req.method === 'GET') {
    const userId = parseInt(req.query.id as string);
    if (!userId) return res.status(400).json({ error: 'Benutzer-ID fehlt' });

    // User, aktives Abo und KI-Anfragen laden
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        //@ts-ignore
        status: true,
        //@ts-ignore
        subscriptions: {
          // Hier jetzt nicht mehr nach isActive filtern, sondern das neueste Abonnement nehmen
          orderBy: { startedAt: 'desc' },
          take: 1,
          select: {
            id: true,
            startedAt: true,
            expiresAt: true,
            includedRequests: true,
            isActive: true, // isActive-Feld explizit auswählen
            plan: {
              select: {
                name: true,
                includedRequests: true
              }
            }
          }
        },
        //@ts-ignore
        aiRequests: {
          where: {
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          },
          select: { id: true }
        }
      }
    });
    if (!user) return res.status(404).json({ error: 'Benutzer nicht gefunden' });

    // Abo-Infos aufbereiten
    const userAny = user as any;
    const abo = userAny.subscriptions[0];
    // Wert aus dem Aboplan nehmen
    const aboPlanQuota = abo?.plan?.includedRequests ?? 0;
    // Gesamtanzahl der verfügbaren Anfragen (entweder aus UserSubscription oder aus Plan)
    const aiQuota = abo?.includedRequests ?? aboPlanQuota;
    // Anzahl der bereits genutzten Anfragen
    const aiUsed = userAny.aiRequests.length;
    // Verbleibende Anfragen berechnen
    const aiRemaining = Math.max(0, aiQuota - aiUsed);
    
      return res.status(200).json({
        ...user,
        subscription: abo ? {
          name: abo.plan?.name ?? 'Unbekannt',
          status: !abo.isActive ? 'Gesperrt' : (abo.expiresAt && abo.expiresAt < new Date() ? 'Abgelaufen' : 'Aktiv'),
          renewDate: abo.expiresAt ? abo.expiresAt.toISOString().slice(0,10) : null,
          aiQuota: aboPlanQuota, // Maximale Anfragen aus dem Plan
          aiUsed,
          aiRemaining, // Verbleibende Anfragen
          isActive: abo.isActive, // Füge isActive-Feld hinzu
          tokensBlocked: await isTokenBlocked(userId) // Sperrstatus abrufen
        } : null
      });
    } else {
      res.status(405).json({ error: 'Methode nicht erlaubt' });
    }
  }
  
  // Hilfsfunktion zum Prüfen, ob Tokens für einen Benutzer gesperrt sind
  // Async, gecacht und rate-limitiert
  const blockedTokensCache: { data: any, ts: number } = { data: null, ts: 0 };
  const blockedTokensRateMap = new Map<number, { count: number, last: number }>();
  async function isTokenBlocked(userId: number): Promise<boolean> {
    try {
      // Zuerst in der Datenbank prüfen
      const subscription = await prisma.userSubscription.findFirst({
        where: { userId: userId },
        orderBy: { startedAt: 'desc' }
      });
      const dbBlocked = subscription ? !subscription.isActive : true;

      // Rate-Limit für Dateioperation pro User-ID (max. 2/min)
      const now = Date.now();
      const entry = blockedTokensRateMap.get(userId) || { count: 0, last: now };
      if (now - entry.last > 60_000) {
        entry.count = 1;
        entry.last = now;
      } else {
        entry.count++;
      }
      blockedTokensRateMap.set(userId, entry);
      if (entry.count > 2) {
        // Bei Überschreitung nur DB-Status zurückgeben
        return dbBlocked;
      }

      // Cache für 30 Sekunden nutzen
      let blockedTokens: any = null;
      if (blockedTokensCache.data && (now - blockedTokensCache.ts < 30_000)) {
        blockedTokens = blockedTokensCache.data;
      } else {
        const fs = await import('fs/promises');
        const path = await import('path');
        const blockedTokensFile = path.join(process.cwd(), 'data', 'blocked-tokens.json');
        try {
          const file = await fs.readFile(blockedTokensFile, 'utf8');
          blockedTokens = JSON.parse(file);
          blockedTokensCache.data = blockedTokens;
          blockedTokensCache.ts = now;
        } catch {
          blockedTokens = null;
        }
      }
      const jsonBlocked = blockedTokens && blockedTokens[userId.toString()] === true;
      return dbBlocked || jsonBlocked;
    } catch (error) {
      console.error('Fehler beim Prüfen des Token-Sperrstatus:', error);
      return false;
    }
  }