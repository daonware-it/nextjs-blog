import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from 'lib/prisma';
import { getAdminSession } from 'src/lib/authHelpers';
import { createAuditLog } from 'src-lib/auditLogUtils';
import { hasBlockedTokens } from 'src-lib/tokenBlockHelpers';

function getNotificationMessageAndType(user: any, req: NextApiRequest): { message: string; type: string } {
  const hasActiveSubscription = user.subscriptions.length > 0;
  const isActive = hasActiveSubscription && user.subscriptions[0].isActive;
  const tokensBlocked = hasActiveSubscription && hasBlockedTokens(user.subscriptions[0]);

  // Benutzerdefinierte Nachricht und Typ direkt berücksichtigen
  const customMessage = req.body.message;
  const customType = req.body.type;
  let message: string;
  let type: string = 'info';

  if (customMessage) {
    message = customMessage;
  } else if (tokensBlocked) {
    message = 'Deine KI-Tokens sind derzeit gesperrt. Bitte kontaktiere den Support für weitere Informationen.';
  } else if (!isActive) {
    message = 'Dein Abonnement ist derzeit inaktiv. Bitte kontaktiere den Support für weitere Informationen.';
  } else {
    const tokenCount = user.subscriptions[0].includedRequests ?? 0;
    message = `Deine KI-Tokens sind aktiv. Du hast derzeit ${tokenCount} Anfragen verfügbar.`;
  }

  if (customType && ['info', 'success', 'warning', 'error'].includes(customType)) {
    type = customType;
  } else if (tokensBlocked || !isActive) {
    type = 'warning';
  }

  return { message, type };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Cache-Header setzen
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  // Admin-Rechte prüfen
  const session = await getAdminSession(req, res);
  if (!session) {
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
      // Nachricht und Typ generieren
      const { message, type } = getNotificationMessageAndType(user, req);

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
          hasActiveSubscription: user.subscriptions.length > 0,
          isActive: user.subscriptions.length > 0 && user.subscriptions[0].isActive,
          tokensBlocked: user.subscriptions.length > 0 && hasBlockedTokens(user.subscriptions[0]),
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
