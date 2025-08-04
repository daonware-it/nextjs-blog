import { PrismaClient } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from 'next';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Cache-Header setzen, um sicherzustellen, dass keine Caching stattfindet
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: "Email erforderlich" });
  
  try {
    const user = await prisma.user.findUnique({ where: { email: String(email) } });
    if (!user) {
      // Kein Avatar-Link zurückgeben, wenn der User nicht existiert
      return res.status(200).json({ avatarUrl: null });
    }
    // Wenn kein Avatar gesetzt ist, ebenfalls null zurückgeben
    return res.status(200).json({ avatarUrl: user.avatarUrl || null });
  } catch (error) {
    console.error("Fehler beim Abrufen des Avatars:", error);
    // Auch bei Fehlern ein Standard-Avatar zurückgeben
    return res.status(200).json({ avatarUrl: null });
  }
}
