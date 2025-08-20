import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from 'src-lib/prisma';
import { getServerSession } from 'next-auth/next';
import authOptions from '../auth/[...nextauth]';
import { Session } from 'next-auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Admin-Rechte prüfen
  const session = await getServerSession(req, res, authOptions) as Session | null;

  if (!session || session.user?.role !== 'ADMIN') {
    return res.status(401).json({ error: 'Nicht autorisiert' });
  }

  if (req.method === 'GET') {
    try {
      const page = parseInt(req.query.page as string || '1', 10);
      const pageSize = parseInt(req.query.pageSize as string || '50', 10);
      const skip = (page - 1) * pageSize;
      
      // Filtern nach Benutzer-ID, falls angegeben
      const userId = req.query.userId ? parseInt(req.query.userId as string, 10) : undefined;
      
      // Filtern nach Aktionstyp, falls angegeben
      const action = req.query.action as string | undefined;
      
      // Filtern nach Datum, falls angegeben
      let createdAt: any = undefined;
      if (req.query.fromDate) {
        const fromDate = new Date(req.query.fromDate as string);
        createdAt = { gte: fromDate };
      }
      if (req.query.toDate) {
        const toDate = new Date(req.query.toDate as string);
        toDate.setHours(23, 59, 59, 999); // Ende des Tages
        createdAt = { lte: toDate };
      }

      // Where-Bedingung zusammenbauen
      const where: any = {
        ...(userId ? { userId } : {}),
        ...(action ? { action } : {}),
        ...(createdAt ? { createdAt } : {})
      };

      // Gesamtanzahl der Audit-Logs ermitteln
      const totalCount = await prisma.auditLog.count({
        where
      });

      // Audit-Logs abrufen
      const auditLogs = await prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true
            }
          },
          admin: {
            select: {
              id: true,
              username: true,
              email: true
            }
          }
        }
      });

      return res.status(200).json({
        auditLogs,
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages: Math.ceil(totalCount / pageSize)
        }
      });
    } catch (error) {
      console.error('Fehler beim Abrufen der Audit-Logs:', error);
      return res.status(500).json({
        error: 'Interner Serverfehler',
        message: error instanceof Error ? error.message : 'Unbekannter Fehler'
      });
    }
  }

  return res.status(405).json({ error: 'Methode nicht erlaubt' });
}
