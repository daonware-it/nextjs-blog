import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Token und Passwort erforderlich.' });
  if (password.length < 12) return res.status(400).json({ error: 'Das Passwort muss mindestens 12 Zeichen lang sein.' });

  const user = await prisma.user.findFirst({
    where: {
      resetPasswordToken: token,
      resetPasswordTokenExpiry: { gte: new Date() },
    },
  });
  if (!user) return res.status(400).json({ error: 'Ungültiger oder abgelaufener Token.' });

  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashed,
      resetPasswordToken: null,
      resetPasswordTokenExpiry: null,
    },
  });

  res.status(200).json({ message: 'Passwort erfolgreich geändert.' });
}

