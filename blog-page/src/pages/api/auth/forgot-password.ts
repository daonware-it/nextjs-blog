import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import { randomBytes } from 'crypto';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'E-Mail erforderlich.' });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(404).json({ error: 'Kein Nutzer mit dieser E-Mail gefunden.' });

  const token = randomBytes(32).toString('hex');
  const expiry = new Date(Date.now() + 1000 * 60 * 30); // 30 Minuten gültig

  await prisma.user.update({
    where: { email },
    data: {
      resetPasswordToken: token,
      resetPasswordTokenExpiry: expiry,
    },
  });

  // Domain dynamisch aus dem Request bestimmen
  const host = req.headers.host;
  const proto = req.headers["x-forwarded-proto"] || (host && host.startsWith("localhost") ? "http" : "https");
  const resetLink = `${proto}://${host}/reset-password?token=${token}`;

  // E-Mail-Versand
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // HTML-Template laden und Platzhalter ersetzen
  let html = '';
  try {
    // Erst benutzerdefiniertes Template aus DB versuchen
    const dbTemplate = await prisma.emailTemplate.findUnique({ where: { type: 'password-reset' } });
    if (dbTemplate && dbTemplate.content) {
      html = dbTemplate.content;
    } else {
      const templatePath = path.join(process.cwd(), 'src', 'lib', 'emailTemplates', 'password-reset.html');
      html = fs.readFileSync(templatePath, { encoding: 'utf8' });
    }
    html = html
      .replace(/{{displayName}}/g, user.name || user.username || user.email)
      .replace(/{{resetLink}}/g, resetLink);
  } catch (e) {
    // Fallback falls Template nicht geladen werden kann
    html = `<html><head><meta charset='UTF-8'></head><body>
      <h2>Passwort zurücksetzen</h2>
      <p>Klicken Sie auf den folgenden Link, um Ihr Passwort zurückzusetzen:</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      </body></html>`;
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: 'Passwort zurücksetzen',
    text: `Passwort zurücksetzen: ${resetLink}`,
    html,
    headers: {
      'Content-Type': 'text/html; charset=UTF-8'
    }
  });

  res.status(200).json({ message: 'E-Mail zum Zurücksetzen wurde verschickt.' });
}
