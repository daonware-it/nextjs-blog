import { PrismaClient } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Methode nicht erlaubt" });
  }
  const { blockDraftId, userId } = req.body;
  if (blockDraftId === undefined || blockDraftId === null || isNaN(Number(blockDraftId))) {
    return res.status(400).json({ error: "blockDraftId fehlt oder ist keine Zahl" });
  }
  if (userId === undefined || userId === null || isNaN(Number(userId))) {
    return res.status(400).json({ error: "userId fehlt oder ist keine Zahl" });
  }
  try {
    // IP-Adresse als Fallback für anonyme Likes (kann später durch UserId ersetzt werden)
    const ip = req.headers["x-forwarded-for"]?.toString().split(",")[0] || req.socket.remoteAddress || "";
    // Einfache Duplikat-Prüfung: Ein Like pro IP pro Block (optional, kann entfernt werden)
    const existing = await prisma.blockDraftLike.findFirst({
      where: { blockDraftId: Number(blockDraftId), userId: Number(userId) },
    });
    if (existing) {
      return res.status(409).json({ error: "Bereits geliked" });
    }
    await prisma.blockDraftLike.create({
      data: {
        blockDraftId: Number(blockDraftId),
        userId: Number(userId),
        ip: ip,
      },
    });
    res.status(200).json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Fehler beim Liken" });
  }
}
