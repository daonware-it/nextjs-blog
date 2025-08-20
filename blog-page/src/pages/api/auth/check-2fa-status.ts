import { PrismaClient } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';

const prisma = new PrismaClient();

interface ResponseData {
  enabled: boolean;
  error?: string;
}

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ enabled: false, error: 'Method not allowed' });
  }

  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ enabled: false, error: 'Benutzer-ID erforderlich' });
  }

  try {
    const user = await prisma.user.findUnique({ 
      where: { id: Number(userId) },
      select: { twoFactorEnabled: true }
    });

    if (!user) {
      return res.status(404).json({ enabled: false, error: 'Benutzer nicht gefunden' });
    }

    return res.status(200).json({ enabled: user.twoFactorEnabled });
  } catch (error) {
    console.error('Fehler beim Überprüfen des 2FA-Status:', error);
    return res.status(500).json({ enabled: false, error: 'Serverfehler' });
  }
}
