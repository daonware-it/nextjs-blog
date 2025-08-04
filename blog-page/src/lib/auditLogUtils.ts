// Hilfsfunktion zur Erstellung von Audit-Logs
import prisma from '../../lib/prisma';

export async function createAuditLog({
  userId,
  adminId,
  action,
  details,
  oldValue = null,
  newValue = null
}: {
  userId: number;
  adminId?: number | null;
  action: string;
  details: string;
  oldValue?: string | null;
  newValue?: string | null;
}) {
  try {
    // Sicherstellen, dass adminId ein Integer ist, wenn vorhanden
    const parsedAdminId = adminId ? (
      typeof adminId === 'string' ? parseInt(adminId, 10) : adminId
    ) : null;

    return await prisma.auditLog.create({
      data: {
        userId,
        adminId: parsedAdminId,
        // @ts-ignore - Da wir dynamisch Aktionen hinzufügen können
        action,
        details,
        oldValue,
        newValue
      }
    });
  } catch (error) {
    console.error('Fehler beim Erstellen des Audit-Logs:', error);
    // Fehler nicht weiterwerfen, damit die Hauptfunktion weiterläuft,
    // auch wenn das Logging fehlschlägt
    return null;
  }
}
