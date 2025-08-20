import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) {
    return res.status(400).json({ error: 'E-Mail, Code und neues Passwort erforderlich.' });
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordResetCode || !user.passwordResetCodeExpires) {
    return res.status(400).json({ error: 'Ungültiger Reset-Code.' });
  }
  if (new Date() > user.passwordResetCodeExpires) {
    return res.status(400).json({ error: 'Reset-Code abgelaufen.' });
  }
  if (user.passwordResetCode !== code) {
    return res.status(400).json({ error: 'Reset-Code ungültig.' });
  }
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { email },
    data: {
      password: hashedPassword,
      passwordResetCode: null,
      passwordResetCodeExpires: null,
    }
  });
  return res.status(200).json({ message: 'Passwort erfolgreich zurückgesetzt. Du kannst dich jetzt mit dem neuen Passwort anmelden.' });
}

