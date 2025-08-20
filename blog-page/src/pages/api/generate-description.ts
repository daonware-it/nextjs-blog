import { getServerSession } from "next-auth/next";
import { NextApiRequest, NextApiResponse } from "next";
import authOptions from "./auth/[...nextauth]";
import { hasIncludedRequests } from 'src-lib/aiQuotaUtils';
import { PrismaClient } from '@prisma/client';
import { Session } from "next-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions) as Session | null;
  const userEmail = session?.user?.email;
  if (!userEmail) {
    return res.status(401).json({ error: "Nicht eingeloggt" });
  }

  const prisma = new PrismaClient();
  const user = await prisma.user.findUnique({ where: { email: userEmail } });
  if (!user) {
    return res.status(404).json({ error: "User nicht gefunden" });
  }

  // Quota-Prüfung
  const allowed = await hasIncludedRequests(user.id);
  if (!allowed) {
    return res.status(403).json({ error: "Limit für dein Abo erreicht. Für mehr Anfragen kontaktiere bitte den Support oder buche ein Upgrade." });
  }

  // Weiterleitung an den zentralen AI-Generate-Endpunkt
  const { blocks, mode } = req.body;
  if (!blocks || !Array.isArray(blocks) || !mode) {
    return res.status(400).json({ error: "Ungültige Anfrage" });
  }

  // AI-Generate-Endpunkt aufrufen
  try {
    const aiGenerateRes = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/ai-generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': req.headers.cookie || '', // Authentifizierungscookies übertragen
      },
      body: JSON.stringify({ blocks, mode }),
    });
    
    const aiGenerateData = await aiGenerateRes.json();
    
    if (!aiGenerateRes.ok) {
      return res.status(aiGenerateRes.status).json({ 
        error: aiGenerateData?.error || "Fehler bei der KI-Anfrage" 
      });
    }
    
    // Ergebnis zurückgeben
    if (mode === "title") {
      return res.status(200).json({ title: aiGenerateData.result });
    } else {
      return res.status(200).json({ description: aiGenerateData.result });
    }
  } catch (err) {
    console.error("Fehler beim AI-Generate-Request:", err);
    return res.status(500).json({ error: "Fehler bei der KI-Anfrage.", details: err?.message || err });
  }

  // OpenAI API-Aufruf über AI-Generate
  // Weiterleitung an den zentralen AI-Generate-Endpunkt

}
