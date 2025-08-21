import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Nur GET erlaubt' });
  }
  try {
    const comments = await prisma.blockDraftComment.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, username: true, email: true } },
        blockDraft: { select: { id: true, title: true } },
        replies: true,
        blockDraftCommentReports: true,
        likes: true,
      },
    });
    res.status(200).json(comments);
  } catch (e) {
    res.status(500).json({ error: 'Fehler beim Laden der Kommentare' });
  }
}
