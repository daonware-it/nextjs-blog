import type { NextApiRequest, NextApiResponse } from 'next';
import { highlightCodeServer } from '@/lib/highlightServer';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code, language } = req.body;
  if (typeof code !== 'string' || typeof language !== 'string') {
    res.status(400).json({ error: 'code und language müssen Strings sein.' });
    return;
  }
  const highlightedCode = highlightCodeServer(code, language);
  res.status(200).json({ highlightedCode });
}
