import type { NextApiRequest, NextApiResponse } from 'next';
import { highlightCodeServer } from '../../lib/highlightServer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, language } = req.body;

  if (!code || !language) {
    return res.status(400).json({ error: 'Code and language are required' });
  }

  try {
    const highlightedCode = highlightCodeServer(code, language);
    res.status(200).json({ highlightedCode });
  } catch (error) {
    res.status(500).json({ error: 'Failed to highlight code' });
  }
}
