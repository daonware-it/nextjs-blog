import { Session } from 'next-auth';
import prisma from '../../lib/prisma';

/**
 * Funktion zum Abrufen der Dashboard-Statistiken
 * @param session Aktuelle Benutzersitzung
 * @returns Dashboard-Statistiken als Objekt
 */
export async function getDashboardStats(session: Session | null) {
  try {
    // Prufen, ob der Benutzer angemeldet und berechtigt ist
    if (!session || !session.user || !['ADMIN', 'MODERATOR', 'BLOGGER'].includes(session.user.role as string)) {
      return { error: 'Nicht autorisiert' };
    }
    
    // Jetziges Datum und Datum vor einem Monat
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    // Benutzerstatistik
    let totalUsers = 0;
    try {
      // Alle Benutzer zählen, unabhängig vom Status
      totalUsers = await prisma.user.count();
    } catch (userCountError) {
      console.error('Fehler bei Benutzerabfrage:', userCountError);
    }
    
    let newUsers = 0;
    try {
      newUsers = await prisma.user.count({
        where: {
          createdAt: {
            gt: oneMonthAgo
          }
        }
      });
    } catch (newUserCountError) {
      console.error('Fehler bei Abfrage neuer Benutzer:', newUserCountError);
    }
    
    // Blogbeitragsstatistik: Veröffentlicht aus BlockDraft
    let totalPosts = 0;
    let newPosts = 0;
    try {
      totalPosts = await prisma.blockDraft.count({
        where: { status: 'VEROEFFENTLICHT', deleteAt: null }
      });
      newPosts = await prisma.blockDraft.count({
        where: {
          status: 'VEROEFFENTLICHT',
          deleteAt: null,
          updatedAt: { gt: oneMonthAgo }
        }
      });
    } catch (postCountError) {
      console.error('Fehler bei BlockDraft-Post-Abfragen:', postCountError);
    }
    
    // BlockDraft-Statistiken
    let totalBlockDrafts = 0;
    let unveroffentlichteBlockDrafts = 0;
    
    try {
      // Gesamtzahl der BlockDrafts ermitteln
      totalBlockDrafts = await prisma.blockDraft.count();
      
      // Anzahl der veroeffentlichten BlockDrafts ermitteln
      const veroffentlichteAnzahl = await prisma.blockDraft.count({
        where: {
          status: 'VEROEFFENTLICHT'
        }
      });
      
      // Alles was nicht veroeffentlicht ist, ist unveroffentlicht
      unveroffentlichteBlockDrafts = totalBlockDrafts - veroffentlichteAnzahl;
      
    } catch (blockDraftError) {
      console.error('Fehler bei BlockDraft-Abfragen:', blockDraftError);
    }
    
    // Kommentar-Statistiken (Da es keine dedizierte Kommentar-Tabelle gibt, 
    // verwenden wir Platzhalter-Werte, bis ein Kommentarsystem implementiert ist)
    const commentCount = 0; // Platzhalter
    const unmoderatedComments = 0; // Platzhalter
    
    // Benachrichtigungen als Annaeherung fuer Besucheraktivitaet
    let totalNotifications = 0;
    let recentNotifications = 0;
    try {
      totalNotifications = await prisma.notification.count();
      
      recentNotifications = await prisma.notification.count({
        where: {
          createdAt: {
            gt: oneMonthAgo
          }
        }
      });
    } catch (notificationError) {
      console.error('Fehler bei Benachrichtigungs-Abfragen:', notificationError);
    }
    
    // Prozentsatz der Steigerung berechnen
    const userGrowthPercent = totalUsers > 0 
      ? Math.round((newUsers / totalUsers) * 100) 
      : 0;
    
    const visitorGrowthPercent = totalNotifications > 0 
      ? Math.round((recentNotifications / totalNotifications) * 100) 
      : 0;
    
    // Statistikdaten zuruckgeben
    return {
      userCount: totalUsers, // explizit als "Alle Benutzer"
      userGrowth: `+${userGrowthPercent}%`,
      blogPostCount: totalPosts,
      newBlogPosts: newPosts,
      commentCount: commentCount,
      unmoderatedComments: unmoderatedComments,
      visitorCount: totalNotifications,
      visitorGrowth: `+${visitorGrowthPercent}%`,
      blockDraftCount: totalBlockDrafts,
      unmoderatedBlockDrafts: unveroffentlichteBlockDrafts // Korrekter Wert fuer unveroffentlichte BlockDrafts
    };
    
  } catch (error) {
    console.error('Fehler beim Abrufen der Dashboard-Statistiken:', error);
    return { 
      error: 'Fehler beim Abrufen der Statistiken',
      message: error instanceof Error ? error.message : 'Unbekannter Fehler'
    };
  }
}
