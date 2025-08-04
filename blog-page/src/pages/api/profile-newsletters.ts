import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  // Cache-Header setzen, um sicherzustellen, dass keine Caching stattfindet
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: "Email erforderlich" });
    
    // GET-Anfrage für Newsletter abrufen
    if (req.method === "GET") {
      try {
        const user = await prisma.user.findUnique({ 
          where: { email: String(email) }, 
          include: { newsletters: true } 
        });
        
        if (!user) {
          // Statt 404 zurückzugeben, senden wir ein leeres Array
          return res.status(200).json({ newsletters: [] });
        }
        
        return res.status(200).json({ newsletters: user.newsletters || [] });
      } catch (error) {
        console.error("Fehler beim Abrufen der Newsletter:", error);
        return res.status(200).json({ newsletters: [] });
      }
    }
    
    // POST-Anfrage für Newsletter aktualisieren
    if (req.method === "POST") {
      try {
        const { newsletterIds } = req.body;
        
        const user = await prisma.user.findUnique({ 
          where: { email: String(email) }
        });
        
        if (!user) {
          return res.status(404).json({ error: "User nicht gefunden" });
        }
        
        // Update der Newsletter-Einstellungen
        await prisma.user.update({
          where: { email: String(email) },
          data: {
            newsletters: {
              set: newsletterIds || [],
            },
          },
        });
        
        return res.status(200).json({ success: true });
      } catch (error) {
        console.error("Fehler beim Aktualisieren der Newsletter:", error);
        return res.status(500).json({ error: "Fehler beim Aktualisieren der Newsletter" });
      }
    }
    
    return res.status(405).end();
  } catch (error) {
    console.error("Allgemeiner Fehler in der Newsletter-API:", error);
    return res.status(500).json({ error: "Interner Serverfehler" });
  }
}
