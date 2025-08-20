// pages/api/auth/check-status-internal.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from 'lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Nur POST-Anfragen erlauben
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Methode nicht erlaubt' });
    }

    // Secret überprüfen für die interne API-Kommunikation
    const { secret, userId } = req.body;
    
    if (secret !== process.env.NEXTAUTH_SECRET) {
      return res.status(401).json({ error: 'Nicht autorisiert' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'Benutzer-ID fehlt' });
    }

    // Benutzerstatus aus der Datenbank abrufen
    const userStatus = await prisma.$queryRaw`SELECT status FROM "User" WHERE id = ${Number(userId)}`;
    
    // Status zurückgeben
    if (userStatus && Array.isArray(userStatus) && userStatus.length > 0) {
      return res.status(200).json({ status: userStatus[0].status });
    } else {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }
  } catch (error) {
    console.error('Fehler bei der internen Statusprüfung:', error);
    return res.status(500).json({ error: 'Interner Serverfehler' });
  }
}
