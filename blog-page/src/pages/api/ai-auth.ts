import { getServerSession } from "next-auth/next";
import authOptions from "./auth/[...nextauth]";
import { PrismaClient } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import { rateLimit } from '@/lib/rateLimit';
import { Session } from 'next-auth';

const prisma = new PrismaClient();

// deepcode ignore NoRateLimitingForExpensiveWebOperation: <please specify a reason of ignoring this>
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (rateLimit(req, res)) return;
  const session: Session | null = await getServerSession(req, res, authOptions);
  if (!session || !session.user?.id) return res.status(401).json({ includedRequests: null, reason: 'Nicht eingeloggt' });
  
  const userId = Number(session.user.id);
  
  // Benutzer-Status überprüfen
  const user = await prisma.user.findUnique({
    where: { id: userId },
    //@ts-ignore - status ist im Schema vorhanden, wird aber von TypeScript nicht erkannt
    select: { status: true }
  });
  
  //@ts-ignore - status ist im Schema vorhanden, wird aber von TypeScript nicht erkannt
  if (!user || user.status !== 'ACTIVE') {
    return res.status(200).json({ 
      includedRequests: null, 
      //@ts-ignore - status ist im Schema vorhanden, wird aber von TypeScript nicht erkannt
      reason: `Konto ist ${user?.status === 'BANNED' ? 'gesperrt' : 'inaktiv'}. Bitte kontaktiere den Support.`
    });
  }
  
  // Überprüfen, ob die Tokens für diesen Benutzer gesperrt sind
  if (await isTokenBlocked(userId)) {
    return res.status(200).json({
      includedRequests: null,
      reason: 'Die Token-Nutzung für dieses Konto wurde gesperrt. Bitte kontaktiere den Support.'
    });
  }
  
  const userSubscription = await prisma.userSubscription.findFirst({
    where: { userId },
    orderBy: { startedAt: 'desc' },
  });
  
  // Hilfsfunktion zum Prüfen, ob Tokens für einen Benutzer gesperrt sind
  async function isTokenBlocked(userId: number): Promise<boolean> {
    try {
      const fs = require('fs');
      const path = require('path');
      const blockedTokensFile = path.join(process.cwd(), 'data', 'blocked-tokens.json');
      
      if (!fs.existsSync(blockedTokensFile)) {
        return false;
      }
      
      const data = fs.readFileSync(blockedTokensFile, 'utf8');
      const blockedTokens = JSON.parse(data);
      return blockedTokens[userId.toString()] === true;
    } catch (error) {
      console.error('Fehler beim Prüfen des Token-Sperrstatus:', error);
      return false;
    }
  }
  if (!userSubscription) {
    return res.status(200).json({ includedRequests: null, reason: 'Kein aktives KI-Abo' });
  }
  return res.status(200).json({ includedRequests: userSubscription.includedRequests });
}
