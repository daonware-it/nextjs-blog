import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  // Cache-Header setzen, um sicherzustellen, dass keine Caching stattfindet
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user?.email) {
      return res.status(401).json({ error: "Nicht eingeloggt" });
    }
    
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      // Statt 404 zurückzugeben, senden wir ein leeres Array
      return res.status(200).json({ notifications: [] });
    }
    
    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
    
    return res.status(200).json({ notifications });
  } catch (error) {
    console.error("Fehler beim Abrufen der Benachrichtigungen:", error);
    // Bei Fehlern ein leeres Array zurückgeben
    return res.status(200).json({ notifications: [] });
  }
}
