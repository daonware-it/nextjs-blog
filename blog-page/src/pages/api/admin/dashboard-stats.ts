import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import authOptions from '../auth/[...nextauth]';
import { getDashboardStats } from '@/admin/dashboard-stats';
import { Session } from "next-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions) as Session | null;

    // Statistiken abrufen mit der Hilfsfunktion
    const stats = await getDashboardStats(session);
    
    // Wenn Fehler vorhanden, entsprechenden Status zurückgeben
    if ('error' in stats) {
      return res.status(403).json(stats);
    }
    
    // Statistikdaten zurückgeben
    return res.status(200).json(stats);
  } catch (error) {
    console.error('Fehler beim Abrufen der Dashboard-Statistiken:', error);
    res.status(500).json({ 
      error: 'Server-Fehler beim Abrufen der Statistiken',
      message: error instanceof Error ? error.message : 'Unbekannter Fehler'
    });
  }
}
