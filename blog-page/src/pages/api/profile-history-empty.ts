import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import authOptions from './auth/[...nextauth]';
import { Session } from "next-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions) as Session | null;
    if (!session || !session.user) {
      return res.status(401).json({ error: "Nicht eingeloggt" });
    }

    // Leere Historien zurückgeben
    return res.status(200).json({
      usernameHistory: [],
      emailHistory: []
    });
  } catch (error) {
    console.error("Fehler beim Abrufen der Benutzerhistorie:", error);
    return res.status(500).json({ error: "Serverfehler beim Abrufen der Benutzerhistorie" });
  }
}
