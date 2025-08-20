import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import authOptions from '../auth/[...nextauth]';

interface Session {
  user: {
    id: number;
    email: string;
    role: string;
  };
  expires: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
        session: {
          user: {
            email: session.user.email,
            role: session.user.role,
          },
          expires: session.expires
        }
      });
    }
    
    return res.status(200).json({ 
      message: 'Autorisiert',
      authorized: true,
      session: {
        user: {
          email: session.user.email,
          role: session.user.role,
          id: session.user.id
        },
        expires: session.expires
      }
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
