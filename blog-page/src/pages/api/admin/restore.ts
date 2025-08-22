import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import AdmZip from 'adm-zip';
import formidable from 'formidable';
import { IncomingForm } from 'formidable';

// Deaktiviere die Body-Parser für Datei-Uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Nur POST erlauben
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

      // Prisma Client vor dem try-block deklarieren, damit er später zugänglich bleibt
      let prismaInstance: PrismaClient | undefined;

      try {
    // Prisma Client initialisieren
    prismaInstance = new PrismaClient();

    // Temporäres Verzeichnis für die Backup-Dateien
    const tempDir = path.join(process.cwd(), 'temp-restore');

    // Stelle sicher, dass das temporäre Verzeichnis existiert
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    fs.mkdirSync(tempDir, { recursive: true });

    // Upload-Datei empfangen
    const form = new IncomingForm({
      maxFileSize: 100 * 1024 * 1024, // 100 MB
      uploadDir: tempDir,
      keepExtensions: true,
      multiples: false,
      filename: (name, ext) => `backup${ext}` // Vereinfachter Dateiname
    });

    const formData = await new Promise<{ fields: formidable.Fields; files: formidable.Files }>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error("Formidable Parse-Fehler:", err);
          reject(err);
          return;
        }
        resolve({ fields, files });
      });
    });

    // Überprüfen, ob eine Datei vorhanden ist und ihren Pfad ermitteln
    let uploadedFile: formidable.File | undefined;

    // Prüfe verschiedene mögliche Schlüssel, unter denen die Datei gespeichert sein könnte
    const possibleKeys = ['backup', 'file', '0', 'files'];
    for (const key of possibleKeys) {
      const file = formData.files[key];
      if (file) {
        if (Array.isArray(file)) {
          uploadedFile = file[0];
        } else {
          uploadedFile = file as formidable.File;
        }
        break;
      }
    }

    // Falls keine Datei gefunden wurde, alle erhaltenen Dateien ausgeben
    if (!uploadedFile) {
      throw new Error('Keine Backup-Datei gefunden. Bitte versuchen Sie es erneut.');
    }

    // ZIP-Datei öffnen und Inhalt untersuchen
    const zip = new AdmZip(uploadedFile.filepath);
    const zipEntries = zip.getEntries();

    // Überprüfen, ob die Metadaten-Datei im Archiv vorhanden ist
    let metadataEntry = zipEntries.find(entry => entry.name === 'metadata.json');

    // Falls die Metadaten-Datei nicht direkt im Root ist, suche in Unterverzeichnissen
    if (!metadataEntry) {
      // Nach einer Datei mit dem Namen "metadata.json" suchen, unabhängig vom Pfad
      metadataEntry = zipEntries.find(entry => entry.name.endsWith('metadata.json'));
    }

    if (!metadataEntry) {
      // Alle Dateinamen ausgeben, um zu sehen, was im Archiv enthalten ist
      const fileList = zipEntries.map(entry => entry.entryName).join(', ');
      throw new Error('Ungültiges Backup: Metadaten-Datei nicht gefunden. Bitte stellen Sie sicher, dass Sie ein gültiges Backup hochladen.');
    }

    // Extrahiere den Pfad zum übergeordneten Verzeichnis der Metadaten-Datei (falls vorhanden)
    const metadataDir = path.dirname(metadataEntry.entryName);
    const isRootMetadata = metadataDir === '.' || metadataDir === '';


    // ZIP-Datei extrahieren - entweder alles oder nur den relevanten Teil
    if (isRootMetadata) {
      // Wenn metadata.json im Root ist, alles extrahieren
      zip.extractAllTo(tempDir, true);
    } else {
      // Andernfalls nur die Dateien im selben Verzeichnis wie metadata.json extrahieren
      zipEntries.forEach(entry => {
        if (entry.entryName.startsWith(metadataDir)) {
          const relativePath = entry.entryName.substring(metadataDir.length + (metadataDir.endsWith('/') ? 0 : 1));
          const targetPath = path.join(tempDir, relativePath);

          // Stelle sicher, dass das Zielverzeichnis existiert
          const targetDir = path.dirname(targetPath);
          if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
          }

          // Datei extrahieren
          if (!entry.isDirectory) {
            zip.extractEntryTo(entry.entryName, targetDir, false, true);
          }
        }
      });
    }

    // Prüfe, ob die Metadaten-Datei erfolgreich extrahiert wurde
    const metadataPath = path.join(tempDir, 'metadata.json');
    if (!fs.existsSync(metadataPath)) {
      // Versuche, die Datei direkt aus dem ZIP-Eintrag zu lesen
      try {
        const metadataContent = metadataEntry.getData().toString('utf8');
        fs.writeFileSync(metadataPath, metadataContent);
      } catch (extractErr) {
        console.error('Fehler beim direkten Extrahieren der Metadaten-Datei:', extractErr);
        throw new Error('Ungültiges Backup: Metadaten-Datei konnte nicht extrahiert werden');
      }
    }

    // Liste alle extrahierten Dateien auf
    const extractedFiles = fs.readdirSync(tempDir);

    // Metadaten einlesen
    let metadata;
    try {
      metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    } catch (parseErr) {
      console.error('Fehler beim Parsen der Metadaten-Datei:', parseErr);
      throw new Error('Ungültiges Backup: Metadaten-Datei konnte nicht gelesen werden');
    }

    // Überprüfen der Backup-Version und Tabellen
    if (!metadata.version) {
      console.warn('Keine Versionsangabe in den Metadaten gefunden, verwende Standardwert 1.0');
      metadata.version = '1.0';
    } else if (metadata.version !== '1.0') {
      throw new Error(`Nicht unterstützte Backup-Version: ${metadata.version}`);
    }

    // Prüfe, ob Tabellen im Backup definiert sind
    if (!metadata.tables || !Array.isArray(metadata.tables) || metadata.tables.length === 0) {
      // Versuche, die Tabellen aus den vorhandenen Dateien abzuleiten
      const jsonFiles = fs.readdirSync(tempDir)
        .filter(file => file.endsWith('.json') && file !== 'metadata.json');

      if (jsonFiles.length === 0) {
        throw new Error('Ungültiges Backup: Keine Tabellendaten gefunden');
      }

      metadata.tables = jsonFiles.map(file => file.replace('.json', ''));
    }

    // Prüfe, ob die angegebenen Tabellen im Prisma-Schema existieren
    const availableTables = Object.keys(prismaInstance)
      .filter(key => !key.startsWith('$') && typeof prismaInstance[key as keyof typeof prismaInstance] === 'object');

    // Erstelle Mapping für Tabellennamen mit verschiedenen Varianten (Plural/Singular)
    const tableMapping: Record<string, string> = {};

    // Füge direkte Übereinstimmungen hinzu
    availableTables.forEach(table => {
      tableMapping[table.toLowerCase()] = table;
    });

    // Füge Plural/Singular-Varianten hinzu
    availableTables.forEach(table => {
      // Plural zu Singular Mapping (users -> user)
      if (table.endsWith('s')) {
        const singular = table.slice(0, -1);
        tableMapping[singular.toLowerCase()] = table;
      }

      // Singular zu Plural Mapping (user -> users)
      const plural = table + 's';
      tableMapping[plural.toLowerCase()] = table;
    });

    // Überprüfe, welche Backup-Tabellen importiert werden können
    const tableMatchMap = new Map<string, string>();

    for (const backupTable of metadata.tables) {
      const lowerBackupTable = backupTable.toLowerCase();

      // Direkte Übereinstimmung
      if (availableTables.includes(backupTable)) {
        tableMatchMap.set(backupTable, backupTable);
        continue;
      }

      // Mapping-basierte Übereinstimmung
      if (tableMapping[lowerBackupTable]) {
        tableMatchMap.set(backupTable, tableMapping[lowerBackupTable]);
        continue;
      }

      // Versuche, eine Ähnlichkeit zu finden
      let bestMatch = '';
      let highestSimilarity = 0;

      for (const dbTable of availableTables) {
        // Einfache Ähnlichkeitsberechnung
        const similarity = calculateSimilarity(lowerBackupTable, dbTable.toLowerCase());
        if (similarity > 0.7 && similarity > highestSimilarity) {
          highestSimilarity = similarity;
          bestMatch = dbTable;
        }
      }

      if (bestMatch) {
        tableMatchMap.set(backupTable, bestMatch);
      }
    }

    const importableTables = Array.from(tableMatchMap.keys());

    if (importableTables.length === 0) {
      throw new Error('Keine importierbaren Tabellen im Backup gefunden. Die Tabellennamen im Backup stimmen nicht mit dem aktuellen Datenbankschema überein.');
    }

    // Hilfsfunktion zur Berechnung der Ähnlichkeit zwischen zwei Zeichenketten
    function calculateSimilarity(a: string, b: string): number {
      if (a === b) return 1;
      if (a.includes(b) || b.includes(a)) return 0.9;

      const maxLength = Math.max(a.length, b.length);
      if (maxLength === 0) return 0;

      // Levenshtein-Distanz berechnen (vereinfachte Version)
      const matrix: number[][] = [];

      for (let i = 0; i <= a.length; i++) {
        matrix[i] = [i];
      }

      for (let j = 0; j <= b.length; j++) {
        matrix[0][j] = j;
      }

      for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
          const cost = a[i - 1] === b[j - 1] ? 0 : 1;
          matrix[i][j] = Math.min(
            matrix[i - 1][j] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j - 1] + cost
          );
        }
      }

      const distance = matrix[a.length][b.length];
      return 1 - (distance / maxLength);
    }

    // Transaktionellen Wiederherstellungsprozess starten
    const importedTablesCount = {
      success: 0,
      skipped: 0,
      failed: 0
    };

    try {
      await prismaInstance.$transaction(async (tx) => {
        // Optional: Vorhandene Daten löschen (auskommentiert, um versehentliches Löschen zu vermeiden)
        // await tx.user.deleteMany({});
        // await tx.category.deleteMany({});
        // usw. für jede Tabelle

        // Daten aus den JSON-Dateien wiederherstellen
        for (const tableName of importableTables) {
                      // Variablen für den Import
                      let successCount = 0;

          try {
            // Suche nach der JSON-Datei mit verschiedenen Namenskonventionen
            let filePath = path.join(tempDir, `${tableName}.json`);

            // Liste alle JSON-Dateien im temporären Verzeichnis auf
            const allJsonFiles = fs.readdirSync(tempDir)
              .filter(file => file.endsWith('.json') && file !== 'metadata.json');

            // Überprüfe, ob die Datei existiert
            if (!fs.existsSync(filePath)) {
              // Alternative Namen prüfen
              const alternativeNames = [
                `${tableName.toLowerCase()}.json`,
                `${tableName.toUpperCase()}.json`,
                `${tableName.charAt(0).toUpperCase() + tableName.slice(1)}.json`,
                // Plural/Singular-Varianten
                `${tableName}s.json`,
                tableName.endsWith('s') ? `${tableName.slice(0, -1)}.json` : null
              ].filter(Boolean) as string[];

              let foundFile = alternativeNames.find(name => fs.existsSync(path.join(tempDir, name)));

              // Wenn immer noch keine Datei gefunden wurde, versuche eine ähnliche Datei zu finden
              if (!foundFile) {
                // Suche nach ähnlichen Dateinamen
                for (const jsonFile of allJsonFiles) {
                  const jsonName = jsonFile.replace('.json', '');
                  if (
                    jsonName.includes(tableName) || 
                    tableName.includes(jsonName) ||
                    (jsonName.length > 3 && tableName.includes(jsonName.substring(0, jsonName.length - 1))) ||
                    (tableName.length > 3 && jsonName.includes(tableName.substring(0, tableName.length - 1)))
                  ) {
                    foundFile = jsonFile;
                    break;
                  }
                }
              }

              if (foundFile) {
                filePath = path.join(tempDir, foundFile);
              } else {
                console.warn(`Warnung: Datei für Tabelle ${tableName} fehlt im Backup`);
                importedTablesCount.skipped++;
                continue;
              }
            }

            // Daten aus der JSON-Datei einlesen
            let data;
            try {
              const fileContent = fs.readFileSync(filePath, 'utf-8');
              data = JSON.parse(fileContent);
            } catch (parseErr) {
              console.error(`Fehler beim Parsen der JSON-Datei für ${tableName}:`, parseErr);
              importedTablesCount.failed++;
              continue;
            }

            if (!Array.isArray(data) || data.length === 0) {
              console.warn(`Keine Daten für Tabelle ${tableName}`);
              importedTablesCount.skipped++;
              continue;
            }

            // Das echte Prisma-Modell bestimmen
            const actualModelName = tableMatchMap.get(tableName) || tableName;
            const model = tx[actualModelName as keyof typeof tx] as any;

            if (!model || typeof model.createMany !== 'function') {
              console.warn(`Tabelle ${actualModelName} nicht in der Datenbank gefunden oder unterstützt keine createMany-Funktion`);
              importedTablesCount.skipped++;
              continue;
            }

            try {
              // Analysiere Modelldefinition, um erforderliche und optionale Felder zu bestimmen
              const actualModelName = tableMatchMap.get(tableName) || tableName;
              const modelRegex = new RegExp(`model\\s+${actualModelName}\\s*{([^}]+)}`, 'si');
              const schemaText = fs.readFileSync(path.join(tempDir, 'schema.prisma'), 'utf-8');
              const modelMatch = schemaText.match(modelRegex);

              const requiredFields: string[] = [];
              const optionalFields: string[] = [];
              const enumFields: Map<string, string[]> = new Map();
              const relationFields: string[] = [];

              if (modelMatch && modelMatch[1]) {
                const modelContent = modelMatch[1];
                const fieldLines = modelContent.split('\n')
                  .map(line => line.trim())
                  .filter(line => line && !line.startsWith('//'));

                // Sammle zuerst alle Feldnamen
                const allFieldNames: string[] = [];
                for (const line of fieldLines) {
                  if (!line.startsWith('@')) {
                    const fieldMatch = line.match(/^(\w+)\s+(.+?)(\?)?(\s+@|$)/);
                    if (fieldMatch) {
                      const [_, fieldName] = fieldMatch;
                      allFieldNames.push(fieldName);
                    }
                  }
                }

                // Dann analysiere jede Zeile
                for (const line of fieldLines) {
                  // Prüfe auf @relation Attribute
                  if (line.includes('@relation')) {
                    // Finde das Feld zu dieser Relation
                    for (const fieldName of allFieldNames) {
                      if (line.includes(fieldName)) {
                        relationFields.push(fieldName);
                        break;
                      }
                    }
                  }

                  // Analysiere Feldzeilen (keine @-Zeilen)
                  if (!line.startsWith('@')) {
                    const fieldMatch = line.match(/^(\w+)\s+(.+?)(\?)?(\s+@|$)/);
                    if (fieldMatch) {
                      const [_, fieldName, fieldType, optional] = fieldMatch;

                      // Prüfe auf Relationsfelder (Referenzen zu anderen Modellen oder Arrays)
                      if (fieldType.endsWith('[]') || 
                          (fieldType.charAt(0).toUpperCase() === fieldType.charAt(0) && 
                           !['String', 'Int', 'Float', 'Boolean', 'DateTime', 'Json'].includes(fieldType))) {
                        // Wenn der Typ ein Array ist oder großgeschrieben (wie ein Modellname)
                        // und kein Standard-Prisma-Typ, dann ist es wahrscheinlich eine Relation
                        relationFields.push(fieldName);
                      }

                      // Setze optionale und erforderliche Felder
                      if (optional) {
                        optionalFields.push(fieldName);
                      } else {
                        requiredFields.push(fieldName);
                      }

                      // Prüfe, ob das Feld ein Enum ist
                      if (/^[A-Z][a-zA-Z0-9]*$/.test(fieldType) && !['String', 'Int', 'Float', 'Boolean', 'DateTime', 'Json'].includes(fieldType)) {
                        // Suche Enum-Definition
                        const enumRegex = new RegExp(`enum\\s+${fieldType}\\s*{([^}]+)}`, 'si');
                        const enumMatch = schemaText.match(enumRegex);
                        if (enumMatch && enumMatch[1]) {
                          const enumValues = enumMatch[1].split('\n')
                            .map(line => line.trim())
                            .filter(line => line && !line.startsWith('//'));
                          enumFields.set(fieldName, enumValues);
                        }
                      }
                    }
                  }
                }

                // Füge bekannte Relationsfelder hinzu, falls sie nicht erkannt wurden
                const knownRelations = [
                  'userSubscriptions', 'users', 'subscriptions', 'posts', 'categories', 
                  'blockDrafts', 'comments', 'likes', 'reports', 'children', 'parent',
                  'author', 'user', 'admin', 'replies', 'coAuthor', 'blockDraft', 
                  'comment', 'plan'
                ];

                for (const relation of knownRelations) {
                  if (allFieldNames.includes(relation) && !relationFields.includes(relation)) {
                    relationFields.push(relation);
                  }
                }
              }

              // Vor dem Import die Daten bereinigen und validieren
              const cleanData = data.map(item => {
                // Entferne id und Zeitstempelfelder, wenn Prisma diese generiert
                const { id, createdAt, updatedAt, ...rest } = item;
                const cleanItem: any = {};

                // Kopiere nur gültige Felder, filtere Relationsfelder
                Object.keys(rest).forEach(key => {
                  // Überspringe erkannte Relationsfelder
                  if (relationFields.includes(key)) {
                    return;
                  }

                  // Überspringe auch plural benannte Felder, die wahrscheinlich Relationen sind
                  if (key.endsWith('s') && !['status', 'address', 'includedRequests'].includes(key) &&
                      (typeof rest[key] === 'object' || Array.isArray(rest[key]))) {
                    return;
                  }

                  const value = rest[key];

                  // Wenn der Wert null ist und das Feld optional ist, übernehme es
                  if (value === null) {
                    if (optionalFields.includes(key)) {
                      cleanItem[key] = null;
                    }
                    return;
                  }

                  // Wenn Feld ein Array oder Objekt ist und leer, übernimm es nur wenn optional
                  if (
                    (Array.isArray(value) && value.length === 0) ||
                    (typeof value === 'object' && value !== null && Object.keys(value).length === 0)
                  ) {
                    if (optionalFields.includes(key)) {
                      cleanItem[key] = value;
                    }
                    return;
                  }

                  // Wenn Feld ein Datum ist, konvertiere es
                  if (typeof value === 'string' && 
                      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
                    try {
                      const date = new Date(value);
                      if (!isNaN(date.getTime())) {
                        cleanItem[key] = date;
                        return;
                      }
                    } catch (e) {
                      // Ignoriere Fehler beim Konvertieren
                    }
                  }

                  // Prüfe, ob es sich um ein Enum-Feld handelt
                  if (enumFields.has(key) && typeof value === 'string') {
                    const validEnumValues = enumFields.get(key) || [];
                    // Überprüfe, ob der Wert gültig ist oder einen ähnlichen Wert finden
                    let found = false;

                    // Exakte Übereinstimmung
                    if (validEnumValues.includes(value)) {
                      cleanItem[key] = value;
                      found = true;
                    } 
                    // Ähnliche Übereinstimmung (ignoriere Groß-/Kleinschreibung)
                    else {
                      const lowerValue = value.toLowerCase();
                      for (const enumValue of validEnumValues) {
                        if (enumValue.toLowerCase() === lowerValue) {
                          cleanItem[key] = enumValue; // Verwende den korrekten Enum-Wert
                          found = true;
                          break;
                        }
                      }
                    }

                    if (found) return;

                    // Wenn kein gültiger Wert gefunden wurde und das Feld erforderlich ist,
                    // verwende den ersten gültigen Enum-Wert
                    if (requiredFields.includes(key) && validEnumValues.length > 0) {
                      cleanItem[key] = validEnumValues[0];
                    }
                    return;
                  }

                  // Übernehme den Wert
                  cleanItem[key] = value;
                });

                // Stelle sicher, dass alle erforderlichen Felder vorhanden sind
                for (const field of requiredFields) {
                  if (cleanItem[field] === undefined) {
                    // Wenn ein erforderliches Feld fehlt, setze einen Standardwert
                    if (enumFields.has(field) && enumFields.get(field)?.length) {
                      cleanItem[field] = enumFields.get(field)[0];
                    } else if (field.toLowerCase().includes('id') && !field.endsWith('Id')) {
                      // Wenn es sich um ein ID-Feld handelt, das nicht auf "Id" endet, ignoriere es
                      // (wahrscheinlich ein Primärschlüssel, der von Prisma generiert wird)
                    } else {
                      switch (true) {
                        case field.toLowerCase().includes('email'):
                          cleanItem[field] = `user-${Date.now()}@example.com`;
                          break;
                        case field.toLowerCase().includes('name'):
                          cleanItem[field] = `Importiert-${Date.now()}`;
                          break;
                        case field.toLowerCase().includes('title'):
                          cleanItem[field] = `Importierter Titel ${Date.now()}`;
                          break;
                        case field.toLowerCase().includes('password'):
                          cleanItem[field] = `$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`; // Dummy-Hash
                          break;
                        case field.endsWith('Id'):
                          // Versuche, eine gültige ID zu finden oder zu erstellen
                          cleanItem[field] = 1; // Standardwert, könnte angepasst werden
                          break;
                        default:
                          if (typeof cleanItem[field] !== 'boolean') {
                            cleanItem[field] = '';
                          } else {
                            cleanItem[field] = false;
                          }
                      }
                    }
                  }
                }

                return cleanItem;
              });

              // Prüfe zunächst, ob die Tabelle leer ist
              let tableIsEmpty = false;
              try {
                const count = await model.count();
                tableIsEmpty = count === 0;
              } catch (countErr) {
                console.warn(`Konnte Anzahl der Datensätze in ${actualModelName} nicht ermitteln:`, countErr.message);
              }

              // Wenn die Tabelle nicht leer ist und es sich um sensible Daten handelt, überspringen
              const sensitiveTables = ['User', 'user', 'users', 'Users', 'admin', 'Admin', 'admins', 'Admins'];
              if (!tableIsEmpty && sensitiveTables.includes(actualModelName)) {
                importedTablesCount.skipped++;
                continue;
              }

              // Versuche verschiedene Import-Strategien
              let importSuccess = false;

              // Strategie 1: Massen-Import mit createMany
              if (!importSuccess) {
                try {

                  if (cleanData.length > 0) {

                    await model.createMany({
                      data: cleanData,
                      skipDuplicates: true
                    });

                    successCount = cleanData.length;
                    importSuccess = true;
                    importedTablesCount.success++;
                  } else {
                    importedTablesCount.skipped++;
                    importSuccess = true;
                  }
                } catch (bulkErr) {
                  // Versuche zu verstehen, welches Feld Probleme verursacht
                  if (bulkErr.message.includes('Unknown argument')) {
                    const match = bulkErr.message.match(/Unknown argument `([^`]+)`/);
                    if (match && match[1]) {
                      const problematicField = match[1];

                      // Entferne das problematische Feld aus allen Datensätzen
                      cleanData.forEach(item => {
                        delete item[problematicField];
                      });

                      // Versuche den Import erneut
                      try {
                        await model.createMany({
                          data: cleanData,
                          skipDuplicates: true
                        });

                        successCount = cleanData.length;
                        importSuccess = true;
                        importedTablesCount.success++;
                      } catch (retryErr) {
                        console.error(`Erneuter Fehler beim Massen-Import:`, retryErr.message);
                      }
                    }
                  }
                }
              }

              // Strategie 2: Upsert mit eindeutigem Schlüssel
              if (!importSuccess && cleanData.length > 0) {
                try {

                  // Finde Felder, die eindeutig sein könnten
                  const potentialUniqueFields = ['id', 'email', 'username', 'name', 'slug', 'title']
                    .filter(field => cleanData[0][field] !== undefined);

                  if (potentialUniqueFields.length > 0) {
                    const uniqueField = potentialUniqueFields[0];
                    let successCount = 0;

                    for (const item of cleanData) {
                      try {
                        await model.upsert({
                          where: { [uniqueField]: item[uniqueField] },
                          update: item,
                          create: item
                        });
                        successCount++;
                      } catch (upsertErr) {
                        // Ignoriere einzelne Fehler
                      }
                    }

                    if (successCount > 0) {
                      importSuccess = true;
                      importedTablesCount.success++;
                    }
                  }
                } catch (upsertErr) {
                  console.error(`Fehler beim Upsert-Import für ${tableName}:`, upsertErr.message);
                }
              }

              // Strategie 3: Einzelner Import
              if (!importSuccess && cleanData.length > 0) {
                try {
                  let singleImportSuccessCount = 0;

                  for (const item of cleanData) {
                    try {
                      // Noch einmal explizit Relationsfelder entfernen
                      const cleanSingleItem: any = {};
                      Object.entries(item).forEach(([key, value]) => {
                        // Überspringe alle Relationsfelder und potenzielle Probleme
                        if (
                          relationFields.includes(key) || 
                          key === 'id' ||
                          (key.endsWith('s') && typeof value === 'object' && !['status', 'address', 'includedRequests'].includes(key)) ||
                          (typeof value === 'object' && value !== null && 
                           !Array.isArray(value) && Object.keys(value).length > 0)
                        ) {
                          return;
                        }
                        cleanSingleItem[key] = value;
                      });

                      await model.create({
                        data: cleanSingleItem
                      });
                      successCount++;
                      singleImportSuccessCount++;
                    } catch (singleErr) {

                      // Versuche, eine vereinfachte Version des Items zu erstellen
                      try {
                        // Behalte nur Stringfelder und einfache Typen
                        const simplifiedItem: any = {};
                        Object.entries(item).forEach(([key, value]) => {
                          // Überspringe potenzielle Problemfelder
                          if (
                            relationFields.includes(key) ||
                            key === 'id' ||
                            key.includes('Id') ||
                            key.endsWith('s')
                          ) {
                            return;
                          }

                          if (
                            typeof value === 'string' || 
                            typeof value === 'number' || 
                            typeof value === 'boolean' ||
                            value === null
                          ) {
                            simplifiedItem[key] = value;
                          }
                        });

                        if (Object.keys(simplifiedItem).length > 0) {
                          await model.create({
                            data: simplifiedItem
                          });
                          successCount++;
                        }
                      } catch (simplifiedErr) {
                        // Ignoriere diesen Eintrag
                      }
                    }
                  }

                  if (successCount > 0) {
                    importSuccess = true;
                    importedTablesCount.success++;
                  }
                } catch (singleImportErr) {
                  console.error(`Fehler beim einzelnen Import für ${tableName}:`, singleImportErr.message);
                }
              }

              // Wenn kein Import erfolgreich war
              if (!importSuccess) {
                console.error(`Alle Import-Strategien für ${tableName} fehlgeschlagen`);

                // Wenn zumindest einige Einträge importiert wurden, zählen wir die Tabelle als erfolgreich
                if (successCount > 0) {
                  importedTablesCount.success++;
                } else {
                  importedTablesCount.failed++;
                }
              }
            } catch (importErr) {
              console.error(`Fehler beim Import der Tabelle ${tableName}:`, importErr.message);

              // Wenn zumindest einige Einträge importiert wurden, zählen wir die Tabelle als erfolgreich
              if (successCount > 0) {
                importedTablesCount.success++;
              } else {
                // Überprüfe, ob die Tabelle bereits Daten enthält
                try {
                  const count = await model.count();
                  if (count > 0) {
                    importedTablesCount.skipped++;
                  } else {
                    importedTablesCount.failed++;
                    console.error(`Fehler beim Import der Tabelle ${tableName}: ${importErr.message}`);
                  }
                } catch (countErr) {
                  importedTablesCount.failed++;
                  console.error(`Fehler beim Zählen der Datensätze in ${tableName}: ${countErr.message}`);
                }
              }
            }
          } catch (tableErr) {
            console.error(`Fehler bei der Verarbeitung der Tabelle ${tableName}:`, tableErr);
            importedTablesCount.failed++;
          }
        }
      });
    } catch (txErr) {
      console.error('Transaktionsfehler:', txErr);
      throw new Error(`Fehler bei der Wiederherstellung: ${txErr.message}`);
    }

    // Detailliertes Erfolgsfeedback zurückgeben
    res.status(200).json({ 
      success: true, 
      message: 'Backup erfolgreich eingespielt',
      tables: {
        total: importableTables.length,
        imported: importedTablesCount.success,
        skipped: importedTablesCount.skipped,
        failed: importedTablesCount.failed
      },
      metadata: {
        version: metadata.version,
        createdAt: metadata.createdAt,
        application: metadata.application
      }
    });

    // Aufräumen
    fs.rmSync(tempDir, { recursive: true, force: true });
    await prismaInstance.$disconnect();
  } catch (err) {
    console.error('Wiederherstellungsfehler:', err);

    // Erweiterte Fehlerinformationen für den Benutzer
    let errorMessage = 'Wiederherstellung fehlgeschlagen';
    let errorDetails = String(err);

    // Spezifischere Fehlermeldungen je nach Fehlertyp
    if (errorDetails.includes('metadata')) {
      errorMessage = 'Ungültiges Backup-Format';
    } else if (errorDetails.includes('JSON')) {
      errorMessage = 'Fehler beim Lesen der Backup-Daten';
    } else if (errorDetails.includes('Prisma')) {
      errorMessage = 'Datenbankfehler bei der Wiederherstellung';
    }

    // Aufräumen auch im Fehlerfall
    const tempCleanupDir = path.join(process.cwd(), 'temp-restore');
    if (fs.existsSync(tempCleanupDir)) {
      try {
        fs.rmSync(tempCleanupDir, { recursive: true, force: true });
      } catch (cleanupErr) {
        console.error('Fehler beim Aufräumen:', cleanupErr);
      }
    }

    try {
      // Stelle sicher, dass der Prisma-Client existiert, bevor disconnect aufgerufen wird
      if (typeof prismaInstance !== 'undefined' && prismaInstance) {
        await prismaInstance.$disconnect();
      }
    } catch (disconnectErr) {
      console.error('Fehler beim Trennen der Datenbankverbindung:', disconnectErr);
    }

    res.status(500).json({ 
      error: errorMessage, 
      details: errorDetails,
      suggestion: 'Überprüfen Sie, ob die hochgeladene Datei ein gültiges Backup ist, das mit dieser Anwendung erstellt wurde.' 
    });
  }
}
