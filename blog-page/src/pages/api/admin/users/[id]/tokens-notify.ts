import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../../../lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]';
import { createAuditLog } from '../../../../../lib/auditLogUtils';
import { hasBlockedTokens } from '../../../../../lib/tokenBlockHelpers';

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

  if (req.method === 'POST') {
    try {
      // Prüfen, ob der Benutzer existiert
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          subscriptions: {
            where: { isActive: true },
            orderBy: { startedAt: 'desc' },
            take: 1
          }
        }
      });

      if (!user) {
        return res.status(404).json({ error: 'Benutzer nicht gefunden' });
      }
      
      // Token-Status prüfen
      const hasActiveSubscription = user.subscriptions.length > 0;
      const isActive = hasActiveSubscription && user.subscriptions[0].isActive;
      const tokensBlocked = hasActiveSubscription && hasBlockedTokens(user.subscriptions[0]);
      
      // Nachricht basierend auf dem Status generieren
      let message;
      let type = 'info';
      
      if (tokensBlocked) {
        message = 'Deine KI-Tokens sind derzeit gesperrt. Bitte kontaktiere den Support für weitere Informationen.';
        type = 'warning';
      } else if (!isActive) {
        message = 'Dein Abonnement ist derzeit inaktiv. Bitte kontaktiere den Support für weitere Informationen.';
        type = 'warning';
      } else {
        const tokenCount = user.subscriptions[0].includedRequests ?? 0;
        message = `Deine KI-Tokens sind aktiv. Du hast derzeit ${tokenCount} Anfragen verfügbar.`;
      }
      
      // Benutzerdefinierte Nachricht verwenden, wenn vorhanden
      const customMessage = req.body.message;
      if (customMessage) {
        message = customMessage;
      }
      
      // Benutzerdefinierter Typ verwenden, wenn vorhanden
      const customType = req.body.type;
      if (customType && ['info', 'success', 'warning', 'error'].includes(customType)) {
        type = customType;
      }
      
      // Benachrichtigung erstellen
      const notification = await prisma.notification.create({
        data: {
          userId: userId,
          message,
          type,
          read: false
        }
      });


      // Audit-Log erstellen (message absichern)
      let safeMessage = typeof message === 'string' ? message : String(message);
      await createAuditLog({
        userId: userId,
        adminId: parseInt((session.user as any).id, 10),
        action: 'TOKEN_UPDATE',
        details: `Admin hat Benachrichtigung über Token-Status gesendet: ${safeMessage.substring(0, 100)}${safeMessage.length > 100 ? '...' : ''}`,
      });

      return res.status(200).json({ 
        success: true,
        notification,
        tokenStatus: {
          hasActiveSubscription,
          isActive,
          tokensBlocked
        }
      });
    } catch (error) {
      console.error('Fehler beim Erstellen der Benachrichtigung:', error);
      return res.status(500).json({ 
        error: 'Interner Serverfehler',
        message: error instanceof Error ? error.message : 'Unbekannter Fehler'
      });
    }
  }

  return res.status(405).json({ error: 'Methode nicht erlaubt' });
}
