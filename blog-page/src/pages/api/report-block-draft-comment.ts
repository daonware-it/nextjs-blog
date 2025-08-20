import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from 'lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Nur POST erlaubt' });
  }
  const { commentId, reason } = req.body;
  if (!commentId || !reason) {
    return res.status(400).json({ error: 'commentId und reason sind erforderlich' });
  }
  try {
    await prisma.blockDraftCommentReport.create({
      data: {
        commentId: Number(commentId),
        reason: String(reason).slice(0, 500),
        createdAt: new Date(),
      },
    });
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'Fehler beim Speichern der Meldung' });
  }
}
