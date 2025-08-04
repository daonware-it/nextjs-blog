import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user?.email) {
    return res.status(401).json({ error: "Nicht eingeloggt" });
  }
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "ID fehlt" });
  // Nur eigene Notification löschen
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return res.status(404).json({ error: "User nicht gefunden" });
  await prisma.notification.deleteMany({ where: { id, userId: user.id } });
  return res.status(200).json({ success: true });
}
