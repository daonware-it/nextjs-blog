import { PrismaClient } from '@prisma/client';
import speakeasy from 'speakeasy';
import type { NextApiRequest, NextApiResponse } from 'next';

const prisma = new PrismaClient();

interface GenerateRequestBody {
  userId: string | number;
}

interface GenerateResponseData {
  secret?: string;
  otpauthUrl?: string;
  success?: boolean;
  error?: string;
}

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse<GenerateResponseData>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.body as GenerateRequestBody;

  if (!userId) {
    return res.status(400).json({ error: 'Benutzer-ID erforderlich' });
  }

  try {
    // Benutzer prüfen
    const user = await prisma.user.findUnique({ 
      where: { id: Number(userId) } 
    });

    if (!user) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    // Secret generieren
    const secret = speakeasy.generateSecret({ 
      length: 20, 
      name: user.email || 'DaonWare User', 
      issuer: 'DaonWare' 
    });

    // Im User speichern (noch nicht aktiviert)
    await prisma.user.update({
      where: { id: Number(userId) },
      data: { 
        twoFactorSecret: secret.base32,
        twoFactorEnabled: false // Explizit deaktiviert, bis verifiziert
      },
    });

    // otpauth-URL für QR-Code
    return res.status(200).json({ 
      secret: secret.base32, 
      otpauthUrl: secret.otpauth_url 
    });
  } catch (error) {
    console.error('2FA Setup Error:', error);
    return res.status(500).json({ error: 'Fehler bei der 2FA-Einrichtung' });
  }
}
