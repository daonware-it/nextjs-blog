import { PrismaClient } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';

const prisma = new PrismaClient();

function generateRecoveryCodes(count = 8) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    codes.push(Math.random().toString(36).slice(-8).toUpperCase());
  }
  return codes;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'Benutzer-ID erforderlich' });
  }
  const codes = generateRecoveryCodes();
  await prisma.user.update({
    where: { id: Number(userId) },
    data: { recoveryCodes: codes },
  });
  return res.status(200).json({ recoveryCodes: codes });
}
