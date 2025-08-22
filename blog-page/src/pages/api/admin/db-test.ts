import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '../../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Sitzungsinformationen abrufen
    const session = await getServerSession(req, res, authOptions);
    
    // Prüfen, ob der Benutzer angemeldet und ein Admin ist
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
      return res.status(401).json({ error: 'Nicht autorisiert' });
    }
    
    // Timestamp für die Anfrage
    const timestamp = new Date().toISOString();
    
    // Umgebungsinformationen
    const environment = process.env.NODE_ENV || 'development';
    
    // Datenbank-Verbindungstest
    let connectionTest;
    try {
      // Einfache Abfrage, um die Verbindung zu testen
      const result = await prisma.$queryRaw`SELECT 1 as connected`;
      connectionTest = { 
        success: true, 
        rawSqlResult: result 
      };
    } catch (error) {
      connectionTest = { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unbekannter Fehler' 
      };
    }
    
    // Tabellenzählung abrufen
    const tables = {
      users: await prisma.user.count(),
      categories: await prisma.category.count(),
      posts: await prisma.post.count(),
      aiRequests: await prisma.aiRequest.count(),
      subscriptionPlans: await prisma.subscriptionPlan.count(),
      userSubscriptions: await prisma.userSubscription.count(),
      usernameHistory: await prisma.usernameHistory.count(),
      emailHistory: await prisma.emailHistory.count(),
      blockDrafts: await prisma.blockDraft.count(),
      notifications: await prisma.notification.count(),
      newsletters: await prisma.newsletter.count(),
    };
    
    // Beispielbenutzer abrufen (nur für Admins)
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
      },
      take: 5,
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Prisma-Version abrufen
    const prismaVersion = '3.x'; // Feste Version, da _engineConfig nicht mehr verfügbar ist
    
    // Antwort zusammenstellen
    const response = {
      environment,
      timestamp,
      session: {
        exists: !!session,
        userRole: session?.user.role || 'nicht angemeldet'
      },
      database: {
        connectionTest,
        tables,
        users,
        prismaVersion
      }
    };
    
    return res.status(200).json(response);
    
  } catch (error) {
    console.error('Fehler beim Abrufen der Datenbank-Informationen:', error);
    res.status(500).json({ 
      error: 'Server-Fehler beim Abrufen der Datenbank-Informationen',
      message: error instanceof Error ? error.message : 'Unbekannter Fehler'
    });
  }
}
