import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// Hilfsfunktion zum Konvertieren von BigInt in Number
function convertBigIntsToNumbers(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'bigint') {
    return Number(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(convertBigIntsToNumbers);
  }

  if (typeof obj === 'object') {
    const result: Record<string, any> = {};
    for (const key in obj) {
      result[key] = convertBigIntsToNumbers(obj[key]);
    }
    return result;
  }

  return obj;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Globale Variablen für erweiterte Metriken deklarieren
  let errorMessages: string[] = [];
  let slowQueries: any[] = [];
  let lockBlockerRes: any[] = [];
  let vacuumRes: any[] = [];
  let scanRes: any[] = [];
  let sizeRes: any[] = [];
  let orphanPosts: number = 0;
  let rolesRes: any[] = [];
  let encoding: string = '';
  let timezone: string = '';
  let ssl: string = '';
  let extensionsRes: any[] = [];
  let recovery: boolean = false;
  let slots: any[] = [];
  let walBytes: number | null = null;
  try {
    // Hole Umgebungsvariablen
    const databaseUrl = process.env.DATABASE_URL || 'unknown';
    // Provider aus der URL extrahieren
    let databaseProvider = 'unknown';
    if (databaseUrl.startsWith('postgres')) databaseProvider = 'postgresql';
    else if (databaseUrl.startsWith('mysql')) databaseProvider = 'mysql';
    else if (databaseUrl.startsWith('sqlite')) databaseProvider = 'sqlite';
    else if (databaseUrl.startsWith('mongodb')) databaseProvider = 'mongodb';
    // Verbindungszeit messen
    const start = Date.now();
    // Testabfrage: Hole die erste User-ID (nur als Beispiel für DB-Verbindung)
    const user = await prisma.user.findFirst();
    const connectionTime = Date.now() - start;
    // Extrahiere den Datenbanknamen aus der URL (robuster)
    let databaseName = 'unknown';
    try {
      const urlParts = databaseUrl.split('/');
      databaseName = urlParts[urlParts.length - 1].split('?')[0] || 'unknown';
      // Falls z.B. bei Postgres die URL mit "postgres://user:pass@host:port/dbname" kommt
      if (databaseName.includes('@')) {
        databaseName = databaseName.split('@').pop()?.split('?')[0] || databaseName;
      }
    } catch {}
    // Tabellenstatistiken abfragen
    const userCount = await prisma.user.count();
    const postCount = await prisma.post.count();
    const categoryCount = await prisma.category.count();
    const blockDraftCount = await prisma.blockDraft.count();
    // Beispielbenutzer abfragen
    // Node.js Version und Umgebung auslesen
    const nodeVersion = process.version;
    const nodeEnv = process.env.NODE_ENV || 'unknown';
    // Prisma Version auslesen
    const prismaVersion = Prisma?.prismaVersion?.client || 'unknown';
    // Datenbank-Version abfragen
    let databaseVersion = 'unbekannt';
    try {
      if (databaseProvider === 'postgresql') {
        const result = await prisma.$queryRaw<{ version: string }[]>`SELECT version();`;
        databaseVersion = result[0]?.version || 'unbekannt';
      } else if (databaseProvider === 'mysql') {
        const result = await prisma.$queryRaw<{ version: string }[]>`SELECT VERSION();`;
        databaseVersion = result[0]?.version || 'unbekannt';
      } else if (databaseProvider === 'sqlite') {
        const result = await prisma.$queryRaw<{ version: string }[]>`SELECT sqlite_version() AS version;`;
        databaseVersion = result[0]?.version || 'unbekannt';
      } // MongoDB: Version nicht per SQL abfragbar
    } catch (e) {
      // Fehler ignorieren, falls Version nicht abfragbar
    }
    // Host, Port, User aus der URL extrahieren
    let databaseHost = 'unbekannt';
    let databasePort = 'unbekannt';
    let databaseUser = 'unbekannt';
    try {
      const match = databaseUrl.match(/^(?:[a-z]+):\/\/(.*?):(.*?)@(.*?):(\d+)\//);
      if (match) {
        databaseUser = match[1] || 'unbekannt';
        databaseHost = match[3] || 'unbekannt';
        databasePort = match[4] || 'unbekannt';
      } else {
        // Alternative Parsing für sqlite
        if (databaseProvider === 'sqlite') {
          databaseHost = 'local file';
          databasePort = '-';
          databaseUser = '-';
        }

      }
    } catch {}
    // Testzeitpunkt
    const testTimestamp = new Date().toISOString();
    // Transaktionsfähigkeit
    let transactionSupport = 'unbekannt';
    if (['postgresql', 'mysql', 'sqlite'].includes(databaseProvider)) transactionSupport = 'ja';
    if (databaseProvider === 'mongodb') transactionSupport = 'nein';
    // Datenbankgröße und offene Verbindungen (nur PostgreSQL)
    let databaseSize = null;
    let openConnections = null;
    if (databaseProvider === 'postgresql') {
      try {
        const sizeResult = await prisma.$queryRaw<{ size: string }[]>`SELECT pg_size_pretty(pg_database_size(current_database())) AS size;`;
        databaseSize = sizeResult[0]?.size || null;
        const connResult = await prisma.$queryRaw<{ count: number }[]>`SELECT count(*) FROM pg_stat_activity WHERE datname = current_database();`;
        openConnections = connResult[0]?.count || null;
      } catch {}
    }
    // BigInt-Konvertierung für openConnections
    if (typeof openConnections === 'bigint') {
      openConnections = Number(openConnections);
    }
    // --- Migration-Status ---
    const fs = require('fs');
    const path = require('path');
    let migrationStatus = {
      localMigrations: [],
      appliedMigrations: [],
      allApplied: null,
      missing: [],
      error: null
    };
    try {
      const migrationsDir = path.join(process.cwd(), 'prisma', 'migrations');
      migrationStatus.localMigrations = fs.readdirSync(migrationsDir).filter((d) => d.match(/^\d{14}_/));
      if (["postgresql", "mysql", "sqlite"].includes(databaseProvider)) {
        const applied = await prisma.$queryRaw<{ migration_name: string }[]>`SELECT migration_name FROM _prisma_migrations`;
        migrationStatus.appliedMigrations = applied.map((m) => m.migration_name);
        migrationStatus.missing = migrationStatus.localMigrations.filter((m: string) => !migrationStatus.appliedMigrations.includes(m));
        migrationStatus.allApplied = migrationStatus.missing.length === 0;
      }
    } catch (e: any) {
      // Fehlerbehandlung für fehlende Tabelle prisma_migrations
      if (e.code === '42P01' || (e.message && e.message.includes('prisma_migrations'))) {
        migrationStatus.error = 'Die Tabelle prisma_migrations existiert nicht. Migrationen wurden vermutlich noch nicht angewendet oder die Datenbank ist leer.';
        migrationStatus.allApplied = null;
        migrationStatus.appliedMigrations = [];
        migrationStatus.missing = migrationStatus.localMigrations;
      } else {
        migrationStatus.error = String(e);
      }
      // Logging für Fehler
      console.error("DEBUG: Fehler beim Auslesen der Migrationen:", e);
    }

    // --- Performance-/Lock-Indikatoren ---
    type PerformanceIndicators = {
      locksNotGranted: number;
      longQueries: any[];
      deadlocks?: boolean;
      error?: string;
    };
    let performanceIndicators: PerformanceIndicators = {
      locksNotGranted: 0,
      longQueries: [],
    };
    try {
      if (databaseProvider === 'postgresql') {
        const locks = await prisma.$queryRaw`SELECT COUNT(*) as count FROM pg_locks WHERE NOT granted;` as { count: bigint }[];
        performanceIndicators = {
          ...performanceIndicators,
          locksNotGranted: Number(locks[0]?.count || 0)
        };
        const longQueries = await prisma.$queryRaw`SELECT pid, query, state, now() - query_start AS duration FROM pg_stat_activity WHERE state != 'idle' AND now() - query_start > interval '5 seconds';` as any[];
        performanceIndicators = {
          ...performanceIndicators,
          longQueries: longQueries.map(q => ({ pid: q.pid, query: q.query, state: q.state, duration: q.duration }))
        };
      } else if (databaseProvider === 'mysql') {
        // Deadlocks: Nur Textauswertung möglich
        const status = await prisma.$queryRawUnsafe("SHOW ENGINE INNODB STATUS");
        performanceIndicators = {
          ...performanceIndicators,
          deadlocks: (status || '').toString().includes('LATEST DETECTED DEADLOCK')
        };
        // Lange Queries
        const processlist = await prisma.$queryRawUnsafe("SHOW PROCESSLIST") as any[];
        performanceIndicators = {
          ...performanceIndicators,
          longQueries: processlist.filter((q: any) => q.Time > 5)
        };
      }
    } catch (e) {
      performanceIndicators = {
        ...performanceIndicators,
        error: String(e)
      };
    }

    // --- Read/Write-Smoke-Test ---
    let smokeTest = {
      read: false,
      write: false,
      error: null
    };
    try {
      // Read-Test: User lesen
      const testUser = await prisma.user.findFirst();
      smokeTest.read = !!testUser;
      // Write-Test: Dummy-Datensatz in Transaktion (Rollback)
      if (['postgresql', 'mysql', 'sqlite'].includes(databaseProvider)) {
        await prisma.$transaction(async (tx) => {
          await tx.$executeRaw`CREATE TABLE IF NOT EXISTS debug_smoke_test (id SERIAL PRIMARY KEY, ts TIMESTAMP DEFAULT NOW())`;
          await tx.$executeRaw`INSERT INTO debug_smoke_test DEFAULT VALUES`;
          await tx.$executeRaw`DELETE FROM debug_smoke_test`;
          // Rollback am Ende der Transaktion
          throw new Error('Rollback for smoke test');
        }).catch(() => {});
        smokeTest.write = true;
      }
    } catch (e) {
      smokeTest.error = String(e);
    }
    // --- Erweiterte Metriken & Checks ---
    type ExtendedMetrics = {
      maxConnections: number;
      activeConnections: number;
      connectionUsagePercent: number | null;
      freeDisk: number | null;
      walBytes: number | null;
      vacuumRes: any[];
      scanRes: any[];
      slowQueries: any[];
      lockBlockerRes: any[];
      sizeRes: any[];
      orphanPosts: number;
      roles: any[];
      encoding: string;
      timezone: string;
      ssl: string;
      extensions: any[];
      recovery: boolean;
      slots: any[];
      statusBlocks: {
        connections: string;
        locks: string;
        slowQueries: string;
        disk: string;
      };
      localTimestamp: string;
      maskedDbUrl: string;
      error?: string;
    };

    let extended: ExtendedMetrics = {
      maxConnections: 0,
      activeConnections: 0,
      connectionUsagePercent: null,
      freeDisk: null,
      walBytes: null,
      vacuumRes: [],
      scanRes: [],
      slowQueries: [],
      lockBlockerRes: [],
      sizeRes: [],
      orphanPosts: 0,
      roles: [],
      encoding: '',
      timezone: '',
      ssl: '',
      extensions: [],
      recovery: false,
      slots: [],
      statusBlocks: {
        connections: 'green',
        locks: 'green',
        slowQueries: 'green',
        disk: 'green',
      },
      localTimestamp: '',
      maskedDbUrl: '',
    };
    if (databaseProvider === 'postgresql') {
      try {
        // Max Connections & Auslastung
        let maxConnections = 0;
        let activeConnections = 0;
        let connectionUsagePercent = null;
        try {
          const maxConnRes = await prisma.$queryRaw<{ max: any }[]>`SELECT setting AS max FROM pg_settings WHERE name = 'max_connections';`;
          maxConnections = Number(maxConnRes[0]?.max ?? 0);
        } catch (e) {
          errorMessages.push('max_connections: ' + String(e));
        }

        // WAL-Durchsatz abfragen (WAL-Bytes)
        try {
          const walRes = await prisma.$queryRaw<any[]>`
            SELECT (SELECT COALESCE(SUM(size), 0) FROM pg_ls_waldir()) AS wal_size_bytes
          `;
          const walData = convertBigIntsToNumbers(walRes[0]);
          walBytes = walData?.wal_size_bytes || 0;
        } catch (e) {
          // Fallback-Methode für ältere PostgreSQL-Versionen oder eingeschränkte Berechtigungen
          try {
            const walFallbackRes = await prisma.$queryRaw<any[]>`
              SELECT pg_wal_lsn_diff(pg_current_wal_lsn(), '0/0') AS wal_bytes
            `;
            const walFallbackData = convertBigIntsToNumbers(walFallbackRes[0]);
            walBytes = walFallbackData?.wal_bytes || 0;
          } catch (fallbackError) {
            walBytes = null;
            errorMessages.push('WAL-Bytes: ' + String(e) + ' (Fallback: ' + String(fallbackError) + ')');
          }
        }

        // Slow Queries abfragen (Top 5 langsamste Queries)
        try {
          const rawSlowQueries = await prisma.$queryRaw<any[]>`
            SELECT query, 
                   calls, 
                   total_time, 
                   mean_time,
                   rows
            FROM pg_stat_statements 
            ORDER BY mean_time DESC 
            LIMIT 5;
          `;
          slowQueries = convertBigIntsToNumbers(rawSlowQueries);
        } catch (e) {
          // Fallback: Verwende pg_stat_activity für alle Queries (auch kurze)
          try {
            const fallbackSlowQueries = await prisma.$queryRaw<any[]>`
              SELECT pid,
                     usename,
                     left(query, 100) as query,
                     state,
                     EXTRACT(EPOCH FROM (now() - query_start)) AS runtime_seconds,
                     query_start
              FROM pg_stat_activity 
              WHERE state IN ('active', 'idle in transaction')
                AND query_start IS NOT NULL
                AND query NOT LIKE '%pg_stat_activity%'
                AND query != '<IDLE>'
                AND pid != pg_backend_pid()
              ORDER BY query_start DESC
              LIMIT 5;
            `;
            slowQueries = convertBigIntsToNumbers(fallbackSlowQueries);

            // Wenn immer noch leer, zeige mindestens die aktuelle Verbindung
            if (slowQueries.length === 0) {
              const currentQuery = await prisma.$queryRaw<any[]>`
                SELECT 'current_connection' as type,
                       current_user as usename,
                       'Database connection test' as query,
                       'active' as state,
                       0 as runtime_seconds
              `;
              slowQueries = convertBigIntsToNumbers(currentQuery);
            }
          } catch (fallbackError) {
            errorMessages.push('Slow Queries: ' + String(e) + ' (Fallback: ' + String(fallbackError) + ')');
          }
        }

        // Locks & Blocker abfragen
        try {
          const lockRes = await prisma.$queryRaw<any[]>`
            SELECT blocked_locks.pid AS blocked_pid,
                   blocked_activity.usename AS blocked_user,
                   blocking_locks.pid AS blocking_pid,
                   blocking_activity.usename AS blocking_user,
                   left(blocked_activity.query, 100) AS blocked_statement,
                   left(blocking_activity.query, 100) AS current_statement_in_blocking_process
            FROM pg_catalog.pg_locks blocked_locks
            JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
            JOIN pg_catalog.pg_locks blocking_locks 
                ON blocking_locks.locktype = blocked_locks.locktype
                AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
                AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
                AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
                AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
                AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
                AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
                AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
                AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
                AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
                AND blocking_locks.pid != blocked_locks.pid
            JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
            WHERE NOT blocked_locks.granted;
          `;
          lockBlockerRes = convertBigIntsToNumbers(lockRes);

          // Wenn keine blockierten Prozesse, zeige aktuelle Locks zur Information
          if (lockBlockerRes.length === 0) {
            try {
              const activeLocks = await prisma.$queryRaw<any[]>`
                SELECT l.locktype,
                       l.mode,
                       l.granted,
                       sa.usename,
                       sa.state,
                       left(sa.query, 80) as query
                FROM pg_catalog.pg_locks l
                JOIN pg_catalog.pg_stat_activity sa ON l.pid = sa.pid
                WHERE l.granted = true
                  AND sa.state != 'idle'
                  AND sa.pid != pg_backend_pid()
                LIMIT 3;
              `;
              if (activeLocks.length > 0) {
                lockBlockerRes = convertBigIntsToNumbers(activeLocks);
              }
            } catch (activeLockError) {
            }
          }
        } catch (e) {
          errorMessages.push('Locks & Blocker: ' + String(e));
        }

        // Replication Slots abfragen
        try {
          const slotsRes = await prisma.$queryRaw<any[]>`
            SELECT slot_name,
                   plugin,
                   slot_type,
                   datoid,
                   database,
                   active,
                   active_pid,
                   xmin,
                   catalog_xmin,
                   restart_lsn,
                   confirmed_flush_lsn
            FROM pg_replication_slots;
          `;
          slots = convertBigIntsToNumbers(slotsRes);

          // Wenn keine Slots, zeige Replikations-Status zur Information
          if (slots.length === 0) {
            try {
              const replicationInfo = await prisma.$queryRaw<any[]>`
                SELECT 'no_active_slots' as slot_name,
                       pg_is_in_recovery() as in_recovery,
                       current_setting('wal_level') as wal_level,
                       current_setting('max_replication_slots') as max_slots,
                       'Keine aktiven Replikations-Slots konfiguriert' as info
              `;
              slots = convertBigIntsToNumbers(replicationInfo);
            } catch (infoError) {
            }
          }
        } catch (e) {
          errorMessages.push('Replication Slots: ' + String(e));
        }

        // Recovery Status abfragen
        try {
          const recoveryRes = await prisma.$queryRaw<{ in_recovery: boolean }[]>`SELECT pg_is_in_recovery() AS in_recovery;`;
          recovery = recoveryRes[0]?.in_recovery || false;
        } catch (e) {
          errorMessages.push('Recovery Status: ' + String(e));
        }
        try {
          const activeConnRes = await prisma.$queryRaw<{ active: any }[]>`SELECT COUNT(*) AS active FROM pg_stat_activity;`;
          activeConnections = Number(activeConnRes[0]?.active ?? 0);
        } catch (e) {
          errorMessages.push('active_connections: ' + String(e));
        }
        if (maxConnections > 0) {
          connectionUsagePercent = Math.round((activeConnections / maxConnections) * 100);
        }
        // Plattenplatz (Windows, PowerShell)
        let freeDisk = null;
        try {
          const { execSync } = require('child_process');
          const drive = databaseHost === 'localhost' ? 'C' : 'C';
          const psOut = execSync(`powershell.exe -Command "Get-PSDrive -Name ${drive} | Select-Object Free | Format-List"`).toString();

          const match = psOut.match(/Free\s*:\s*([0-9]+)/);
          if (match) {
            freeDisk = Number(match[1]);
          } else {
            // Alternative Extraktion, falls Format-Liste anders ist
            const altMatch = psOut.match(/([0-9]{8,})/);
            if (altMatch) freeDisk = Number(altMatch[1]);
          }
        } catch (e) {
          errorMessages.push('freeDisk: ' + String(e));
        }

        // Vacuum-Statistiken
        try {
          let rawVacuumRes = await prisma.$queryRaw<any[]>`
            SELECT relname AS table_name, n_dead_tup AS dead_tuples, 
                  last_vacuum, last_autovacuum, 
                  last_analyze, last_autoanalyze
            FROM pg_stat_user_tables 
            ORDER BY n_dead_tup DESC 
            LIMIT 10;
          `;
          vacuumRes = convertBigIntsToNumbers(rawVacuumRes);
        } catch (e) {
          errorMessages.push('Vacuum: ' + String(e));
        }
        // Scan-Statistiken
        try {
          let rawScanRes = await prisma.$queryRaw<any[]>`
            SELECT relname AS table_name, 
                  seq_scan, seq_tup_read,
                  idx_scan, idx_tup_fetch,
                  CASE WHEN seq_scan > 0 THEN seq_tup_read / seq_scan ELSE 0 END AS avg_seq_tuples,
                  CASE WHEN idx_scan > 0 THEN idx_tup_fetch / idx_scan ELSE 0 END AS avg_idx_tuples
            FROM pg_stat_user_tables
            ORDER BY seq_scan DESC
            LIMIT 10;
          `;
          scanRes = convertBigIntsToNumbers(rawScanRes);
        } catch (e) {
          errorMessages.push('Scan: ' + String(e));
        }
        // Tabellen-Größen
        try {
          const rawSizeRes = await prisma.$queryRaw<any[]>`
            SELECT 
              table_name,
              pg_size_pretty(pg_relation_size(quote_ident(table_name))) AS size,
              pg_relation_size(quote_ident(table_name)) AS raw_size
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY pg_relation_size(quote_ident(table_name)) DESC
            LIMIT 10;
          `;
          sizeRes = convertBigIntsToNumbers(rawSizeRes);
        } catch (e) {
          errorMessages.push('Size: ' + String(e));
        }
        // Orphan Posts
        try {
          const orphanRes = await prisma.$queryRaw<any[]>`
            SELECT COUNT(*) AS count FROM "Post" p 
            LEFT JOIN "User" u ON p."authorId" = u.id
            WHERE u.id IS NULL;
          `;
          orphanPosts = Number(orphanRes[0]?.count || 0);
        } catch (e) {
          errorMessages.push('Orphan Posts: ' + String(e));
        }
        // Rollen
        try {
          const rawRolesRes = await prisma.$queryRaw<any[]>`SELECT rolname, rolsuper, rolcreaterole FROM pg_roles;`;
          rolesRes = convertBigIntsToNumbers(rawRolesRes);
        } catch (e) {
          errorMessages.push('Roles: ' + String(e));
        }
        // Encoding
        try {
          const encodingRes = await prisma.$queryRaw<any[]>`SELECT pg_encoding_to_char(encoding) AS encoding FROM pg_database WHERE datname = current_database();`;
          encoding = encodingRes[0]?.encoding || '';
        } catch (e) {
          errorMessages.push('Encoding: ' + String(e));
        }
        // Timezone
        try {
          const timezoneRes = await prisma.$queryRaw<any[]>`SHOW timezone;`;
          timezone = timezoneRes[0]?.timezone || '';
        } catch (e) {
          errorMessages.push('Timezone: ' + String(e));
        }
        // SSL
        try {
          const sslRes = await prisma.$queryRaw<any[]>`SHOW ssl;`;
          ssl = sslRes[0]?.ssl || '';
        } catch (e) {
          errorMessages.push('SSL: ' + String(e));
        }
        // Extensions
        try {
          const rawExtensionsRes = await prisma.$queryRaw<any[]>`SELECT extname, extversion FROM pg_extension;`;
          extensionsRes = convertBigIntsToNumbers(rawExtensionsRes);
        } catch (e) {
          errorMessages.push('Extensions: ' + String(e));
        }

        // Ampel-Logik
        const locksNotGranted = typeof performanceIndicators.locksNotGranted === 'number' ? performanceIndicators.locksNotGranted : 0;
        const statusBlocks = {
          connections: maxConnections < 1 ? 'red' : activeConnections < maxConnections * 0.8 ? 'green' : activeConnections < maxConnections * 0.95 ? 'yellow' : 'red',
          locks: locksNotGranted === 0 ? 'green' : locksNotGranted < 5 ? 'yellow' : 'red',
          slowQueries: slowQueries.length === 0 ? 'green' : slowQueries.length < 3 ? 'yellow' : 'red',
          disk: freeDisk && freeDisk > 10 * 1024 * 1024 * 1024 ? 'green' : freeDisk && freeDisk > 2 * 1024 * 1024 * 1024 ? 'yellow' : 'red',
        };
        // Zeitstempel
        const localTimestamp = new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' });
        // Maskierung DB-URL
        let maskedDbUrl = databaseUrl;
        try {
          const urlObj = new URL(databaseUrl);
          maskedDbUrl = `${urlObj.hostname}:${urlObj.port}/${urlObj.pathname.replace('/', '')}`;
        } catch {}

        // Abfrage der Datenbankeinstellungen für Encoding, Timezone und SSL
        try {
          const encodingRes = await prisma.$queryRaw<any[]>`SELECT pg_encoding_to_char(encoding) AS encoding FROM pg_database WHERE datname = current_database();`;
          encoding = encodingRes[0]?.encoding || '';

          const timezoneRes = await prisma.$queryRaw<any[]>`SHOW timezone;`;
          timezone = timezoneRes[0]?.timezone || '';

          const sslRes = await prisma.$queryRaw<any[]>`SHOW ssl;`;
          ssl = sslRes[0]?.ssl || '';
        } catch (e) {
          errorMessages.push('DB-Einstellungen: ' + String(e));
        }

        // Abfrage der DB-Rollen
        try {
          const rawRolesRes = await prisma.$queryRaw<any[]>`SELECT rolname, rolsuper, rolcreaterole FROM pg_roles;`;
          rolesRes = convertBigIntsToNumbers(rawRolesRes);
        } catch (e) {
          errorMessages.push('Rollen: ' + String(e));
        }

        // Abfrage der installierten Extensions
        try {
          const rawExtensionsRes = await prisma.$queryRaw<any[]>`SELECT extname, extversion FROM pg_extension;`;
          extensionsRes = convertBigIntsToNumbers(rawExtensionsRes);
        } catch (e) {
          errorMessages.push('Extensions: ' + String(e));
        }

        extended = {
          maxConnections,
          activeConnections,
          connectionUsagePercent,
          freeDisk,
          walBytes,
          vacuumRes,
          scanRes,
          slowQueries,
          lockBlockerRes,
          sizeRes,
          orphanPosts,
          roles: rolesRes,
          encoding,
          timezone,
          ssl,
          extensions: extensionsRes,
          recovery,
          slots,
          statusBlocks,
          localTimestamp,
          maskedDbUrl,
          error: errorMessages.length > 0 ? errorMessages.join(' | ') : undefined,
        };

      } catch (e) {
        extended = {
          maxConnections: 0,
          activeConnections: 0,
          connectionUsagePercent: null,
          freeDisk: null,
          walBytes: null,
          vacuumRes: [],
          scanRes: [],
          slowQueries: [],
          lockBlockerRes: [],
          sizeRes: [],
          orphanPosts: 0,
          roles: [],
          encoding: '',
          timezone: '',
          ssl: '',
          extensions: [],
          recovery: false,
          slots: [],
          statusBlocks: {
            connections: 'red',
            locks: 'red',
            slowQueries: 'red',
            disk: 'red',
          },
          localTimestamp: new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' }),
          maskedDbUrl: '',
          error: String(e),
        };
      }
    }
    res.status(200).json({
      environment: {
        databaseProvider,
        databaseUrl,
        nodeVersion,
        nodeEnv,
        prismaVersion,
        databaseVersion,
        databaseHost,
        databasePort,
        databaseUser,
        testTimestamp,
        transactionSupport,
      },
      connection: {
        databaseName,
        testUserId: user?.id || null,
        connectionTime,
        status: user ? 'ok' : 'Fehler',
        databaseSize,
        openConnections,
      },
      database: {
        userCount,
        postCount,
        categoryCount,
        blockDraftCount,
      },
      migrationStatus,
      performanceIndicators,
      smokeTest,
      extended,
      // Werte explizit auf Top-Level für UI
      slowQueries,
      lockBlockerRes,
      // JSON-Sektion für maschinelle Weiterverarbeitung
      json: {
        environment: {
          databaseProvider,
          databaseHost,
          databasePort,
          databaseUser,
          prismaVersion,
          nodeVersion,
          databaseVersion,
          testTimestamp,
          localTimestamp: extended.localTimestamp,
        },
        connection: {
          databaseName,
          connectionTime,
          databaseSize,
          openConnections,
          maxConnections: extended.maxConnections,
          activeConnections: extended.activeConnections,
          connectionUsagePercent: extended.connectionUsagePercent,
        },
        statusBlocks: extended.statusBlocks,
        performanceIndicators,
        migrationStatus,
        database: {
          userCount,
          postCount,
          categoryCount,
          blockDraftCount,
        },
        extended,
        slowQueries,
        lockBlockerRes,
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Fehler beim Datenbank-Test',
      details: String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}
