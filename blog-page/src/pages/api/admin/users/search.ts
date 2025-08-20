import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import authOptions from '../../auth/[...nextauth]';
import { prisma } from 'src-lib/prisma';
import { Session } from "next-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Session prüfen
  const session = await getServerSession(req, res, authOptions) as Session | null;
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
    return res.status(401).json({ error: 'Nicht autorisiert' });
  }

  if (req.method === 'GET') {
    try {
      // Suchanfrage aus den Query-Parametern extrahieren

      let query = req.query.query;
      if (typeof query !== 'string') {
        return res.status(400).json({ error: 'Suchbegriff ist erforderlich' });
      }
      query = query.trim();
      if (!query) {
        return res.status(400).json({ error: 'Suchbegriff ist erforderlich' });
      }
      
      // Parameter für Paginierung
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      
      // In Benutzername oder E-Mail suchen
      const users = await prisma.user.findMany({
        where: {
          OR: [
            {
              username: {
                contains: query,
                mode: 'insensitive'  // Groß- und Kleinschreibung ignorieren
              }
            },
            {
              email: {
                contains: query,
                mode: 'insensitive'  // Groß- und Kleinschreibung ignorieren
              }
            }
          ]
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          createdAt: true
        }
      });
      
      // Gesamtzahl der passenden Benutzer
      const total = await prisma.user.count({
        where: {
          OR: [
            {
              username: {
                contains: query,
                mode: 'insensitive'
              }
            },
            {
              email: {
                contains: query,
                mode: 'insensitive'
              }
            }
          ]
        }
      });
      
      return res.status(200).json({
        users,
        total,
        page,
        pageSize
      });
    } catch (error) {
      console.error('Fehler bei der Benutzersuche:', error);
      return res.status(500).json({ error: 'Interner Serverfehler' });
    }
  } else {
    return res.status(405).json({ error: 'Methode nicht erlaubt' });
  }
}
