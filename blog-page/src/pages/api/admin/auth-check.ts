import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import authOptions from '../auth/[...nextauth]';
import { Session } from 'next-auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Hilfsfunktion zur Erstellung des Session-Objekts für die Antwort
  function getSessionResponse(session: Session | null, includeId: boolean = false) {
    if (!session || !session.user) return null;
    const user: any = {
      email: session.user.email,
      role: session.user.role,
    };
    if (includeId && session.user.id) {
      user.id = session.user.id;
    }
    return {
      user,
      expires: session.expires
    };
  }

  try {
    const session = await getServerSession(req, res, authOptions) as Session | null;

    if (!session) {
      return res.status(401).json({ 
        error: 'Nicht autorisiert - Keine Sitzung gefunden',
        authorized: false,
        session: null
      });
    }
    
    if (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR') {
      return res.status(403).json({ 
        error: 'Nicht autorisiert - Keine Admin- oder Moderator-Rechte',
        authorized: false,
        session: getSessionResponse(session)
      });
    }
    
    return res.status(200).json({ 
      message: 'Autorisiert',
      authorized: true,
      session: getSessionResponse(session, true)
    });
  } catch (error) {
    console.error('Fehler bei der Authentifizierungsprüfung:', error);
    return res.status(500).json({ 
      error: 'Interner Serverfehler bei der Authentifizierungsprüfung',
      authorized: false,
      session: null
    });
  }
}
