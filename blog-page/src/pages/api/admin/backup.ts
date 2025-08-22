import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import AdmZip from 'adm-zip';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Nur POST/GET erlauben
  if (req.method !== 'GET') {
    res.status(405).end('Method Not Allowed');
    return;
  }

  try {
    // Prisma Client initialisieren
    const prisma = new PrismaClient();

    // Temporäres Verzeichnis für die Backup-Dateien
    const tempDir = path.join(process.cwd(), 'temp-backup');

    // Stelle sicher, dass das temporäre Verzeichnis existiert
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    fs.mkdirSync(tempDir, { recursive: true });

    // Alle Modelldaten exportieren
    const modelData = {
      users: await prisma.user.findMany(),
      categories: await prisma.category.findMany(),
      posts: await prisma.post.findMany(),
      blockDrafts: await prisma.blockDraft.findMany(),
      blockDraftComments: await prisma.blockDraftComment.findMany(),
      blockDraftLikes: await prisma.blockDraftLike.findMany(),
      blockDraftCommentLikes: await prisma.blockDraftCommentLike.findMany(),
      blockDraftReports: await prisma.blockDraftReport.findMany(),
      blockDraftCommentReports: await prisma.blockDraftCommentReport.findMany(),
      notifications: await prisma.notification.findMany(),
      auditLogs: await prisma.auditLog.findMany(),
      subscriptionPlans: await prisma.subscriptionPlan.findMany(),
      userSubscriptions: await prisma.userSubscription.findMany(),
      usernameHistory: await prisma.usernameHistory.findMany(),
      emailHistory: await prisma.emailHistory.findMany(),
      aiRequests: await prisma.aiRequest.findMany(),
      emailTemplates: await prisma.emailTemplate.findMany(),
      newsletters: await prisma.newsletter.findMany()
    };

    // Speichere jede Tabelle in einer separaten JSON-Datei
    for (const [modelName, data] of Object.entries(modelData)) {
      const filePath = path.join(tempDir, `${modelName}.json`);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    }

    // Metadaten-Datei erstellen
    const metadata = {
      createdAt: new Date().toISOString(),
      version: '1.0',
      tables: Object.keys(modelData),
      databaseType: 'PostgreSQL',
      application: 'NextJS Blog Platform'
    };
    fs.writeFileSync(
      path.join(tempDir, 'metadata.json'), 
      JSON.stringify(metadata, null, 2)
    );

    // Prisma-Schema kopieren
    fs.copyFileSync(
      path.join(process.cwd(), 'prisma', 'schema.prisma'),
      path.join(tempDir, 'schema.prisma')
    );

    // README-Datei erstellen
    const readme = `# Datenbank-Backup
Erstellt am: ${new Date().toLocaleString('de-DE')}

Dieses Backup enthält Daten aus allen Tabellen der Datenbank im JSON-Format:
${Object.keys(modelData).map(name => `- ${name}.json`).join('\n')}

Weitere Dateien:
- metadata.json: Informationen zum Backup
- schema.prisma: Das Datenbankschema

Um dieses Backup wiederherzustellen, importieren Sie die Daten in Ihre Datenbank.
`;
    fs.writeFileSync(path.join(tempDir, 'README.txt'), readme);

    // ZIP-Datei erstellen
    const zip = new AdmZip();

    // Alle Dateien im temporären Verzeichnis hinzufügen
    const files = fs.readdirSync(tempDir);
    for (const file of files) {
      zip.addLocalFile(path.join(tempDir, file));
    }

    // ZIP-Inhalt generieren
    const zipBuffer = zip.toBuffer();

    // ZIP-Datei zum Download anbieten
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="db-backup.zip"');
    res.setHeader('Content-Length', zipBuffer.length);
    res.status(200).send(zipBuffer);

    // Aufräumen
    fs.rmSync(tempDir, { recursive: true, force: true });

    await prisma.$disconnect();
  } catch (err) {
    res.status(500).json({ error: 'Backup fehlgeschlagen', details: String(err) });
  }
}
