import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import authOptions from '../pages/api/auth/[...nextauth]';
import { Session } from 'next-auth';

/**
 * Holt die Session und prüft, ob der Nutzer Admin ist.
 * Gibt die Session zurück, wenn Admin, sonst null.
 */
export async function getAdminSession(req: NextApiRequest, res: NextApiResponse): Promise<Session | null> {
  const session = (await getServerSession(req, res, authOptions)) as Session | null;
  if (!session || session.user?.role !== 'ADMIN') {
    return null;
  }
  return session;
}

/**
 * Holt die Session und prüft, ob der Nutzer Admin ist.
 * Gibt die Session zurück, wenn Admin, sonst wird direkt eine 401-Response gesetzt und null zurückgegeben.
 */
export async function getAdminSessionOrThrow(req: NextApiRequest, res: NextApiResponse): Promise<Session | null> {
  const session = await getAdminSession(req, res);
  if (!session) {
    res.status(401).json({ error: 'Nicht autorisiert' });
    return null;
  }
  return session;
}
