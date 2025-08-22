import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../prisma';
import { decrypt } from '../../../lib/encryptionUtils';
import speakeasy from 'speakeasy';
import jwt from 'jsonwebtoken';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email, code, token } = req.body;

  if (!email || !code || !token) {
    return res.status(400).json({ error: 'E-Mail, Code und Token sind erforderlich' });
  }

  try {
    // Token validieren
    const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-do-not-use-in-production';
    let tokenData;

    try {
      tokenData = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ error: 'Ungültiges oder abgelaufenes Token' });
    }

    if (tokenData.email !== email) {
      return res.status(401).json({ error: 'Token stimmt nicht mit der E-Mail überein' });
    }

    // Benutzer aus Datenbank abrufen
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || !user.twoFactorSecret || !user.twoFactorEnabled) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden oder 2FA nicht aktiviert' });
    }

    // Geheimnis entschlüsseln
    const decryptedSecret = decrypt(user.twoFactorSecret);

    // Verifizieren des Codes
    const verified = speakeasy.totp.verify({
      secret: decryptedSecret,
      encoding: 'base32',
      token: code,
      window: 1 // Erlaubt einen Code vor und nach dem aktuellen
    });

    if (verified) {
      return res.status(200).json({ 
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.username || user.email,
          role: user.role
        }
      });
    } else {
      return res.status(400).json({ error: 'Ungültiger Code', success: false });
    }
  } catch (error) {
    console.error('Fehler bei der 2FA-Validierung:', error);
    return res.status(500).json({ 
      error: 'Interner Serverfehler bei der 2FA-Validierung',
      message: error.message
    });
  }
}
