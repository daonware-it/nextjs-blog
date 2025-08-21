import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_TEMPLATES: Record<string, string> = {
  'verification': `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>Konto verifizieren – DaonWare</title>
</head>
<body>
  <div style="max-width: 480px; margin: 0 auto; background: #fff; border: 1px solid #eaeaea; padding: 32px 24px; font-family: Arial, sans-serif;">
    <div style="text-align: center; margin-bottom: 24px;">
      <img src="https://www.daonware.de/logo.png" alt="DaonWare Logo" style="height: 48px; margin-bottom: 8px;" />
      <h2 style="margin: 0; color: #007bff; font-size: 22px; font-weight: 700;">Konto verifizieren</h2>
    </div>
    <p style="font-size: 16px; color: #222; margin-bottom: 18px;">Hallo {{displayName}},<br>du hast dich bei DaonWare registriert.</p>
    <p style="font-size: 16px; color: #222; margin-bottom: 18px;">Gib bitte folgenden Code auf der Verifizierungsseite ein:</p>
    <div style="text-align: center; margin: 32px 0;">
      <span style="display: inline-block; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #007bff; background: #f2f8ff; padding: 16px 32px; border: 1px solid #cce3ff;">{{code}}</span>
    </div>
    <p style="font-size: 15px; color: #555; margin-bottom: 18px;">Der Code ist <b style="font-weight: 700; color: #222;">30 Minuten gültig</b>. Sollte er ablaufen, kannst du einen neuen anfordern.</p>
    <hr style="border: none; border-top: 1px solid #eeeeee; margin: 32px 0;" />
    <div style="font-size: 13px; color: #888; text-align: center;">
      Bei Fragen oder Problemen schreibe uns an <a href="mailto:support@daonware.de" style="color: #007bff; text-decoration: underline;" target="_blank">support@daonware.de</a>.<br>
      <a href="https://www.daonware.de" style="color: #007bff; text-decoration: underline;" target="_blank">www.daonware.de</a>
    </div>
  </div>
</body>
</html>`,
  'password-reset': `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>Passwort zurücksetzen – DaonWare</title>
</head>
<body>
  <div style="max-width: 480px; margin: 0 auto; background: #fff; border: 1px solid #eaeaea; padding: 32px 24px; font-family: Arial, sans-serif;">
    <div style="text-align: center; margin-bottom: 24px;">
      <img src="https://www.daonware.de/logo.png" alt="DaonWare Logo" style="height: 48px; margin-bottom: 8px;" />
      <h2 style="margin: 0; color: #007bff; font-size: 22px; font-weight: 700;">Passwort zurücksetzen</h2>
    </div>
    <p style="font-size: 16px; color: #222; margin-bottom: 18px;">Hallo {{displayName}},<br>du hast eine Anfrage zum Zurücksetzen deines Passworts gestellt.</p>
    <p style="font-size: 16px; color: #222; margin-bottom: 18px;">Klicke auf den folgenden Link, um dein Passwort zurückzusetzen:</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="{{resetLink}}" style="display: inline-block; font-size: 18px; font-weight: 700; color: #fff; background: #007bff; padding: 14px 32px; border-radius: 6px; text-decoration: none;">Passwort zurücksetzen</a>
    </div>
    <p style="font-size: 15px; color: #555; margin-bottom: 18px;">Der Link ist <b style="font-weight: 700; color: #222;">30 Minuten gültig</b>. Sollte er ablaufen, kannst du eine neue Anfrage stellen.</p>
    <hr style="border: none; border-top: 1px solid #eeeeee; margin: 32px 0;" />
    <div style="font-size: 13px; color: #888; text-align: center;">
      Bei Fragen oder Problemen schreibe uns an <a href="mailto:support@daonware.de" style="color: #007bff; text-decoration: underline;" target="_blank">support@daonware.de</a>.<br>
      <a href="https://www.daonware.de" style="color: #007bff; text-decoration: underline;" target="_blank">www.daonware.de</a>
    </div>
  </div>
</body>
</html>`
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { type } = req.query;

  if (!type || typeof type !== 'string') {
    return res.status(400).json({ error: 'Template-Typ erforderlich' });
  }

  if (req.method === 'GET') {
    // Template abrufen
    const template = await prisma.emailTemplate.findUnique({ where: { type } });
    const content = template?.content ?? DEFAULT_TEMPLATES[type] ?? '';
    return res.status(200).json({ content });
  }

  if (req.method === 'POST') {
    const { content } = req.body;
    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'Template-Inhalt erforderlich' });
    }
    // Template speichern/aktualisieren
    const updated = await prisma.emailTemplate.upsert({
      where: { type },
      update: { content },
      create: { type, content },
    });
    return res.status(200).json({ success: true, content: updated.content });
  }

  return res.status(405).json({ error: 'Methode nicht erlaubt' });
}
