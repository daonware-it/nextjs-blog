import { getUserFromSession } from "@/lib/apiUtils";
import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { createAuditLog } from "src-lib/auditLogUtils";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUserFromSession(req, res);
  if (!user) return;

  if (req.method === "GET") {
    const { id } = req.query;
    let draft: Awaited<ReturnType<typeof prisma.blockDraft.findUnique>> | null = null;
    if (id) {
      draft = await prisma.blockDraft.findUnique({
        where: { id: Number(id) },
        include: {
          coAuthor: {
            select: { id: true, username: true, name: true, role: true }
          }
        }
      });
      if (draft && draft.userId !== Number(user.id)) draft = null;
    }
    return res.status(200).json(draft || null);
  }

  if (req.method === "DELETE") {
    try {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: "ID fehlt" });
      const draft = await prisma.blockDraft.findUnique({ where: { id: Number(id) } });
      if (!draft || draft.userId !== Number(user.id)) return res.status(404).json({ error: "Entwurf nicht gefunden" });
      await prisma.blockDraft.update({
        where: { id: Number(id) },
        data: { status: 'NICHT_OEFFENTLICH', deleteAt: new Date() }
      });

      // AuditLog je nach Status
      if (draft.status === 'VEROEFFENTLICHT') {
        await createAuditLog({
          userId: Number(user.id),
          action: 'POST_DELETE',
          details: `Veröffentlichter Beitrag gelöscht: "${draft.title || 'Ohne Titel'}" am ${new Date().toLocaleString('de-DE')}`,
          oldValue: `ID: ${id}`,
          newValue: null
        });
      } else {
        await createAuditLog({
          userId: Number(user.id),
          action: 'BLOCK_DRAFT_DELETE',
          details: `Entwurf (ID: ${id}) gelöscht`,
          oldValue: `ID: ${id}`
        });
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Fehler beim Soft-Delete:', error);
      return res.status(500).json({ error: "Fehler beim Löschen" });
    }
  }

  if (req.method === "PATCH") {
    try {
      const { id, restore, status, lock } = req.body;
      if (!id) return res.status(400).json({ error: "ID fehlt" });
      const draft = await prisma.blockDraft.findUnique({ where: { id: Number(id) } });
      if (!draft) return res.status(404).json({ error: "Entwurf nicht gefunden" });

      // Wiederherstellen
      if (restore) {
        await prisma.blockDraft.update({
          where: { id: Number(id) },
          data: { deleteAt: null }
        });
        return res.status(200).json({ success: true });
      }

      // Beitrag sperren/entsperren
      if (typeof lock === 'boolean' && draft.locked !== lock) {
        let updateData: any = { locked: lock };
        // Wenn gesperrt wird, Status auf NICHT_OEFFENTLICH setzen
        if (lock) {
          updateData.status = 'NICHT_OEFFENTLICH';
        }
        const updatedDraft = await prisma.blockDraft.update({
          where: { id: Number(id) },
          data: updateData
        });
        await createAuditLog({
          userId: draft.userId,
          adminId: Number(user.id),
          action: lock ? 'BLOCK_DRAFT_LOCK' : 'BLOCK_DRAFT_UNLOCK',
          details: `Beitrag (ID: ${id}, Titel: ${draft.title || 'Ohne Titel'}) wurde ${lock ? 'gesperrt' : 'freigegeben'} von ${user.name || user.username || user.email}`,
          oldValue: draft.locked ? 'gesperrt' : 'frei',
          newValue: lock ? 'gesperrt' : 'frei'
        });
        // Benachrichtigung an den Beitragsersteller
        await prisma.notification.create({
          data: {
            userId: draft.userId,
            message: lock
              ? `Dein Beitrag "${draft.title || 'Ohne Titel'}" wurde von einem Admin gesperrt.`
              : `Dein Beitrag "${draft.title || 'Ohne Titel'}" wurde von einem Admin wieder freigegeben (entsperrt).`,
            type: lock ? 'warning' : 'info'
          }
        });
        return res.status(200).json({ success: true, draft: updatedDraft });
      }

      // Statusänderung durch Admin
      if (typeof status === 'string' && draft.status !== status) {
        // Prisma erwartet das Enum explizit
        const updatedDraft = await prisma.blockDraft.update({
          where: { id: Number(id) },
          data: { status: status as any }
        });
        // Auditlog für Statusänderung
        await createAuditLog({
          userId: Number(user.id),
          action: 'BLOCK_DRAFT_STATUS_CHANGE',
          details: `Status von BlockDraft (ID: ${id}, Titel: ${draft.title || 'Ohne Titel'}) geändert: ${draft.status} → ${status}`,
          oldValue: draft.status,
          newValue: status
        });
        return res.status(200).json({ success: true, draft: updatedDraft });
      }

      // Keine Änderung
      return res.status(400).json({ error: "Keine Änderung durchgeführt" });
    } catch (error) {
      console.error('Fehler beim PATCH:', error);
      return res.status(500).json({ error: "Fehler beim PATCH" });
    }
  }

  if (req.method === "POST") {
    try {
      const { id, blocks, title, description, coAuthorId, status, categoryId } = req.body;
      if (blocks !== undefined && !Array.isArray(blocks)) {
        console.error('Ungültiges Format für blocks:', blocks);
        return res.status(400).json({ error: "Blocks muss ein Array sein" });
      }
      const dataToSave: any = { userId: Number(user.id) };
      if (blocks !== undefined) dataToSave.blocks = blocks;
      if (typeof title === 'string') dataToSave.title = title;
      if (typeof description === 'string') dataToSave.description = description;
      if (typeof coAuthorId === 'number') dataToSave.coAuthorId = coAuthorId;
      if (typeof status === 'string') dataToSave.status = status;
      if (categoryId !== undefined && categoryId !== null && categoryId !== "") dataToSave.categoryId = Number(categoryId);

      let draft: Awaited<ReturnType<typeof prisma.blockDraft.update>>;
      if (id) {
        // Vorherigen Status laden
        const prevDraft = await prisma.blockDraft.findUnique({ where: { id: Number(id) } });
        draft = await prisma.blockDraft.update({
          where: { id: Number(id), userId: Number(user.id) },
          data: dataToSave,
        });
        // Prüfen, ob Status auf VEROEFFENTLICHT geändert wurde
        if (prevDraft && prevDraft.status !== 'VEROEFFENTLICHT' && draft.status === 'VEROEFFENTLICHT') {
          await createAuditLog({
            userId: Number(user.id),
            action: 'POST_PUBLISH',
            details: `Beitrag veröffentlicht: "${draft.title || 'Ohne Titel'}" am ${new Date().toLocaleString('de-DE')}`,
            oldValue: prevDraft.status,
            newValue: draft.status
          });
        }
        await createAuditLog({
          userId: Number(user.id),
          action: 'BLOCK_DRAFT_UPDATE',
          details: `Entwurf "${title || 'Ohne Titel'}" aktualisiert`,
          oldValue: null,
          newValue: `ID: ${draft.id}, Titel: ${title || 'Ohne Titel'}`
        });
      } else {
        dataToSave.blocks = [];
        draft = await prisma.blockDraft.create({
          data: dataToSave,
        });
        await createAuditLog({
          userId: Number(user.id),
          action: 'BLOCK_DRAFT_CREATE',
          details: `Neuer Entwurf "${title || 'Ohne Titel'}" erstellt`,
          newValue: `ID: ${draft.id}, Titel: ${title || 'Ohne Titel'}`
        });
      }

      const draftWithCoAuthor = await prisma.blockDraft.findUnique({
        where: { id: draft.id },
        include: {
          coAuthor: {
            select: { id: true, username: true, name: true, role: true }
          }
        }
      });

      return res.status(200).json({ success: true, draft: draftWithCoAuthor });
    } catch (error) {
      console.error('Fehler beim Speichern des Entwurfs:', error);
      return res.status(500).json({ 
        error: "Fehler beim Speichern", 
        details: error instanceof Error ? error.message : 'Unbekannter Fehler' 
      });
    }
  }

  return res.status(405).json({ error: "Methode nicht erlaubt" });
}
