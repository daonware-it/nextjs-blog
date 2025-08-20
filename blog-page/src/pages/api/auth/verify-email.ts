import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: 'E-Mail und Code erforderlich.' });
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(404).json({ error: 'Nutzer nicht gefunden.' });
  }
  if (user.emailVerified) {
    return res.status(400).json({ error: 'E-Mail bereits verifiziert.' });
  }
  if (!user.emailVerificationCode || !user.emailVerificationCodeExpires) {
    return res.status(400).json({ error: 'Kein Verifizierungscode vorhanden.' });
  }
  if (new Date() > user.emailVerificationCodeExpires) {
    return res.status(400).json({ error: 'Verifizierungscode abgelaufen.' });
  }
  if (user.emailVerificationCode !== code) {
    return res.status(400).json({ error: 'Verifizierungscode ungültig.' });
  }
  await prisma.user.update({
    where: { email },
    data: {
      emailVerified: true,
      emailVerificationCode: null,
      emailVerificationCodeExpires: null,
    }
  });
  return res.status(200).json({ message: 'E-Mail erfolgreich verifiziert.' });
}

