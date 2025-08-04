# 🤖 KI-Integration (OpenAI, API-Schlüssel)

Die Blog-Plattform unterstützt eine optionale KI-Integration über die OpenAI API. Damit können Aufgaben wie Inhaltsprüfung, Textvorschläge oder Moderationshinweise KI-gestützt erfolgen.

---

## 🔌 Voraussetzungen
Du benötigst einen gültigen OpenAI API-Schlüssel. Diesen erhältst du unter:
[https://platform.openai.com/account/api-keys](https://platform.openai.com/account/api-keys)

---

## ⚙️ Einrichtung in der `.env`
Füge folgende Zeile zu deiner `.env`-Datei hinzu:

```env
OPENAI_API_KEY=sk-...
```
> **Hinweis:** Der Schlüssel ist geheim zu halten und darf niemals ins öffentliche Repository gelangen!

---


## 🧠 Verfügbare Funktionen

### ✍️ KI-Textvorschläge
Beim Erstellen oder Bearbeiten eines Beitrags kannst du dir direkt im Editor Textvorschläge, Gliederungen oder Einleitungen generieren lassen. Beispiele:
- "Fasse diesen Absatz zusammen"
- "Schreibe eine Einleitung zu diesem Thema"
- "Schlage eine Überschrift vor"

### 🧹 Automatische Moderation (optional, geplant)
Geplante Funktion: Die KI erkennt beleidigende Sprache, Spam oder toxisches Verhalten in Kommentaren.

---

## 🔒 Sicherheit & Begrenzung
- Alle KI-Anfragen laufen ausschließlich serverseitig (kein direkter Zugriff im Frontend).
- Die API kann durch Rate-Limiting und Rollenrechte beschränkt werden.
- API-Fehler (z. B. ungültiger Key) werden geloggt und im Admin-Panel angezeigt.
- Standardmäßig ist die KI-Funktion nur für Admins verfügbar.

---

## 🛠 Beispiel für Backend-Anfrage

```ts
const apiKey = process.env.OPENAI_API_KEY;
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
const aiResult = openaiData.choices?.[0]?.message?.content?.trim() || "";
```

---

## 🧪 Debugging
Bei Problemen prüfe:
- Ist der API-Key korrekt?
- Gibt es Fehlermeldungen im Server-Log?
- Hat der Server Internetzugang?

---

## 📌 Hinweis

- **Optional:** Die KI-Textvorschläge können in der Konfiguration deaktiviert werden.
- **Zugriff:** Standardmäßig nur für Admins und Nutzer mit aktivem Abo **und** ausreichend Kontingent (includedRequests).
- **Quota-Prüfung:** Jede KI-Anfrage wird serverseitig geprüft und geloggt (Tabelle `AiRequest`).
- **Sperre:** Ist das Kontingent aufgebraucht oder der Account gesperrt, sind keine KI-Anfragen mehr möglich.
- **Kosten:** Die Nutzung kann Kosten verursachen – beachte die Limits deines OpenAI-Accounts und deines Abosystems.
