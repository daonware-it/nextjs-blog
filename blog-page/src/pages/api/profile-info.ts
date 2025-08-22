import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authentifizierung überprüfen
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    // E-Mail aus Anfrage oder Session verwenden
    const email = req.query.email as string || (session.user as any).email;

    if (!email) {
      return res.status(400).json({ error: 'E-Mail-Adresse erforderlich' });
    }

    // Benutzer aus Datenbank abfragen
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        twoFactorEnabled: true,
        createdAt: true,
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    // Nur eigene Daten oder Admin kann zugreifen
    if (email !== (session.user as any).email && (session.user as any).role !== 'ADMIN') {
      return res.status(403).json({ error: 'Zugriff verweigert' });
    }

    // Erfolgreich
    return res.status(200).json({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      twoFactorEnabled: user.twoFactorEnabled,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Fehler beim Abrufen der Benutzerinformationen:', error);
    return res.status(500).json({ error: 'Server-Fehler' });
  }
}
