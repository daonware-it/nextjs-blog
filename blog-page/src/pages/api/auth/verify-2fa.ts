import { PrismaClient } from '@prisma/client';
import speakeasy from 'speakeasy';
import type { NextApiRequest, NextApiResponse } from 'next';

const prisma = new PrismaClient();

interface VerifyRequestBody {
  userId: string | number;
  code: string;
  secret?: string; // Optionales Secret für die initiale Verifizierung
}

interface VerifyResponseData {
  success?: boolean;
  error?: string;
}

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse<VerifyResponseData>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, code, secret } = req.body as VerifyRequestBody;

  if (!userId || !code) {
    return res.status(400).json({ error: 'Benutzer-ID und Code erforderlich' });
  }

  const user = await prisma.user.findUnique({ where: { id: Number(userId) } });

  if (!user) {
    return res.status(404).json({ error: 'Benutzer nicht gefunden' });
  }

  // Wenn ein Secret mitgesendet wird, dieses für die Verifizierung verwenden
  // (Dies ist für die initiale 2FA-Aktivierung)
  const secretToVerify = secret || user.twoFactorSecret;

  if (!secretToVerify) {
    return res.status(400).json({ error: '2FA-Secret nicht gefunden' });
  }

  const verified = speakeasy.totp.verify({
    secret: secretToVerify,
    encoding: 'base32',
    token: code,
    window: 1, // Toleranz von einer Zeiteinheit (±30 Sekunden)
  });

  if (!verified) {
    return res.status(401).json({ error: 'Ungültiger Code' });
  }

  // 2FA aktivieren
  await prisma.user.update({
    where: { id: Number(userId) },
    data: { twoFactorEnabled: true },
  });

  return res.status(200).json({ success: true });
}
