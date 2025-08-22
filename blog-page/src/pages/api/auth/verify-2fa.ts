import speakeasy from 'speakeasy';
import { decrypt } from '../../../lib/encryptionUtils';
import prisma from '../../../../prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, code } = req.body;

    if (!userId || !code) {
      return res.status(400).json({ error: 'Benutzer-ID und Code erforderlich' });
    }

    // Konvertiere userId zu Integer
    const userIdInt = parseInt(userId, 10);
    if (isNaN(userIdInt)) {
      return res.status(400).json({ error: 'Ungültige Benutzer-ID' });
    }

    const user = await prisma.user.findUnique({ where: { id: userIdInt } });
    if (!user) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    if (!user.twoFactorSecret) {
      return res.status(400).json({ error: '2FA wurde für diesen Benutzer noch nicht eingerichtet' });
    }

    // Secret entschlüsseln
    const decryptedSecret = decrypt(user.twoFactorSecret);

    // Entferne alle Leerzeichen aus dem Code (falls vorhanden)
    const cleanedCode = code.replace(/\s+/g, '');

    // Speakeasy verwendet mit window=1 erlaubt einen Code vor und nach dem aktuellen
    const verified = speakeasy.totp.verify({
      secret: decryptedSecret,
      encoding: 'base32',
      token: cleanedCode,
      window: 2, // Erlaubt größere Zeitabweichung (2 Intervalle vor und nach)
    });

    if (!verified) {
      // Versuche noch einmal mit anderen Optionen
      const verifiedAlt = speakeasy.totp.verify({
        secret: decryptedSecret,
        encoding: 'base32',
        token: cleanedCode,
        algorithm: 'sha1', // Explizit SHA1 verwenden (Standard bei den meisten Authenticator-Apps)
        window: 2,
      });

      if (!verifiedAlt) {
        return res.status(401).json({ 
          error: 'Ungültiger Code', 
          message: 'Der eingegebene Code ist ungültig. Bitte versuchen Sie es erneut.' 
        });
      }
    }

    // Erfolgreiche Verifizierung - 2FA aktivieren
    await prisma.user.update({
      where: { id: userIdInt },
      data: { twoFactorEnabled: true },
    });

    return res.status(200).json({
      success: true,
      message: '2FA wurde erfolgreich aktiviert'
    });
  } catch (error) {
    console.error('Fehler bei der 2FA-Verifizierung:', error);
    return res.status(500).json({ 
      error: 'Fehler bei der 2FA-Verifizierung', 
      message: error.message 
    });
  }
}
