import { getServerSession } from "next-auth";
import { NextApiRequest, NextApiResponse } from "next";
import { authOptions } from "./auth/[...nextauth]";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  const userEmail = session?.user?.email;
  if (!userEmail) {
    return res.status(401).json({ error: "Nicht eingeloggt" });
  }

  // Hole UserId
  const user = await prisma.user.findUnique({ where: { email: userEmail } });
  if (!user) {
    return res.status(404).json({ error: "User nicht gefunden" });
  }

  if (req.method === "GET") {
    // Alle eigenen BlockDrafts (inkl. Co-Author) holen
    const drafts = await prisma.blockDraft.findMany({
      where: { userId: user.id },
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
