import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import authOptions from '../../auth/[...nextauth]';
import { prisma } from 'src-lib/prisma';
import { Session } from "next-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Session prüfen
  const session = await getServerSession(req, res, authOptions) as Session | null;
  if (!session || session.user.role !== 'ADMIN') {
    return res.status(401).json({ error: 'Nicht autorisiert. Nur Administratoren können Benutzerrollen ändern.' });
  }

  if (req.method === 'PATCH') {
    try {
      const { userId, role } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: 'Benutzer-ID ist erforderlich' });
      }
      
      if (!role) {
        return res.status(400).json({ error: 'Rolle ist erforderlich' });
      }
      
      // Prüfen, ob die angegebene Rolle gültig ist
      const validRoles = ['ADMIN', 'MODERATOR', 'BLOGGER', 'LESER'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ 
          error: 'Ungültige Rolle. Erlaubte Werte sind: ADMIN, MODERATOR, BLOGGER, LESER' 
        });
      }
      
      // Prüfen, ob der Benutzer existiert
      const existingUser = await prisma.user.findUnique({
        where: { id: userId }
      });
      
      if (!existingUser) {
        return res.status(404).json({ error: 'Benutzer nicht gefunden' });
      }
      
      // Benutzerrolle aktualisieren
      await prisma.user.update({
        where: { id: userId },
        data: { role }
      });
      
      return res.status(200).json({ 
        success: true, 
        message: 'Benutzerrolle erfolgreich aktualisiert',
        role
      });
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Benutzerrolle:', error);
      return res.status(500).json({ error: 'Interner Serverfehler' });
    }
  } else {
    return res.status(405).json({ error: 'Methode nicht erlaubt' });
  }
}
