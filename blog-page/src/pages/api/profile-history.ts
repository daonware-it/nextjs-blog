import { getServerSession } from "next-auth/next";
import authOptions from "./auth/[...nextauth]";
import { PrismaClient } from "@prisma/client";
import { Session } from "next-auth";
import { NextApiRequest, NextApiResponse } from "next";

const prisma = new PrismaClient();
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions) as Session | null;
    if (!session || !session.user) {
      return res.status(401).json({ error: "Nicht eingeloggt" });
    }

    const userId = Number(session.user.id);
    
    // Benutzernamen-Historie abrufen
    const usernameHistory = await prisma.usernameHistory.findMany({
      where: { userId },
      orderBy: { changedAt: 'desc' },
      select: {
        id: true,
        oldUsername: true,
        newUsername: true,
        changedAt: true
      }
    });

    // E-Mail-Historie abrufen
    const emailHistory = await prisma.emailHistory.findMany({
      where: { userId },
      orderBy: { changedAt: 'desc' },
      select: {
        id: true,
        oldEmail: true,
        newEmail: true,
        changedAt: true
      }
    });

    return res.status(200).json({
      usernameHistory,
      emailHistory
    });
  } catch (error) {
    console.error("Fehler beim Abrufen der Benutzerhistorie:", error);
    return res.status(500).json({ error: "Serverfehler beim Abrufen der Benutzerhistorie" });
  }
}
