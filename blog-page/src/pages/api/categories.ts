import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const categories = await prisma.category.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    });

    // Sicherstellen, dass die ID als String zurückgegeben wird
    const formattedCategories = categories.map(cat => ({
      id: String(cat.id),
      name: cat.name
    }));

    res.status(200).json(formattedCategories);
  } catch (error) {
    console.error('Fehler beim Abrufen der Kategorien:', error);
    res.status(500).json({ error: 'Failed to fetch categories', details: error instanceof Error ? error.message : String(error) });
  }
}
