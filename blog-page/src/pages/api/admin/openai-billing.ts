import type { NextApiRequest, NextApiResponse } from 'next';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function fetchOpenAIBalance() {
  const res = await fetch('https://api.openai.com/dashboard/billing/credit_grants', {
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    const text = await res.text();
    console.error('OpenAI Balance Response:', text);
    throw new Error('Fehler beim Abrufen des Guthabens');
  }
  return await res.json();
}

async function fetchOpenAIUsage(start: string, end: string) {
  const res = await fetch(`https://api.openai.com/dashboard/billing/usage?start_date=${start}&end_date=${end}`, {
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    const text = await res.text();
    console.error('OpenAI Usage Response:', text);
    throw new Error('Fehler beim Abrufen des Verbrauchs');
  }
  return await res.json();
}

async function fetchOpenAIModels() {
  const res = await fetch('https://api.openai.com/v1/models', {
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    const text = await res.text();
    console.error('OpenAI Models Response:', text);
    throw new Error('Fehler beim Abrufen der Modelle');
  }
  return await res.json();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const models = await fetchOpenAIModels();
    return res.status(200).json({
      info: 'OpenAI stellt keine API für Guthaben/Verbrauch mit API-Key bereit. Bitte prüfen Sie Ihr Guthaben und den Verbrauch direkt im OpenAI-Dashboard.',
      models: models.data || []
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Fehler beim Abrufen der OpenAI-Modelle' });
  }
}
