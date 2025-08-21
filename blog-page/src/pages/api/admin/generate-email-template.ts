import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { subject, greeting, maintext, buttontext, design, prompt: customPrompt } = req.body;

  let prompt = customPrompt;
  if (!prompt) {
    if (!subject || !greeting || !maintext || !buttontext || !design) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    prompt = `Erstelle ein HTML-E-Mail-Template im Design '${design}' mit folgendem Inhalt:\nBetreff: ${subject}\nBegrüßung: ${greeting}\nHaupttext: ${maintext}\nButton-Text: ${buttontext}\nNutze die Platzhalter {{displayName}}, {{resetLink}}, {{code}}.`;
  }

  let template = '';
  let error = '';

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1200,
      temperature: 0.7,
    });
    template = completion.choices[0]?.message?.content || '';
  } catch (e: any) {
    error = e?.message || 'Fehler bei der KI-Anfrage';
    template = `<html><body><h2>${subject || ''}</h2><p>${greeting || ''}<br>${maintext || ''}</p><a href='{{resetLink}}'>${buttontext || ''}</a><div>Platzhalter: {{displayName}}, {{code}}</div></body></html>`;
  }

  return res.status(200).json({ prompt, template, error });
}
