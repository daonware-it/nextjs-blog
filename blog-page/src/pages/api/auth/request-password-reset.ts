import { PrismaClient } from '@prisma/client';
import { sendMail } from '@/lib/mail';
import { passwordResetTemplate } from '@/lib/mailTemplates';
import crypto from 'crypto';
import { replacePlaceholders } from '@/lib/replacePlaceholders';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'E-Mail erforderlich.' });
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Keine Info, ob E-Mail existiert
    return res.status(200).json({ message: 'Wenn die E-Mail existiert, wurde ein Reset-Code versendet.' });
  }
  const resetCode = crypto.randomInt(100000, 999999).toString();
  const codeExpires = new Date(Date.now() + 1000 * 60 * 30); // 30 Minuten gültig
  await prisma.user.update({
    where: { email },
    data: {
      passwordResetCode: resetCode,
      passwordResetCodeExpires: codeExpires,
    }
  });
  // Vorlage aus der Datenbank laden
  const dbTemplate = await prisma.emailTemplate.findUnique({ where: { type: 'passwordReset' } });
  const replacements = {
    resetCode,
    email,
    username: user.username || ''
  };
  let subject : string;
  let html : string;
  let text : string;
  if (dbTemplate) {
    subject = replacePlaceholders(dbTemplate.subject || 'Passwort zurücksetzen', replacements);
    html = replacePlaceholders(dbTemplate.html || '', replacements);
    text = replacePlaceholders(dbTemplate.text || '', replacements);
  } else {
    const mail = passwordResetTemplate({ resetCode });
    subject = mail.subject;
    html = mail.html;
    text = mail.text;
  }
  await sendMail({
    to: email,
    subject,
    text,
    html,
  });
  return res.status(200).json({ message: 'Wenn die E-Mail existiert, wurde ein Reset-Code versendet.' });
}
