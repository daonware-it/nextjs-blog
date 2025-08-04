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
  const { message, type = "info" } = req.body;
  if (!message) return res.status(400).json({ error: "Nachricht fehlt" });
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return res.status(404).json({ error: "User nicht gefunden" });
  const notification = await prisma.notification.create({
    data: {
      userId: user.id,
      message,
      type,
      read: false,
    },
  });
  return res.status(200).json({ notification });
}
