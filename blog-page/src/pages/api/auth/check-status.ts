import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import authOptions from './[...nextauth]';
import { prisma } from 'lib/prisma';
import { Session } from "next-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    
    const session = await getServerSession(req, res, authOptions) as Session | null;

    if (!session) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    const userId = session.user.id;

    const userStatus = await prisma.$queryRaw`SELECT status FROM "User" WHERE id = ${Number(userId)}`;
    
    if (userStatus && Array.isArray(userStatus) && userStatus.length > 0) {
      return res.status(200).json({ status: userStatus[0].status });
    } else {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Interner Serverfehler' });
  }
}
