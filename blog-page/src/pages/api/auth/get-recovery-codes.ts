import prisma from '../../../../prisma';

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

    // Überprüfe ob der Benutzer existiert und 2FA aktiviert ist
    const user = await prisma.user.findUnique({
      where: { id: userIdInt },
      select: {
        id: true,
        twoFactorEnabled: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    if (!user.twoFactorEnabled) {
      return res.status(400).json({ 
        error: '2FA ist nicht aktiviert' 
      });
    }

    // Recovery-Codes aus der Datenbank auslesen
    const recoveryCodeEntries = await prisma.recoveryCode.findMany({
      where: {
        userId: userIdInt,
        used: false
      },
      select: {
        code: true
      }
    });

    if (!recoveryCodeEntries || recoveryCodeEntries.length === 0) {
      return res.status(404).json({ error: 'Keine Recovery-Codes vorhanden' });
    }

    // Rückgabe der Recovery-Codes
    return res.status(200).json({
      recoveryCodes: recoveryCodeEntries.map(entry => entry.code)
    });
  } catch (error) {
    console.error('Fehler beim Abrufen der Recovery-Codes:', error);
    return res.status(500).json({ 
      error: 'Fehler beim Abrufen der Recovery-Codes', 
      message: error.message 
    });
  }
}
