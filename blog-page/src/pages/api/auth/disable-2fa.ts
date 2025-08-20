import { PrismaClient } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';

const prisma = new PrismaClient();

interface ResponseData {
  success?: boolean;
  error?: string;
}

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Sicherheitsüberprüfung: Session prüfen
  const session = await getSession({ req });
  if (!session) {
    return res.status(401).json({ error: 'Nicht authentifiziert' });
  }

  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'Benutzer-ID erforderlich' });
  }

  try {
    // Überprüfen, ob der Benutzer berechtigt ist (eigenes Konto oder Admin)
    const requesterId = (session.user as any).id;
    if (String(requesterId) !== String(userId) && (session.user as any).role !== 'ADMIN') {
      return res.status(403).json({ error: 'Keine Berechtigung' });
    }

    // 2FA deaktivieren
    await prisma.user.update({
      where: { id: Number(userId) },
      data: { 
        twoFactorEnabled: false,
        twoFactorSecret: null,
        recoveryCodes: [] 
      },
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Fehler beim Deaktivieren von 2FA:', error);
    return res.status(500).json({ error: 'Serverfehler' });
  }
}
