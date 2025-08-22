import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { getTicketStats } from '../../../admin/ticket-stats';

// API-Route für Ticket-Statistiken
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Sitzungsinformationen abrufen
    const session = await getServerSession(req, res, authOptions);
    
    // Statistiken abrufen mit der Hilfsfunktion
    const stats = await getTicketStats(session);
    
    // Wenn Fehler vorhanden, entsprechenden Status zurückgeben
    if ('error' in stats) {
      return res.status(403).json(stats);
    }
    
    // Statistikdaten zurückgeben
    res.status(200).json(stats);
    
  } catch (error) {
    console.error('Fehler beim Abrufen der Ticket-Statistiken:', error);
    res.status(500).json({ 
      error: 'Server-Fehler beim Abrufen der Ticket-Statistiken',
      message: error instanceof Error ? error.message : 'Unbekannter Fehler'
    });
  }
}
