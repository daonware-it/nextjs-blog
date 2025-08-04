import { PrismaClient } from '@prisma/client';
import speakeasy from 'speakeasy';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { userId, code } = req.body;
  if (!userId || !code) {
    return res.status(400).json({ error: 'Benutzer-ID und Code erforderlich' });
  }
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.twoFactorSecret) {
    return res.status(404).json({ error: 'Benutzer oder 2FA nicht gefunden' });
  }
  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token: code,
    window: 1,
  });
  if (!verified) {
    return res.status(401).json({ error: 'Ungültiger Code' });
  }
  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorEnabled: true },
  });
  return res.status(200).json({ success: true });
}
