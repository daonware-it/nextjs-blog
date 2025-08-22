import speakeasy from 'speakeasy';
import { encrypt } from '../../../lib/encryptionUtils';
import { generateRecoveryCodes, storeRecoveryCodes } from '../../../lib/recoveryCodeUtils';
import prisma from '../../../../prisma';
import QRCode from 'qrcode';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Benutzer-ID erforderlich' });
    }

    // Konvertiere userId zu Integer
    const userIdInt = parseInt(userId, 10);
    if (isNaN(userIdInt)) {
      return res.status(400).json({ error: 'Ungültige Benutzer-ID' });
    }

    // Überprüfe ob der Benutzer existiert
    const user = await prisma.user.findUnique({
      where: { id: userIdInt }
    });

    if (!user) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    // Secret generieren
    const issuerName = process.env['2FA_ISSUER_NAME'] || 'DaonWare';
    const secretName = `${issuerName}:${user.email || user.username || userId}`;

    const secret = speakeasy.generateSecret({
      length: 20, 
      name: secretName,
      issuer: issuerName 
    });

    // Recovery-Codes generieren
    const recoveryCodes = generateRecoveryCodes(10); // 10 Codes generieren
    const encryptedRecoveryCodes = storeRecoveryCodes(recoveryCodes);

    // Secret verschlüsseln
    const encryptedSecret = encrypt(secret.base32);

    // Im User speichern
    await prisma.user.update({
      where: { id: userIdInt },
      data: { 
        twoFactorSecret: encryptedSecret,
        twoFactorRecoveryCodes: encryptedRecoveryCodes,
        // twoFactorEnabled wird erst nach erfolgreicher Verifizierung auf true gesetzt
      },
    });

    // QR-Code generieren
    const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url);

    // otpauth-URL für QR-Code
    return res.status(200).json({ 
      success: true,
      secret: secret.base32, 
      qrCode: qrCodeDataUrl, // vollständige DataURL
      recoveryCodes: recoveryCodes
    });
  } catch (error) {
    console.error('Fehler beim Generieren des 2FA-Secrets:', error);
    return res.status(500).json({ 
      error: 'Fehler beim Generieren des 2FA-Secrets', 
      message: error.message 
    });
  }
}
