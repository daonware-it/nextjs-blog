import { PrismaClient } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { blockDraftId } = req.query;
  if (!blockDraftId || isNaN(Number(blockDraftId))) {
    return res.status(400).json({ error: "blockDraftId fehlt oder ungültig" });
  }

  if (req.method === "GET") {
    // Kommentare abrufen
    const comments = await prisma.blockDraftComment.findMany({
      where: { blockDraftId: Number(blockDraftId), parentCommentId: null },
      orderBy: { createdAt: "asc" },
      include: {
        user: { select: { id: true, name: true, username: true } },
        replies: {
          orderBy: { createdAt: "asc" },
          include: { user: { select: { id: true, name: true, username: true } } }
        }
      }
    });
    return res.status(200).json(comments);
  }

  if (req.method === "POST") {
    // Nur eingeloggte Nutzer dürfen kommentieren
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(401).json({ error: "Nicht angemeldet" });
    }
    const { content, parentCommentId } = req.body;
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return res.status(400).json({ error: "Kommentar darf nicht leer sein" });
    }
    let parentId: number | undefined = undefined;
    if (parentCommentId !== undefined && parentCommentId !== null) {
      if (isNaN(Number(parentCommentId))) {
        return res.status(400).json({ error: "parentCommentId ungültig" });
      }
      parentId = Number(parentCommentId);
    }
    const comment = await prisma.blockDraftComment.create({
      data: {
        blockDraftId: Number(blockDraftId),
        userId: Number(session.user.id),
        content: content.trim(),
        parentCommentId: parentId,
      },
      include: { user: { select: { id: true, name: true, username: true } } }
    });
    return res.status(201).json(comment);
  }

  if (req.method === "DELETE") {
    // Nur Admins dürfen löschen
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return res.status(403).json({ error: "Keine Admin-Berechtigung" });
    }
    const { commentId } = req.body;
    if (!commentId || isNaN(Number(commentId))) {
      return res.status(400).json({ error: "commentId fehlt oder ungültig" });
    }
    try {
      // Zuerst alle Reports und Likes zu diesem Kommentar löschen
      await prisma.blockDraftCommentReport.deleteMany({ where: { commentId: Number(commentId) } });
      await prisma.blockDraftCommentLike.deleteMany({ where: { commentId: Number(commentId) } });
      // Dann alle Antworten (Replies) löschen (inkl. deren Reports/Likes)
      const replies = await prisma.blockDraftComment.findMany({ where: { parentCommentId: Number(commentId) }, select: { id: true } });
      for (const reply of replies) {
        await prisma.blockDraftCommentReport.deleteMany({ where: { commentId: reply.id } });
        await prisma.blockDraftCommentLike.deleteMany({ where: { commentId: reply.id } });
      }
      await prisma.blockDraftComment.deleteMany({ where: { parentCommentId: Number(commentId) } });
      // Dann den Kommentar selbst löschen
      await prisma.blockDraftComment.delete({ where: { id: Number(commentId) } });
      return res.status(200).json({ success: true });
    } catch (e) {
      return res.status(500).json({ error: "Fehler beim Löschen des Kommentars" });
    }
  }
  res.status(405).json({ error: "Methode nicht erlaubt" });
}
