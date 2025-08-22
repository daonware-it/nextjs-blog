import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Benutzer-Session prüfen
  const session = await getServerSession(req, res, authOptions);
  
  if (!session || !session.user) {
    return res.status(401).json({ error: 'Nicht autorisiert' });
  }

  const userId = (session.user as any).id;
  
  if (!userId) {
    return res.status(400).json({ error: 'Benutzer-ID nicht gefunden' });
  }

  if (req.method === 'GET') {
    try {
      const page = parseInt(req.query.page as string || '1', 10);
      const pageSize = parseInt(req.query.pageSize as string || '10', 10);
      const skip = (page - 1) * pageSize;

      // Gesamtanzahl der Audit-Logs für diesen Benutzer ermitteln
      const totalCount = await prisma.auditLog.count({
        where: { userId }
      });

      // Audit-Logs für diesen Benutzer abrufen
      const auditLogs = await prisma.auditLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          admin: {
            select: {
              id: true,
              username: true
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
