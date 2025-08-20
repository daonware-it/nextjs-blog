import { getUserFromSession } from "src-lib/apiUtils";
import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUserFromSession(req, res);
  if (!user) return; // Fehler wurde bereits in der Hilfsfunktion behandelt

  if (req.method === "GET") {
    // Alle eigenen BlockDrafts (inkl. Co-Author) holen
    const drafts = await prisma.blockDraft.findMany({
      where: { userId: Number(user.id) },
      include: {
        coAuthor: {
          select: { id: true, username: true, name: true, role: true }
        }
      },
      orderBy: { updatedAt: "desc" }
    });
    return res.status(200).json(drafts);
  }

  return res.status(405).json({ error: "Methode nicht erlaubt" });
}
