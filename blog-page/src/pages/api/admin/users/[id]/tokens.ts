import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import authOptions from '../../../auth/[...nextauth]';
import { createAuditLog } from '@/lib/auditLogUtils';

interface Session {
  user: {
    id: number;
    email: string;
    role: string;
  };
  expires: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Admin-Rechte prüfen
  const session = await getServerSession(req, res, authOptions) as Session | null;
  if (!session || session.user?.role !== 'ADMIN') {
    return res.status(401).json({ error: 'Nicht autorisiert' });
  }

  const userId = parseInt(req.query.id as string, 10);
  
  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Ungültige Benutzer-ID' });
  }

  if (req.method === 'PUT') {
    try {
      const { tokens, userStatus } = req.body;
      
      if (typeof tokens !== 'number' || tokens < 0) {
        return res.status(400).json({ error: 'Ungültiger Token-Wert' });
      }

      // Prüfen, ob der Benutzer existiert
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({ error: 'Benutzer nicht gefunden' });
      }
      
      // Wenn der Benutzerstatus mitgesendet wurde, aktualisieren wir auch diesen
      if (userStatus && ['ACTIVE', 'PENDING', 'BANNED'].includes(userStatus)) {
        await prisma.user.update({
          where: { id: userId },
          data: { 
            //@ts-ignore - Das status-Feld existiert im Schema, aber TypeScript erkennt es nicht korrekt
            status: userStatus 
          }
        });
      }

      // Prüfen, ob der Benutzer ein Abonnement hat (aktiv oder inaktiv)
      const subscription = await prisma.userSubscription.findFirst({
        where: { 
          userId: userId
        },
        orderBy: { startedAt: 'desc' }
      });

      if (!subscription) {
        // Kein Abonnement vorhanden, ein neues erstellen
        const defaultPlan = await prisma.subscriptionPlan.findFirst();

        if (!defaultPlan) {
          return res.status(500).json({ error: 'Kein Abonnementplan gefunden' });
        }

        // Neues Abonnement erstellen mit den angegebenen Tokens
        await prisma.userSubscription.create({
          data: {
            userId: userId,
            planId: defaultPlan.id,
            isActive: true,
            includedRequests: tokens
          }
        });
        
        // Audit-Log für die Erstellung eines neuen Abonnements erstellen
        await createAuditLog({
          userId: userId,
          adminId: session.user.id,
          action: 'SUBSCRIPTION_CREATE',
          details: `Neues Abonnement erstellt (${defaultPlan.name})`,
          oldValue: 'Kein Abonnement',
          newValue: `Plan: ${defaultPlan.name}, Tokens: ${tokens}`
        });
        
        // Benachrichtigung für neues Abonnement mit Tokens
        await prisma.notification.create({
          data: {
            userId: userId,
            message: `Ein Administrator hat Ihnen ein Abonnement mit ${tokens} Tokens zugeteilt.`,
            type: 'success',
            read: false
          }
        });
      } else {
        // Alten Token-Wert merken
        const oldTokens = subscription.includedRequests || 0;
        
        // Bestehendes Abonnement aktualisieren
        await prisma.userSubscription.update({
          where: { id: subscription.id },
          data: { 
            includedRequests: tokens,
            // Wir stellen sicher, dass das Abonnement aktiv ist, wenn Tokens gesetzt werden
            isActive: true
          }
        });
        
        // Audit-Log für die Token-Aktualisierung
        await createAuditLog({
          userId: userId,
          adminId: session.user.id,
          action: 'TOKEN_UPDATE',
          details: `Token-Anzahl aktualisiert`,
          oldValue: oldTokens.toString(),
          newValue: tokens.toString()
        });
        
        // Benachrichtigung über Token-Änderung
        const tokenDiff = tokens - oldTokens;
        let message: string;
        let type: string;

        if (tokenDiff > 0) {
          message = `Ein Administrator hat Ihnen ${tokenDiff} zusätzliche Tokens zugeteilt. Neue Gesamtanzahl: ${tokens}`;
          type = 'success';
        } else if (tokenDiff < 0) {
          message = `Ein Administrator hat Ihre verfügbaren Tokens um ${Math.abs(tokenDiff)} reduziert. Neue Gesamtanzahl: ${tokens}`;
          type = 'warning';
        } else {
          message = `Ein Administrator hat Ihre Tokens aktualisiert. Neue Gesamtanzahl: ${tokens}`;
          type = 'info';
        }
        
        await prisma.notification.create({
          data: {
            userId: userId,
            message,
            type,
            read: false
          }
        });
      }

      return res.status(200).json({ 
        success: true,
        message: 'Tokens erfolgreich aktualisiert',
        tokens: tokens
      });
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Tokens:', error);
      return res.status(500).json({ 
        error: 'Interner Serverfehler',
        message: error instanceof Error ? error.message : 'Unbekannter Fehler'
      });
    }
  }

  return res.status(405).json({ error: 'Methode nicht erlaubt' });
}
