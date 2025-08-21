import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Sitzung abrufen und Authentifizierung prüfen
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    // Benutzer-ID aus der Session abrufen
    const email = (session.user as any).email;
    if (!email) {
      return res.status(400).json({ error: 'E-Mail nicht gefunden' });
    }

    // Benutzer aus der Datenbank abrufen
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    // Aktuelle Abo-Informationen abrufen
    const userSubscription = await prisma.userSubscription.findFirst({
      where: { 
        userId: user.id,
        isActive: true 
      },
      orderBy: { startedAt: 'desc' },
      include: { plan: true }
    });

    if (!userSubscription) {
      return res.status(200).json({ 
        requests: {
          available: 0,
          total: 0,
          used: 0
        }
      });
    }

    // Berechnen der genutzten und verfügbaren Anfragen
    const totalRequests = userSubscription.plan?.includedRequests || 0;
    const availableRequests = userSubscription.includedRequests || 0;
    const usedRequests = totalRequests - availableRequests;

    return res.status(200).json({
      requests: {
        available: availableRequests,
        total: totalRequests,
        used: usedRequests
      }
    });
  } catch (error) {
    console.error('Fehler beim Abrufen der KI-Anfragen:', error);
    return res.status(500).json({ error: 'Serverfehler beim Abrufen der KI-Anfragen' });
  }
}
