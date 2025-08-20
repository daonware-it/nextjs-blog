import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { ensurePostMethod } from '@/lib/apiUtils';
import type { NextApiRequest, NextApiResponse } from 'next';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (ensurePostMethod(req, res)) return;
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email und Passwort erforderlich' });
  }
  const user = await prisma.user.findUnique({ where: { email } });
  let isValid = false;
  if (user) {
    isValid = await bcrypt.compare(password, user.password);
  }
  if (!user || !isValid) {
    return res.status(401).json({ error: 'Login fehlgeschlagen' });
  }
  // Hier könnte ein JWT oder Session erstellt werden
  return res.status(200).json({ message: 'Login erfolgreich', user: { id: user.id, email: user.email, name: user.name, role: user.role } });
}
