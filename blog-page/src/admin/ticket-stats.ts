import { Session } from 'next-auth';

export async function getTicketStats(session: Session | null) {
  try {
    if (!session || !session.user || !['ADMIN', 'MODERATOR'].includes(session.user.role as string)) {
      return { error: 'Nicht autorisiert' };
    }
    
    const openTickets = 0;
    const inProgressTickets = 0;
    const closedTickets = 0;
    
    return {
      openTickets,
      inProgressTickets,
      closedTickets
    };
  } catch (error) {
    console.error('Fehler beim Abrufen der Ticket-Statistiken:', error);
    return { 
      error: 'Fehler beim Abrufen der Ticket-Statistiken',
      message: error instanceof Error ? error.message : 'Unbekannter Fehler'
    };
  }
}