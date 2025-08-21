import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { requireAuthWithRoles } from './auth-helpers';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const allowedRoles = ['ADMIN', 'MODERATOR', 'BLOGGER'];
  const user = await requireAuthWithRoles(req, res, allowedRoles);
  if (!user) {
    return res.status(401).json({ error: 'Nicht autorisiert' });
  }

  const { q } = req.query;
  const search = typeof q === 'string' ? q : '';

  try {
    const users = await prisma.user.findMany({
      where: {
        // Prisma akzeptiert bei String-Feldern kein "mode" für equals, daher auf einfache Gleichheit prüfen
        role: 'BLOGGER',
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { username: { contains: search, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
      },
      take: 10,
      orderBy: { name: 'asc' },
    });
    res.status(200).json(users);
  } catch (e) {
    // Fehlerausgabe für Debugging
    console.error('Fehler in /api/search-bloggers:', e);
    res.status(500).json({ error: 'Fehler beim Suchen der Nutzer.', details: e instanceof Error ? e.message : e });
  }
}
