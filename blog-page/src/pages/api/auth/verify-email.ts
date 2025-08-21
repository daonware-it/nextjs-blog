import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import { randomInt } from 'crypto';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'E-Mail erforderlich.' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'Kein Nutzer mit dieser E-Mail gefunden.' });

    const code = String(randomInt(100000, 999999));
    // Setze Ablaufzeit auf 30 Minuten
    const codeExpiry = new Date(Date.now() + 1000 * 60 * 30);

    await prisma.user.update({
      where: { email },
      data: { 
        verificationCode: code, 
        isVerified: false,
        verificationCodeExpiry: codeExpiry
      },
    });

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
      const dbTemplate = await prisma.emailTemplate.findUnique({ where: { type: 'verification' } });
      if (dbTemplate && dbTemplate.content) {
        html = dbTemplate.content;
      } else {
        const templatePath = path.join(process.cwd(), 'src', 'lib', 'emailTemplates', 'verification.html');
        html = fs.readFileSync(templatePath, { encoding: 'utf8' });
      }
      html = html
        .replace(/{{displayName}}/g, user.name || user.username || user.email)
        .replace(/{{code}}/g, code);
    } catch (e) {
      // Fallback falls Template nicht geladen werden kann
      html = `<html><head><meta charset='UTF-8'></head><body>
        <h2>Konto verifizieren</h2>
        <p>Hallo ${user.name || user.username || user.email},</p>
        <p>Ihr Verifizierungscode: <b>${code}</b></p>
        <p>Der Code ist 30 Minuten gültig.</p>
      </body></html>`;
    }

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Ihr Verifizierungscode',
      text: `Ihr Verifizierungscode lautet: ${code}`,
      html,
      headers: {
        'Content-Type': 'text/html; charset=UTF-8'
      }
    });

    return res.status(200).json({ message: 'Verifizierungscode wurde verschickt.' });
  }

  if (req.method === 'PUT') {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ error: 'E-Mail und Code erforderlich.' });

    const user = await prisma.user.findUnique({ where: { email } });

    // Prüfen, ob der Code ungültig ist oder abgelaufen ist
    if (!user || user.verificationCode !== code) {
      return res.status(400).json({ error: 'Ungültiger Code.' });
    }

    if (user.verificationCodeExpiry && new Date() > user.verificationCodeExpiry) {
      return res.status(400).json({ error: 'Der Code ist abgelaufen. Bitte fordere einen neuen an.' });
    }

    await prisma.user.update({
      where: { email },
      data: { 
        isVerified: true, 
        verificationCode: null,
        verificationCodeExpiry: null 
      },
    });

    return res.status(200).json({ message: 'E-Mail erfolgreich verifiziert.' });
  }

  return res.status(405).end();
}
