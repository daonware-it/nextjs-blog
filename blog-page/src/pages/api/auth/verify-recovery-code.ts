import { PrismaClient } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { userId, code } = req.body;
  if (!userId || !code) {
    return res.status(400).json({ error: 'Benutzer-ID und Code erforderlich' });
  }
  const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
  if (!user) {
    return res.status(404).json({ error: 'Benutzer nicht gefunden' });
  }
  if (!Array.isArray(user.recoveryCodes) || !user.recoveryCodes.includes(code)) {
    return res.status(401).json({ error: 'Ungültiger Recovery-Code' });
  }
  // Recovery-Code entfernen (einmal verwendbar)
  const updatedCodes = user.recoveryCodes.filter((c: string) => c !== code);
  await prisma.user.update({
    where: { id: Number(userId) },
    data: { recoveryCodes: updatedCodes },
  });
  return res.status(200).json({ success: true });
}
