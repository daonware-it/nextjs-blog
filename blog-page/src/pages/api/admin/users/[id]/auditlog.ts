import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from 'lib/prisma';
import { getAdminSessionOrThrow } from 'src/lib/authHelpers';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Admin-Rechte prüfen
  const session = await getAdminSessionOrThrow(req, res);
  if (!session) return;

  const userId = parseInt(req.query.id as string, 10);
  
  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Ungültige Benutzer-ID' });
  }

  if (req.method === 'GET') {
    try {
      const page = parseInt(req.query.page as string || '1', 10);
      const pageSize = parseInt(req.query.pageSize as string || '20', 10);
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
