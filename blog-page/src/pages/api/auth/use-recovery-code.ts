import prisma from '../../../../prisma';
import { createAuditLog } from '../../../lib/auditLogUtils';
import { sendRecoveryCodeNotification } from '../../../lib/emailUtils';

export default async function handler(req, res) {
  console.log('API-Handler /api/auth/use-recovery-code aufgerufen', req.method, req.body);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, recoveryCode } = req.body;

    if (!userId || !recoveryCode) {
      return res.status(400).json({ 
        error: 'Benutzer-ID und Recovery-Code erforderlich' 
      });
    }

    // Konvertiere userId zu Integer
    const userIdInt = parseInt(userId, 10);
    if (isNaN(userIdInt)) {
      return res.status(400).json({ error: 'Ungültige Benutzer-ID' });
    }

    // Benutzer mit seinen Recovery-Codes abrufen
    const user = await prisma.user.findUnique({
      where: { id: userIdInt },
      select: {
        id: true,
        email: true,
        username: true,
        twoFactorEnabled: true,
        twoFactorRecoveryCodes: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    if (!user.twoFactorEnabled) {
      return res.status(400).json({ 
        error: '2FA ist für diesen Benutzer nicht aktiviert' 
      });
    }

    if (!user.twoFactorRecoveryCodes) {
      return res.status(400).json({ 
        error: 'Keine Recovery-Codes für diesen Benutzer verfügbar' 
      });
    }

    // Rate-Limiting: Maximal 5 Versuche pro Stunde
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const attemptCount = await prisma.recoveryCodeAttempt.count({
      where: {
        userId: userIdInt,
        attemptedAt: { gte: oneHourAgo }
      }
    });
    if (attemptCount >= 5) {
      return res.status(429).json({
        error: 'Zu viele Versuche mit Recovery-Codes. Bitte wenden Sie sich an den Support.',
        support: true
      });
    }
    // Versuch speichern
    await prisma.recoveryCodeAttempt.create({
      data: {
        userId: userIdInt,
        ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || null
      }
    });

    // RecoveryCode aus der Datenbank suchen
    const recoveryCodeEntry = await prisma.recoveryCode.findFirst({
      where: {
        code: recoveryCode,
        userId: userIdInt,
        used: false
      }
    });

    if (!recoveryCodeEntry) {
      // Support-Fallback, wenn keine gültigen Codes mehr vorhanden sind
      const remainingCodes = await prisma.recoveryCode.count({
        where: {
          userId: userIdInt,
          used: false
        }
      });
      if (remainingCodes === 0) {
        return res.status(401).json({
          error: 'Keine gültigen Recovery-Codes mehr verfügbar. Bitte wenden Sie sich an den Support.',
          support: true
        });
      }
      return res.status(401).json({ error: 'Der eingegebene Recovery-Code ist ungültig oder wurde bereits verwendet.' });
    }

    // Recovery-Code als verwendet markieren
    await prisma.recoveryCode.update({
      where: { id: recoveryCodeEntry.id },
      data: { used: true }
    });
    // Audit-Log-Eintrag erstellen
    await createAuditLog({
      userId: userIdInt,
      action: 'RECOVERY_CODE_USED',
      details: `Recovery-Code verwendet: ${recoveryCodeEntry.code}`
    });
    // E-Mail-Benachrichtigung versenden
    try {
      await sendRecoveryCodeNotification({
        to: user.email,
        username: user.username || user.email,
        code: recoveryCodeEntry.code
      });
    } catch (mailError) {
      console.error('Fehler beim Versand der Recovery-Code-E-Mail:', mailError);
    }

    // Erfolg zurückgeben (z.B. für Login-Flow)
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Fehler bei der Verwendung des Recovery-Codes:', error);
    return res.status(500).json({ 
      error: 'Fehler bei der Verwendung des Recovery-Codes', 
      message: error.message 
    });
  }
}
