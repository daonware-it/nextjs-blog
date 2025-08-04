import { PrismaClient } from '@prisma/client';
import speakeasy from 'speakeasy';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'Benutzer-ID erforderlich' });
  }
  // Secret generieren
  const secret = speakeasy.generateSecret({ length: 20, name: 'DaonWare', issuer: 'DaonWare' });
  // Im User speichern
  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorSecret: secret.base32 },
  });
  // otpauth-URL für QR-Code
  return res.status(200).json({ secret: secret.base32, otpauthUrl: secret.otpauth_url });
}
