
import { PrismaClient } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Methode nicht erlaubt" });
  }

  try {
    const { id } = req.query;
    if (id) {
      // Einzelnen Beitrag nach ID laden
      const post = await prisma.blockDraft.findFirst({
        where: { id: Number(id), status: "VEROEFFENTLICHT", deleteAt: null },
        include: {
          user: { select: { id: true, name: true, username: true } },
          coAuthor: { select: { id: true, name: true, username: true } },
          category: { select: { id: true, name: true, color: true } },
        }
      });
      if (!post) return res.status(404).json({ error: "Beitrag nicht gefunden" });
      // Like- und Kommentar-Counts für diesen Beitrag
      const likeCount = await prisma.blockDraftLike.count({ where: { blockDraftId: post.id } });
      const commentCount = await prisma.blockDraftComment.count({ where: { blockDraftId: post.id } });
      res.status(200).json({ ...post, likeCount, commentCount });
      return;
    }
    // Alle veröffentlichten Beiträge mit wichtigen Feldern zurückgeben
    const posts = await prisma.blockDraft.findMany({
      where: { status: "VEROEFFENTLICHT", deleteAt: null },
      orderBy: { updatedAt: "desc" },
      include: {
        user: { select: { id: true, name: true, username: true } },
        coAuthor: { select: { id: true, name: true, username: true } },
        category: { select: { id: true, name: true, color: true } },
      }
    });
    const ids = posts.map(p => p.id);
    const likeCountsRaw = await prisma.blockDraftLike.groupBy({
      by: ['blockDraftId'],
      where: { blockDraftId: { in: ids } },
      _count: { blockDraftId: true }
    });
    const likeCounts = Object.fromEntries(likeCountsRaw.map(lc => [lc.blockDraftId, lc._count.blockDraftId]));
    const commentCountsRaw = await prisma.blockDraftComment.groupBy({
      by: ['blockDraftId'],
      where: { blockDraftId: { in: ids } },
      _count: { blockDraftId: true }
    });
    const commentCounts = Object.fromEntries(commentCountsRaw.map(cc => [cc.blockDraftId, cc._count.blockDraftId]));
    // Lesedauer berechnen (wie in /api/admin/blogs)
    function calculateReadingTimeFromBlocks(blocks: any): number {
      let text = '';
      if (typeof blocks === 'string') {
        text = blocks;
      } else if (blocks) {
        text = JSON.stringify(blocks);
      }
      const words = text.trim().split(/\s+/).length;
      return Math.max(1, Math.round(words / 220));
    }
    const postsWithCounts = posts.map(post => ({
      ...post,
      likeCount: likeCounts[post.id] ?? 0,
      commentCount: commentCounts[post.id] ?? 0,
      readingTimeMinutes: calculateReadingTimeFromBlocks(post.blocks)
    }));
    res.status(200).json(postsWithCounts);
  } catch (e) {
  res.status(500).json({ error: "Fehler beim Laden der veröffentlichten Beiträge" });
  }
}
