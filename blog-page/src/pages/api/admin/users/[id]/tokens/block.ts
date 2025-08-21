import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../../../../lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../auth/[...nextauth]';
import { createAuditLog } from '../../../../../../lib/auditLogUtils';
import { hasBlockedTokens, setTokenBlockStatus, createSubscriptionWithTokenStatus } from '../../../../../../lib/tokenBlockHelpers';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Cache-Header setzen
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  // Admin-Rechte prüfen
  const session = await getServerSession(req, res, authOptions);
  
  if (!session || session.user?.role !== 'ADMIN') {
    return res.status(401).json({ error: 'Nicht autorisiert' });
  }

  const userId = parseInt(req.query.id as string, 10);
  
  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Ungültige Benutzer-ID' });
  }

  // GET-Methode zum Abrufen des aktuellen Sperrstatus
  if (req.method === 'GET') {
    // Aktives Abonnement prüfen
    const activeSubscription = await prisma.userSubscription.findFirst({
      where: {
        userId: userId
      },
      orderBy: {
        startedAt: 'desc'
      }
    });

    // Wenn kein Abonnement existiert, Tokens sind nicht gesperrt
    if (!activeSubscription) {
      return res.status(200).json({
        blocked: false
      });
    }

    // Prüfen, ob isActive=false oder tokensBlocked=true ist
    const isBlocked = !activeSubscription.isActive || hasBlockedTokens(activeSubscription);
    
    return res.status(200).json({
      blocked: isBlocked
    });
  }

  // POST-Methode zum Aktualisieren des Sperrstatus
  if (req.method === 'POST') {
    try {
      const { block } = req.body;
      
      if (typeof block !== 'boolean') {
        return res.status(400).json({ error: 'Ungültiger Wert für block. Erwartet wird true oder false.' });
      }

      // Prüfen, ob der Benutzer existiert
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({ error: 'Benutzer nicht gefunden' });
      }

      // Neuestes Abonnement finden
      const subscription = await prisma.userSubscription.findFirst({
        where: {
          userId: userId
        },
        orderBy: {
          startedAt: 'desc'
        }
      });

      let updatedSubscription;

      if (subscription) {
        // Den vorherigen Status speichern für das Audit-Log
        const wasBlocked = hasBlockedTokens(subscription);
        
        // Abonnement aktualisieren - tokensBlocked=true/false setzen
        updatedSubscription = await setTokenBlockStatus(prisma, subscription.id, block);
        
        // Audit-Log für die Statusänderung erstellen
        await createAuditLog({
          userId: userId,
          adminId: parseInt((session.user as any).id, 10),
          action: block ? 'TOKEN_BLOCK' : 'TOKEN_UNBLOCK',
          details: block ? 'Token-Nutzung gesperrt' : 'Token-Nutzung freigegeben',
          oldValue: wasBlocked ? 'Gesperrt' : 'Freigegeben',
          newValue: block ? 'Gesperrt' : 'Freigegeben'
        });
      } else {
        // Falls kein Abonnement existiert, ein neues erstellen
        const defaultPlan = await prisma.subscriptionPlan.findFirst({
          where: { name: 'Free' }
        });
        
        if (!defaultPlan) {
          return res.status(500).json({ error: 'Standard-Plan nicht gefunden' });
        }
        
        updatedSubscription = await createSubscriptionWithTokenStatus(
          prisma,
          userId,
          defaultPlan.id,
          true, // isActive
          block, // tokensBlocked
          block ? 0 : defaultPlan.includedRequests // includedRequests
        );
        
        // Audit-Log für die Erstellung eines neuen Abonnements
        await createAuditLog({
          userId: userId,
          adminId: parseInt((session.user as any).id, 10),
          action: 'SUBSCRIPTION_CREATE',
          details: `Neues Abonnement erstellt und Token-Nutzung ${block ? 'gesperrt' : 'freigegeben'}`,
          oldValue: 'Kein Abonnement',
          newValue: `Plan: ${defaultPlan.name}, Tokens: ${block ? 'gesperrt' : 'freigegeben'}`
        });
      }
      
      // Benachrichtigung für den Benutzer erstellen
      await prisma.notification.create({
        data: {
          userId: userId,
          message: block 
            ? 'Deine KI-Tokens wurden von einem Administrator gesperrt. Bitte kontaktiere den Support für weitere Informationen.'
            : 'Deine KI-Tokens wurden entsperrt und stehen wieder zur Verfügung.',
          type: block ? 'warning' : 'success',
          read: false
        }
      });

      return res.status(200).json({ 
        success: true,
        message: block ? 'Tokens erfolgreich gesperrt' : 'Tokens erfolgreich freigegeben',
        subscription: updatedSubscription
      });
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Token-Sperrstatus:', error);
      return res.status(500).json({ 
        error: 'Interner Serverfehler',
        message: error instanceof Error ? error.message : 'Unbekannter Fehler'
      });
    }
  }

  return res.status(405).json({ error: 'Methode nicht erlaubt' });
}
