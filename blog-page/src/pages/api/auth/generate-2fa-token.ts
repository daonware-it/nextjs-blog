import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../prisma';
import jwt from 'jsonwebtoken';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'E-Mail ist erforderlich' });
  }

  try {
    // Benutzer aus Datenbank abrufen
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    // Prüfen, ob 2FA aktiviert ist
    if (!user.twoFactorEnabled) {
      return res.status(400).json({ error: '2FA ist für diesen Benutzer nicht aktiviert' });
    }

    // Token erstellen
    const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-do-not-use-in-production';
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        type: '2fa-login' 
      },
      JWT_SECRET,
      { expiresIn: '5m' } // Token ist 5 Minuten gültig
    );

    return res.status(200).json({ 
      success: true, 
      token
    });
  } catch (error) {
    console.error('Fehler beim Generieren des 2FA-Tokens:', error);
    return res.status(500).json({ 
      error: 'Interner Serverfehler beim Generieren des 2FA-Tokens',
      message: error.message
    });
  }
}
