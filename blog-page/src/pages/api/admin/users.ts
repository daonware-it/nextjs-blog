import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '../../../../lib/prisma';
import { Prisma } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Session prüfen
  const session = await getServerSession(req, res, authOptions);
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
    return res.status(401).json({ error: 'Nicht autorisiert' });
  }

  if (req.method === 'GET') {
    try {
      // Parameter auslesen
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const role = req.query.role as string || '';
      const sortBy = req.query.sortBy as string || 'newest';
      const status = req.query.status as string || '';

      // Filter erstellen
      const filter: any = {};
      if (role) {
        filter.role = role;
      }

      // Status-Filter (wird später auf die Status-Rohdaten angewendet)
      let statusFilter = null;
      if (status) {
        statusFilter = status;
      }
      
      // Sortierung festlegen
      let orderBy: any = {};
      switch (sortBy) {
        case 'oldest':
          orderBy = { createdAt: 'asc' };
          break;
        case 'a-z':
          orderBy = { username: 'asc' };
          break;
        case 'z-a':
          orderBy = { username: 'desc' };
          break;
        case 'newest':
        default:
          orderBy = { createdAt: 'desc' };
      }
      
      // Benutzer aus der Datenbank abfragen
      const users = await prisma.user.findMany({
        where: filter,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          createdAt: true
        }
      });

      // Statusdaten manuell hinzufügen, da das Prisma-Typensystem mit dem neuen Feld noch Probleme hat
      // Raw-Abfrage für den Status ausführen
      let userIds = users.map(user => user.id);
      let statusRows: any[] = [];
      if (userIds.length > 0) {
        if (statusFilter) {
          statusRows = await prisma.$queryRaw`
            SELECT id, status FROM "User" WHERE id IN (${Prisma.join(userIds)}) AND status = ${statusFilter}
          `;
        } else {
          statusRows = await prisma.$queryRaw`
            SELECT id, status FROM "User" WHERE id IN (${Prisma.join(userIds)})
          `;
        }
      }

      // Status-Map erstellen
      const statusMap = {};
      (statusRows as any[]).forEach(row => {
        statusMap[row.id] = row.status;
      });

      // Status zu den Benutzerdaten hinzufügen und ggf. nach Status filtern
      let usersWithStatus = users.map(user => ({
        ...user,
        status: statusMap[user.id] || 'ACTIVE'
      }));
      if (statusFilter) {
        usersWithStatus = usersWithStatus.filter(user => user.status === statusFilter);
      }
      
      // Gesamtzahl der Benutzer ermitteln (mit Status-Filter)
      const total = usersWithStatus.length;

      return res.status(200).json({
        users: usersWithStatus,
        total,
        page,
        pageSize
      });
    } catch (error) {
      console.error('Fehler beim Abrufen der Benutzer:', error);
      return res.status(500).json({ error: 'Interner Serverfehler' });
    }
  } else if (req.method === 'PATCH') {
    try {
      const { userId, active } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: 'Benutzer-ID ist erforderlich' });
      }
      
      if (active !== undefined) {
        // Benutzer suchen
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true }
        });
        
        if (!user) {
          return res.status(404).json({ error: 'Benutzer nicht gefunden' });
        }
        
        // Status in der Datenbank aktualisieren mit einer Raw-Query, um Typprobleme zu umgehen
        const newStatus = active ? 'ACTIVE' : 'BANNED';
        await prisma.$executeRaw`UPDATE "User" SET status = ${newStatus} WHERE id = ${userId}`;
        
        return res.status(200).json({ 
          success: true, 
          message: `Benutzerstatus auf ${active ? 'aktiv' : 'gesperrt'} gesetzt`,
          status: newStatus,
          userId: userId
        });
      }
      
      return res.status(400).json({ error: 'Keine gültigen Aktualisierungsdaten angegeben' });
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Benutzers:', error);
      return res.status(500).json({ error: 'Interner Serverfehler' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { id, username, email, role, status, originalUsername, originalEmail, originalRole, originalStatus } = req.body;
      
      if (!id) {
        return res.status(400).json({ error: 'Benutzer-ID ist erforderlich' });
      }
      
      // Prüfen, ob der Benutzer existiert
      const existingUser = await prisma.user.findUnique({
        where: { id },
        select: { id: true, username: true, email: true, role: true }
      });
      
      if (!existingUser) {
        return res.status(404).json({ error: 'Benutzer nicht gefunden' });
      }
      
      // Aktualisiere Benutzerdaten (außer Status)
      await prisma.user.update({
        where: { id },
        data: {
          username,
          email,
          role
        }
      });
      
      // Status manuell mit Raw-Query aktualisieren
      if (status) {
        await prisma.$executeRaw`UPDATE "User" SET status = ${status} WHERE id = ${id}`;
      }

      // Erstelle Audit-Log-Einträge für geänderte Felder
      const adminId = parseInt((session.user as any).id, 10);

      // Überprüfe, ob sich der Benutzername geändert hat
      if (username !== (originalUsername || existingUser.username)) {
        await prisma.auditLog.create({
          data: {
            userId: id,
            adminId,
            action: 'USER_UPDATE',
            details: 'Benutzername geändert',
            oldValue: originalUsername || existingUser.username,
            newValue: username
          }
        });
      }

      // Überprüfe, ob sich die E-Mail geändert hat
      if (email !== (originalEmail || existingUser.email)) {
        await prisma.auditLog.create({
          data: {
            userId: id,
            adminId,
            action: 'USER_UPDATE',
            details: 'E-Mail geändert',
            oldValue: originalEmail || existingUser.email,
            newValue: email
          }
        });
      }

      // Überprüfe, ob sich die Rolle geändert hat
      if (role !== (originalRole || existingUser.role)) {
        await prisma.auditLog.create({
          data: {
            userId: id,
            adminId,
            action: 'ROLE_CHANGE',
            details: 'Benutzerrolle geändert',
            oldValue: originalRole || existingUser.role,
            newValue: role
          }
        });
      }

      // Überprüfe, ob sich der Status geändert hat
      if (status && status !== originalStatus) {
        await prisma.auditLog.create({
          data: {
            userId: id,
            adminId,
            action: 'STATUS_CHANGE',
            details: 'Benutzerstatus geändert',
            oldValue: originalStatus || 'ACTIVE',
            newValue: status
          }
        });
      }
      
      return res.status(200).json({
        success: true,
        message: 'Benutzerdaten erfolgreich aktualisiert'
      });
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Benutzers:', error);
      return res.status(500).json({ error: 'Interner Serverfehler' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: 'Benutzer-ID ist erforderlich' });
      }
      
      await prisma.user.delete({
        where: { id: userId }
      });
      
      return res.status(200).json({ success: true, message: 'Benutzer erfolgreich gelöscht' });
    } catch (error) {
      console.error('Fehler beim Löschen des Benutzers:', error);
      return res.status(500).json({ error: 'Interner Serverfehler' });
    }
  } else {
    return res.status(405).json({ error: 'Methode nicht erlaubt' });
  }
}
