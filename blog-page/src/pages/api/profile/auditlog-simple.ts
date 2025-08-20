import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import authOptions from '../auth/[...nextauth]';
import { Session } from "next-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Benutzer-Session prüfen
  const session = await getServerSession(req, res, authOptions) as Session | null;

  if (!session || !session.user) {
    return res.status(401).json({ error: 'Nicht autorisiert' });
  }

  if (req.method === 'GET') {
    // Mock-Daten zurückgeben, leere Audit-Logs
    return res.status(200).json({
      auditLogs: [],
      pagination: {
        page: 1,
        pageSize: 10,
        totalCount: 0,
        totalPages: 0
      }
    });
  }

  return res.status(405).json({ error: 'Methode nicht erlaubt' });
}
