import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Nur GET erlaubt' });
  }
  try {
    // Alle Reports für BlockDrafts und Kommentare
    const blockReports = await prisma.blockDraftReport.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        blockDraft: { select: { id: true, title: true } },
      },
    });
    const commentReports = await prisma.blockDraftCommentReport.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        comment: {
          select: { id: true, content: true, blockDraftId: true },
        },
      },
    });
    res.status(200).json({ blockReports, commentReports });
  } catch (e) {
    res.status(500).json({ error: 'Fehler beim Laden der Reports' });
  }
}
