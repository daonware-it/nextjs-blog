import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import prisma from '../../../../prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Authentifizierung überprüfen
    const session = await getSession({ req });
    if (!session) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    const userEmail = (session.user as any).email;

    // Aktuellen Benutzer aus Datenbank abfragen
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: {
        id: true,
        twoFactorEnabled: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    // In einer echten Implementierung würde hier die Session aktualisiert
    // Da NextAuth Sessions serverbasiert sind und nicht direkt manipuliert werden können,
    // empfehlen wir eine neue Anmeldung nach Änderungen am 2FA-Status

    return res.status(200).json({ 
      success: true,
      message: 'Session-Update angefordert. Bitte melden Sie sich erneut an, um alle Änderungen zu übernehmen.',
      twoFactorEnabled: user.twoFactorEnabled
    });
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Session:', error);
    return res.status(500).json({ 
      error: 'Interner Serverfehler beim Aktualisieren der Session',
      message: error.message
    });
  }
}
