import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import authOptions from '../auth/[...nextauth]';
import { NextApiRequest, NextApiResponse } from 'next';

interface Session {
  user: {
    id: number;
    email: string;
    role: string;
  };
  expires: string;
}

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Nur POST zulassen
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  // Session prüfen (nur Admins/Moderatoren)
  const session = await getServerSession(req, res, authOptions) as Session | null;
  if (!session || (session.user?.role !== 'ADMIN' && session.user?.role !== 'MODERATOR')) {
    return res.status(403).json({ error: 'Nicht autorisiert' });
  }
  // Löschung ausführen
  const deleted = await prisma.blockDraft.deleteMany({
    where: {
      deleteAt: {
        not: null,
        lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    },
  });
  return res.status(200).json({ message: `BlockDrafts gelöscht: ${deleted.count}`, count: deleted.count });
}
