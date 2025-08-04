import { PrismaClient } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Methode nicht erlaubt" });
  }

  // Hilfsfunktion zur Lesedauer-Berechnung
  function berechneLesedauer(text: string, wpm: number = 220): number {
    const wortAnzahl = text ? text.trim().split(/\s+/).length : 0;
    return Math.max(1, Math.round(wortAnzahl / wpm));
  }
  try {
    const posts = await prisma.blockDraft.findMany({
      include: {
        user: { select: { id: true, username: true, name: true } }
      },
      orderBy: { updatedAt: "desc" }
    });
    // Lesedauer für jeden Beitrag berechnen (Feld: readingTimeMinutes)
    const postsMitLesedauer = posts.map(post => ({
      ...post,
      readingTimeMinutes: berechneLesedauer(typeof post.blocks === 'string' ? post.blocks : JSON.stringify(post.blocks))
    }));
    res.status(200).json(postsMitLesedauer);
  } catch (e) {
    res.status(500).json({ error: "Fehler beim Laden der Blog-Beiträge" });
  }
}
