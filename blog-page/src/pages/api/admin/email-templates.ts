import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from 'lib/prisma';
import { passwordResetTemplate, emailVerificationTemplate } from '@/lib/mailTemplates';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { type } = req.query;

  if (req.method === 'GET') {
    if (!type || typeof type !== 'string') {
      return res.status(400).json({ error: 'Template-Typ erforderlich.' });
    }
    const template = await prisma.emailTemplate.findUnique({ where: { type } });
    // Fallback nur, wenn keine Vorlage existiert
    if (!template) {
      if (type === 'passwordReset') {
        const mail = passwordResetTemplate({ resetCode: '{resetCode}' });
        return res.status(200).json({
          subject: mail.subject,
          text: '',
          html: mail.html
        });
      }
      if (type === 'emailVerification') {
        const mail = emailVerificationTemplate({ verificationCode: '{verificationCode}' });
        return res.status(200).json({
          subject: mail.subject,
          text: '',
          html: mail.html
        });
      }
      return res.status(404).json({ error: 'Vorlage nicht gefunden.' });
    }
    // Nur die Datenbank-Vorlage zurückgeben
    return res.status(200).json({
      subject: template.subject || '',
      text: template.text || '',
      html: template.html || ''
    });
  }

  if (req.method === 'POST' || req.method === 'PUT') {
    const { type, subject, text, html } = req.body;
    if (!type || !html) {
      return res.status(400).json({ error: 'Typ und HTML erforderlich.' });
    }
    const template = await prisma.emailTemplate.upsert({
      where: { type },
      update: { subject, text, html },
      create: { type, subject, text, html },
    });
    return res.status(200).json({ success: true, template });
  }

  return res.status(405).json({ error: 'Methode nicht erlaubt.' });
}
