import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import authOptions from './auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';
import { getTokenStatus } from "@/lib/tokenStatusHelper";
import { Session } from "next-auth";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Sitzung abrufen und Authentifizierung prüfen
  const session = await getServerSession(req, res, authOptions) as Session | null;
  if (!session) {
    return res.status(401).json({ error: 'Nicht authentifiziert' });
  }

  try {
    // Benutzer-ID aus der Session abrufen
    const email = (session!.user as any).email;

    if (!email) {
      return res.status(400).json({ error: 'Keine E-Mail in der Sitzung gefunden' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    // Token-Status über die zentrale Hilfsfunktion abrufen
    const tokenStatus = await getTokenStatus(user.id);

    // Für die Abwärtskompatibilität nur isBlocked zurückgeben
    return res.status(200).json({ isBlocked: tokenStatus.isBlocked });
  } catch (error) {
    return res.status(500).json({ error: 'Serverfehler beim Abrufen des Token-Status' });
  }
}
