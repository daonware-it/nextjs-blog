import { getServerSession } from "next-auth";
import { NextApiRequest, NextApiResponse } from "next";
import { authOptions } from "./auth/[...nextauth]";

import { PrismaClient } from '@prisma/client';
import { hasIncludedRequests, decrementIncludedRequests } from '../../lib/aiQuotaUtils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  const userEmail = session?.user?.email;
  if (!userEmail) {
    return res.status(401).json({ error: "Nicht eingeloggt" });
  }

  const prisma = new PrismaClient();
  const user = await prisma.user.findUnique({ 
    where: { email: userEmail },
    //@ts-ignore - status ist im Schema vorhanden, wird aber von TypeScript nicht erkannt
    select: { id: true, status: true } 
  });
  if (!user) {
    return res.status(404).json({ error: "User nicht gefunden" });
  }

  //@ts-ignore - status ist im Schema vorhanden, wird aber von TypeScript nicht erkannt
  if (user.status !== 'ACTIVE') {
    return res.status(403).json({ 
      error: "Dein Konto ist gesperrt oder inaktiv. Bitte kontaktiere den Support für weitere Informationen.",
      //@ts-ignore - status ist im Schema vorhanden, wird aber von TypeScript nicht erkannt
      status: user.status
    });
  }

  const allowed = await hasIncludedRequests(user.id);
  if (!allowed) {
    return res.status(403).json({ error: "Limit für dein Abo erreicht. Für mehr Anfragen kontaktiere bitte den Support oder buche ein Upgrade." });
  }

  let { blocks, mode, text, formatting } = req.body;
  if ((!blocks || !Array.isArray(blocks) || blocks.length === 0) && (!text || typeof text !== 'string' || !text.trim())) {
    return res.status(400).json({ error: "Blocks oder Text fehlen oder sind ungültig" });
  }

  mode = mode || 'text';
  
  if (formatting === true && mode === 'text') {
    mode = 'formatted_text';
  }
  
  let contextText = '';
  if (blocks && Array.isArray(blocks) && blocks.length > 0) {
    contextText = blocks
      .filter((b: any) => b.type === 'text' && typeof b.data === 'string')
      .map((b: any) => b.data.trim())
      .filter(Boolean)
      .join('\n');
  } else if (text && typeof text === 'string') {
    contextText = text.trim();
  }

  let prompt = '';
  if (mode === 'title') {
    if (text && mode === 'title' && contextText) {
      prompt = `${text}\n\nHier ist der Inhalt als Kontext:\n${contextText}`;
    } else {
      prompt = `Erstelle einen prägnanten, ansprechenden Titel für einen Blogartikel basierend auf folgendem Inhalt. Der Titel soll neugierig machen, aber nicht clickbait sein.\n\nInhalt:\n${contextText}`;
    }
  } else if (mode === 'description') {
    if (text && mode === 'description' && contextText) {
      prompt = `${text}\n\nHier ist der Inhalt als Kontext:\n${contextText}`;
    } else {
      prompt = `Erstelle eine kurze, ansprechende Beschreibung (maximal 300 Zeichen) für einen Blogartikel basierend auf folgendem Inhalt. Die Beschreibung soll Interesse wecken und den Inhalt zusammenfassen.\n\nInhalt:\n${contextText}`;
    }
  } else if (mode === 'text') {
    prompt = `Schreibe einen hochwertigen, zusammenhängenden Text auf Basis folgender Inhaltsblöcke. Nutze einen natürlichen, ansprechenden Stil.

Du kannst folgende Formatierungen verwenden, um den Text ansprechender zu gestalten:
- **Fett** für wichtige Begriffe oder Betonungen
- *Kursiv* für leichte Hervorhebungen oder fremdsprachige Begriffe
- Überschriften mit # und ## für Abschnitte
- Aufzählungslisten mit - oder * am Zeilenanfang
- Nummerierte Listen mit 1., 2., 3. usw.

Inhaltsblöcke:
${contextText}

Strukuriere den Text gut mit Absätzen und nutze die Formatierungsmöglichkeiten, um wichtige Punkte hervorzuheben.`;
  } else if (mode === 'formatted_text') {
    prompt = `Schreibe einen hochwertigen, strukturierten Text auf Basis folgender Inhaltsblöcke oder Anweisungen. Nutze HTML-Formatierungen für ein ansprechendes Layout.

Verwende folgende HTML-Elemente zur Formatierung:
- <strong>Fett</strong> für wichtige Begriffe oder Betonungen
- <em>Kursiv</em> für leichte Hervorhebungen
- <h2>Überschriften</h2> für Hauptabschnitte
- <h3>Unterüberschriften</h3> für Unterabschnitte
- <ul><li>Punkt 1</li><li>Punkt 2</li></ul> für Aufzählungslisten
- <ol><li>Schritt 1</li><li>Schritt 2</li></ol> für nummerierte Listen

Inhaltsblöcke oder Anweisungen:
${contextText}

Deine Antwort sollte direkt mit dem formatierten HTML beginnen. Verzichte auf Einleitungen wie "Hier ist der formatierte Text:" o.ä.`;
  } else if (mode === 'table') {
    const { rows, cols, headerText, description, autoSize } = req.body;
    
    if (autoSize) {
      prompt = `Analysiere das Thema "${headerText || contextText}" und erstelle eine passende Tabelle dazu.
      
      ${description ? `Zusätzliche Anforderungen: ${description}` : ''}
      
      Bestimme selbst die optimale Anzahl an Zeilen und Spalten basierend auf dem Thema und den Informationen, die präsentiert werden sollen.
      Gib das Ergebnis als JSON-Objekt mit folgendem Format zurück:
      {
        "rows": Anzahl der Zeilen (bestimme einen sinnvollen Wert),
        "cols": Anzahl der Spalten (bestimme einen sinnvollen Wert),
        "data": [
          [{"text": "Spaltenüberschrift 1"}, {"text": "Spaltenüberschrift 2"}, ...],
          [{"text": "Zelle 2-1"}, {"text": "Zelle 2-2"}, ...],
          ...
        ]
      }
      
      Die erste Zeile sollte Überschriften enthalten. Passe die Anzahl der Zeilen und Spalten sinnvoll an das Thema an.
      Stelle sicher, dass das JSON gültig ist und nur diese Struktur enthält.`;
    } else {
      prompt = `Erstelle eine Tabelle mit ${rows || 3} Zeilen und ${cols || 3} Spalten zum Thema "${headerText || contextText}".
      
      ${description ? `Zusätzliche Anforderungen: ${description}` : ''}
      
      Gib das Ergebnis als JSON-Objekt mit folgendem Format zurück:
      {
        "rows": Anzahl der Zeilen,
        "cols": Anzahl der Spalten,
        "data": [
          [{"text": "Zelle 1-1"}, {"text": "Zelle 1-2"}],
          [{"text": "Zelle 2-1"}, {"text": "Zelle 2-2"}]
        ]
      }
      
      Die erste Zeile sollte Überschriften enthalten. Stelle sicher, dass das JSON gültig ist und nur diese Struktur enthält.`;
    }
  } else {
    prompt = `Schreibe einen hochwertigen, zusammenhängenden Text auf Basis folgender Inhaltsblöcke. Nutze einen natürlichen, ansprechenden Stil.\n\nInhalt:\n${contextText}`;
  }

  let aiResult = '';
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "OpenAI API Key fehlt" });
    }
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "Du bist ein hilfreicher KI-Textgenerator für Blogbeiträge und Content." },
          { role: "user", content: prompt }
        ],
        max_tokens: 512,
        temperature: 0.7
      })
    });
    const openaiData = await openaiRes.json();
    aiResult = openaiData.choices?.[0]?.message?.content?.trim() || "";
    if (!aiResult) {
      return res.status(500).json({ error: "Keine Antwort von OpenAI erhalten.", details: openaiData });
    }
  } catch (err) {
    console.error("Fehler beim OpenAI-Request:", err);
    return res.status(500).json({ error: "Fehler bei der KI-Anfrage.", details: err?.message || err });
  }

  await prisma.aiRequest.create({
    data: {
      userId: user.id,
      prompt,
      result: aiResult,
    },
  });

  await decrementIncludedRequests(user.id);

  return res.status(200).json({ result: aiResult });
}
