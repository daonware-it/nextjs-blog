import { generateRecoveryCodes } from '../../../lib/recoveryCodeUtils';
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
        error: '2FA muss aktiviert sein, um Recovery-Codes zu generieren' 
      });
    }

    // Neue Recovery-Codes generieren
    const recoveryCodes = generateRecoveryCodes(10);

    // Alte Recovery-Codes für den User löschen
    await prisma.recoveryCode.deleteMany({
      where: { userId: userIdInt }
    });

    // Neue Recovery-Codes in die Datenbank schreiben
    const createdCodes = await Promise.all(
      recoveryCodes.map(code =>
        prisma.recoveryCode.create({
          data: {
            code,
            userId: userIdInt,
            used: false
          }
        })
      )
    );

    // Rückgabe der generierten Codes
    return res.status(200).json({
      recoveryCodes: createdCodes.map(c => c.code)
    });
  } catch (error) {
    console.error('Fehler beim Generieren der Recovery-Codes:', error);
    return res.status(500).json({ 
      error: 'Fehler beim Generieren der Recovery-Codes', 
      message: error.message 
    });
  }
}
