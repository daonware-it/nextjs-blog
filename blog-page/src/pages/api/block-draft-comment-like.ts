import { PrismaClient } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Methode nicht erlaubt" });
  }
  const { commentId, userId } = req.body;
  if (commentId === undefined || commentId === null || isNaN(Number(commentId))) {
    return res.status(400).json({ error: "commentId fehlt oder ist keine Zahl" });
  }
  if (userId === undefined || userId === null || isNaN(Number(userId))) {
    return res.status(400).json({ error: "userId fehlt oder ist keine Zahl" });
  }
  try {
    const ip = req.headers["x-forwarded-for"]?.toString().split(",")[0] || req.socket.remoteAddress || "";
    const existing = await prisma.blockDraftCommentLike.findFirst({
      where: { commentId: Number(commentId), userId: Number(userId) },
    });
    if (existing) {
      return res.status(409).json({ error: "Bereits geliked" });
    }
    await prisma.blockDraftCommentLike.create({
      data: {
        commentId: Number(commentId),
        userId: Number(userId),
        ip: ip,
      },
    });
    res.status(200).json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Fehler beim Liken" });
  }
}
