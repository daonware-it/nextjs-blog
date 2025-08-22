import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import prisma from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Cache-Control-Header setzen, um Caching zu verhindern
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    
    // Session überprüfen
    const session = await getServerSession(req, res, authOptions);
    
    if (!session || !session.user) {
      return res.status(200).json({ notifications: [], newNotifications: false });
    }
    
    const userId = parseInt((session.user as any).id, 10);
    
    if (isNaN(userId)) {
      return res.status(200).json({ notifications: [], newNotifications: false });
    }
    
    // Letzter Abruf-Timestamp, falls in der Anfrage enthalten
    const lastCheck = req.query.lastCheck ? new Date(String(req.query.lastCheck)) : null;
    
    // Wenn lastCheck nicht gültig ist, alle Benachrichtigungen abrufen
    let notifications;
    let newNotifications = false;
    
    if (lastCheck && !isNaN(lastCheck.getTime())) {
      // Prüfen, ob es neue Benachrichtigungen seit dem letzten Abruf gibt
      const count = await prisma.notification.count({
        where: {
          userId,
          createdAt: {
            gt: lastCheck
          }
        }
      });
      
      // Wenn es neue Benachrichtigungen gibt, alle abrufen
      if (count > 0) {
        newNotifications = true;
        notifications = await prisma.notification.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' }
        });
      } else {
        // Wenn keine neuen Benachrichtigungen, leere Liste zurückgeben
        notifications = [];
      }
    } else {
      // Wenn kein lastCheck, alle Benachrichtigungen abrufen
      notifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });
      
      // Wenn es Benachrichtigungen gibt, als neu markieren
      if (notifications.length > 0) {
        newNotifications = true;
      }
    }
    
    return res.status(200).json({ 
      notifications: newNotifications ? notifications : [], 
      newNotifications,
      currentTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('Fehler beim Abrufen der Benachrichtigungen:', error);
    return res.status(200).json({ notifications: [], newNotifications: false });
  }
}
