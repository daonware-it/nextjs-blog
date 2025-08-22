import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../lib/prisma';

// Löscht BlockDrafts, die älter als 30 Tage sind
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    const deleted = await prisma.blockDraft.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });
    return res.status(200).json({ deletedCount: deleted.count });
  } catch (error) {
    return res.status(500).json({ error: 'Fehler beim Bereinigen', details: error });
  }
}
