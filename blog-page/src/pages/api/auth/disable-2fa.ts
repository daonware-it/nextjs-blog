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

    // Überprüfe ob der Benutzer existiert
    const user = await prisma.user.findUnique({
      where: { id: userIdInt }
    });

    if (!user) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    await prisma.user.update({
      where: { id: userIdInt },
      data: { 
        twoFactorEnabled: false, 
        twoFactorSecret: null,
        twoFactorRecoveryCodes: null
      },
    });

    return res.status(200).json({ 
      success: true,
      message: 'Zwei-Faktor-Authentifizierung wurde deaktiviert'
    });
  } catch (error) {
    console.error('Fehler beim Deaktivieren der 2FA:', error);
    return res.status(500).json({ 
      error: 'Fehler beim Deaktivieren der 2FA', 
      message: error.message 
    });
  }
}

