import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import authOptions from './auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';
import { getTokenStatus } from "@/lib/tokenStatusHelper";
import { Session } from "next-auth";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Session prüfen
    const session = await getServerSession(req, res, authOptions) as Session | null;
    if (!session) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }
    // E-Mail aus Session holen
    const email = session.user?.email;
    if (!email) {
      return res.status(200).json({ isBlocked: false });
    }
    // User aus DB holen
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    });
    if (!user) {
      return res.status(200).json({ isBlocked: false });
    }
    // Token-Status prüfen
    const tokenStatus = await getTokenStatus(user.id);
    return res.status(200).json(tokenStatus);
  } catch (error) {
    console.error('Fehler beim Abrufen des Token-Status:', error);
    return res.status(500).json({ error: 'Serverfehler beim Abrufen des Token-Status' });
  }
}
