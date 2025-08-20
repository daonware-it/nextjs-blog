import { getServerSession } from "next-auth/next";
import authOptions from "./auth/[...nextauth]";
import { PrismaClient } from "@prisma/client";
import { createAuditLog } from "@/lib/auditLogUtils";
import { Session } from "next-auth";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const session = await getServerSession(req, res, authOptions) as Session | null;
  if (!session || !session.user) {
    return res.status(401).json({ error: "Nicht eingeloggt" });
  }
  const { username, email } = req.body;
  const user = await prisma.user.findUnique({ where: { id: Number(session!.user!.id) }, include: { usernameHistory: true, emailHistory: true } });
  if (!user) return res.status(404).json({ error: "User nicht gefunden" });

  // Username ändern
  if (username && username !== user.username) {
    const now = new Date();
    if (user.lastUsernameChange && now.getTime() - new Date(user.lastUsernameChange).getTime() < 90 * 24 * 60 * 60 * 1000) {
      return res.status(400).json({ error: "Benutzername kann nur alle 90 Tage geändert werden." });
    }
    const existingUsername = await prisma.user.findUnique({ where: { username } });
    if (existingUsername) {
      return res.status(409).json({ error: "Benutzername bereits vergeben." });
    }
    await prisma.usernameHistory.create({
      data: {
        userId: user.id,
        oldUsername: user.username,
        newUsername: username,
      },
    });
    await prisma.user.update({
      where: { id: user.id },
      data: { username, lastUsernameChange: now },
    });
    
    // Audit-Log für Benutzernamenänderung erstellen
    await createAuditLog({
      userId: user.id,
      action: "USER_UPDATE",
      details: "Benutzername geändert",
      oldValue: user.username,
      newValue: username
    });
  }

  // E-Mail ändern
  if (email && email !== user.email) {
    const now = new Date();
    if (user.lastEmailChange && now.getTime() - new Date(user.lastEmailChange).getTime() < 90 * 24 * 60 * 60 * 1000) {
      return res.status(400).json({ error: "E-Mail kann nur alle 90 Tage geändert werden." });
    }
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return res.status(409).json({ error: "E-Mail bereits vergeben." });
    }
    await prisma.emailHistory.create({
      data: {
        userId: user.id,
        oldEmail: user.email,
        newEmail: email,
      },
    });
    await prisma.user.update({
      where: { id: user.id },
      data: { email, lastEmailChange: now },
    });
    
    // Audit-Log für E-Mail-Änderung erstellen
    await createAuditLog({
      userId: user.id,
      action: "USER_UPDATE",
      details: "E-Mail-Adresse geändert",
      oldValue: user.email,
      newValue: email
    });
  }

  return res.status(200).json({ success: true });
}
