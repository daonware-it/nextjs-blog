import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { email } = req.query;
  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "E-Mail erforderlich" });
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(404).json({ error: "Benutzer nicht gefunden" });
  }
  return res.status(200).json({ is2faEnabled: !!user.twoFactorEnabled });
}
