import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import authOptions from "./auth/[...nextauth]";
import { prisma } from 'lib/prisma';
import { rateLimit } from 'src-lib/rateLimit';
import { Session } from "next-auth";

// deepcode ignore NoRateLimitingForExpensiveWebOperation: <please specify a reason of ignoring this>
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (rateLimit(req, res)) return;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Nur POST erlaubt." });
  }

  const session = await getServerSession(req, res, authOptions) as Session | null;
  if (!session || !session.user?.email) {
    return res.status(401).json({ error: "Nicht authentifiziert." });
  }

  const { email } = req.body;
  if (!email || email !== session.user.email) {
    return res.status(400).json({ error: "Ungültige Anfrage." });
  }

  try {
    // Hole User anhand der aktuellen E-Mail
    let user = await prisma.user.findUnique({ where: { email } });
    // Falls kein User gefunden, prüfe EmailHistory (alte E-Mail)
    if (!user) {
      const emailHistory = await prisma.emailHistory.findFirst({ where: { newEmail: email } });
      if (emailHistory) {
        user = await prisma.user.findUnique({ where: { id: emailHistory.userId } });
      }
    }
    if (!user) {
      return res.status(404).json({ error: "Benutzer nicht gefunden." });
    }
    // Lösche alle abhängigen Daten des Users
    await prisma.emailHistory.deleteMany({ where: { userId: user.id } });
    await prisma.userSubscription.deleteMany({ where: { userId: user.id } });
    await prisma.aiRequest.deleteMany({ where: { userId: user.id } });
    await prisma.blockDraft.deleteMany({
      where: {
        OR: [
          { userId: user.id },
          { coAuthorId: user.id }
        ]
      }
    });
    await prisma.notification.deleteMany({ where: { userId: user.id } });
    // Entferne User aus allen Newslettern (Relationstabelle)
    await prisma.newsletter.updateMany({
      data: {},
      where: {},
    });
    await prisma.$executeRaw`DELETE FROM "_NewsletterToUser" WHERE "B" = ${user.id}`;
    await prisma.post.deleteMany({ where: { authorId: user.id } });
    // Avatar ggf. löschen
    // Avatar-Löschungen pro User-ID throttlen (max. 1/Minute)
    const avatarDeleteMap = (global as any).avatarDeleteMap || new Map<number, number>();
    (global as any).avatarDeleteMap = avatarDeleteMap;
    // Globaler Rate-Limiter für Avatar-Löschungen (max. 10/min)
    const avatarDeleteGlobal = (global as any).avatarDeleteGlobal || { count: 0, last: 0 };
    (global as any).avatarDeleteGlobal = avatarDeleteGlobal;
    let avatarDeleted = false;
    if (user.avatarUrl) {
      const now = Date.now();
      const lastDelete = avatarDeleteMap.get(user.id) || 0;
      if (now - lastDelete < 60_000) {
        return res.status(429).json({ error: "Avatar-Löschung zu häufig. Bitte warte eine Minute." });
      }
      // Globales Limit prüfen
      if (now - avatarDeleteGlobal.last > 60_000) {
        avatarDeleteGlobal.count = 1;
        avatarDeleteGlobal.last = now;
      } else {
        avatarDeleteGlobal.count++;
      }
      if (avatarDeleteGlobal.count > 10) {
        return res.status(429).json({ error: "Zu viele Avatar-Löschungen im System. Bitte warte kurz." });
      }
      const fs = await import("fs/promises");
      const path = await import("path");
      let avatarFile = user.avatarUrl.replace(/^\/+/, "");
      if (avatarFile.startsWith("avatars/")) avatarFile = avatarFile.substring(8);
      // Nur erlaubte Dateinamen zulassen (keine Pfadangaben, keine Traversal, nur bestimmte Endungen)
      if (!/^[a-zA-Z0-9._-]+\.(png|jpg|jpeg|gif)$/i.test(avatarFile)) {
        return res.status(400).json({ error: "Ungültiger Avatar-Dateiname." });
      }
      const avatarPath = path.join(process.cwd(), "public", "avatars", avatarFile);
      try {
        await fs.unlink(avatarPath);
        avatarDeleteMap.set(user.id, now);
        avatarDeleted = true;
      } catch (err) {
        // Datei existiert nicht oder konnte nicht gelöscht werden
      }
    }
    // Lösche den User
    await prisma.user.delete({ where: { id: user.id } });
    return res.status(200).json({ success: true, avatarDeleted });
  } catch (error: any) {
    return res.status(500).json({ error: "Fehler beim Löschen des Kontos." });
  }
}
