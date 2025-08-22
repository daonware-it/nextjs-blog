import React, { useState } from 'react';
import styles from '../admin.module.css';

interface DebugProps {
  ensureSession: () => Promise<boolean>;
}

const Debug: React.FC<DebugProps> = ({ ensureSession }) => {
  const [isLoadingDbTest, setIsLoadingDbTest] = useState(false);
  const [dbTestInfo, setDbTestInfo] = useState<any>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  const fetchDbTestInfo = async () => {
    try {
      if (!(await ensureSession())) return;
      setIsLoadingDbTest(true);
      setErrorDetails(null);
      const response = await fetch('/api/admin/debug/database', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setDbTestInfo(data);
      } else {
        let errorText = response.statusText;
        try {
          const errorData = await response.json();
          errorText = errorData.error + (errorData.details ? ("\n" + errorData.details) : "");
        } catch {}
        setErrorDetails(errorText);
        setDbTestInfo(null);
      }
    } catch (error) {
      setErrorDetails(String(error));
      setDbTestInfo(null);
    } finally {
      setIsLoadingDbTest(false);
    }
  };

  return (
    <div className={styles.adminSection}>
      <h2 className={styles.adminSectionTitle}>Datenbank-Diagnose</h2>
      <p>Hier können Sie Informationen zur Datenbankverbindung und Daten einsehen.</p>
      
      <button 
        className={styles.adminButton}
        onClick={fetchDbTestInfo}
        disabled={isLoadingDbTest}
        style={{ marginBottom: '16px' }}
      >
        {isLoadingDbTest ? 'Wird geladen...' : 'Datenbank testen'}
      </button>
      
      {isLoadingDbTest ? (
        <div className={styles.loadingState}>
          <p>Datenbank-Informationen werden geladen...</p>
        </div>
      ) : dbTestInfo ? (
        <div className={styles.debugInfo}>
          <h3>Umgebungsinformationen</h3>
          <div className={styles.debugCard}>
            <p><strong>Node.js Version:</strong> {dbTestInfo.environment.nodeVersion}</p>
            <p><strong>Prisma Version:</strong> {dbTestInfo.environment.prismaVersion}</p>
            <p><strong>Datenbank-Provider:</strong> {dbTestInfo.environment.databaseProvider}</p>
            <p><strong>Datenbank-Version:</strong> {dbTestInfo.environment.databaseVersion}</p>
            <p><strong>Datenbank-Host:</strong> {dbTestInfo.environment.databaseHost}</p>
            <p><strong>Datenbank-Port:</strong> {dbTestInfo.environment.databasePort}</p>
            <p><strong>Datenbank-Benutzer:</strong> {dbTestInfo.environment.databaseUser}</p>
            <p><strong>Testzeitpunkt:</strong> {dbTestInfo.environment.testTimestamp}</p>
            <p><strong>Transaktionsfähig:</strong> {dbTestInfo.environment.transactionSupport}</p>
          </div>
          
          <h3>Datenbankverbindung</h3>
          <div className={styles.debugCard}>
            <p><strong>Status:</strong> {dbTestInfo.connection.status}</p>
            <p><strong>Verbindungszeit:</strong> {dbTestInfo.connection.connectionTime} ms</p>
            <p><strong>Datenbankname:</strong> {dbTestInfo.connection.databaseName}</p>
            {dbTestInfo.connection.databaseSize && (
              <p><strong>Datenbankgröße:</strong> {dbTestInfo.connection.databaseSize}</p>
            )}
            {dbTestInfo.connection.openConnections !== null && (
              <p><strong>Offene Verbindungen:</strong> {dbTestInfo.connection.openConnections}</p>
            )}
          </div>
          
          <h3>Tabellenstatistik</h3>
          <div className={styles.debugCard}>
            <p><strong>Benutzer:</strong> {dbTestInfo.database.userCount}</p>
            <p><strong>Blog-Beiträge:</strong> {dbTestInfo.database.postCount}</p>
            <p><strong>Kategorien:</strong> {dbTestInfo.database.categoryCount}</p>
            <p><strong>Block-Entwürfe:</strong> {dbTestInfo.database.blockDraftCount}</p>
          </div>

          <h3>Schema/Migrations-Status</h3>
          <div className={styles.debugCard}>
            <p><strong>Alle Migrationen angewendet:</strong> {dbTestInfo.migrationStatus?.allApplied === true ? 'Ja' : dbTestInfo.migrationStatus?.allApplied === false ? 'Nein' : 'Unbekannt'}</p>
            {dbTestInfo.migrationStatus?.missing && dbTestInfo.migrationStatus.missing.length > 0 && (
              <p><strong>Fehlende Migrationen:</strong> {dbTestInfo.migrationStatus.missing.join(', ')}</p>
            )}
            {dbTestInfo.migrationStatus?.localMigrations && (
              <details>
                <summary>Lokale Migrationen</summary>
                <pre>{dbTestInfo.migrationStatus.localMigrations.join('\n')}</pre>
              </details>
            )}
            {dbTestInfo.migrationStatus?.appliedMigrations && (
              <details>
                <summary>Angewendete Migrationen</summary>
                <pre>{dbTestInfo.migrationStatus.appliedMigrations.join('\n')}</pre>
              </details>
            )}
            {dbTestInfo.migrationStatus?.error && (
              <p style={{color:'red'}}><strong>Fehler:</strong> {dbTestInfo.migrationStatus.error}</p>
            )}
          </div>

          <h3>Performance-/Lock-Indikatoren</h3>
          <div className={styles.debugCard}>
            {typeof dbTestInfo.performanceIndicators?.locksNotGranted !== 'undefined' && (
              <p><strong>Nicht vergebene Locks:</strong> {dbTestInfo.performanceIndicators.locksNotGranted}</p>
            )}
            {dbTestInfo.performanceIndicators?.longQueries && dbTestInfo.performanceIndicators.longQueries.length > 0 && (
              <details>
                <summary>Lange Queries (&gt;5s)</summary>
                <pre>{JSON.stringify(dbTestInfo.performanceIndicators.longQueries, null, 2)}</pre>
              </details>
            )}
            {typeof dbTestInfo.performanceIndicators?.deadlocks !== 'undefined' && (
              <p><strong>Deadlocks erkannt:</strong> {dbTestInfo.performanceIndicators.deadlocks ? 'Ja' : 'Nein'}</p>
            )}
            {dbTestInfo.performanceIndicators?.error && (
              <p style={{color:'red'}}><strong>Fehler:</strong> {dbTestInfo.performanceIndicators.error}</p>
            )}
          </div>

          <h3>Read/Write-Smoke-Test</h3>
          <div className={styles.debugCard}>
            <p><strong>Read-Test erfolgreich:</strong> {dbTestInfo.smokeTest?.read === true ? 'Ja' : dbTestInfo.smokeTest?.read === false ? 'Nein' : 'Unbekannt'}</p>
            <p><strong>Write-Test erfolgreich:</strong> {dbTestInfo.smokeTest?.write === true ? 'Ja' : dbTestInfo.smokeTest?.write === false ? 'Nein' : 'Unbekannt'}</p>
            {dbTestInfo.smokeTest?.error && (
              <p style={{color:'red'}}><strong>Fehler:</strong> {dbTestInfo.smokeTest.error}</p>
            )}
          </div>

          {/* Erweiterte Metriken & Checks */}
          {dbTestInfo.extended && (
            <>
              <h3>Verbindungs-/Pool-Auslastung <span style={{color:dbTestInfo.extended.statusBlocks?.connections}}>&#9679;</span></h3>
              <div className={styles.debugCard}>
                <p><strong>Max Connections:</strong> {dbTestInfo.extended.maxConnections}</p>
                <p><strong>Aktive Connections:</strong> {dbTestInfo.extended.activeConnections}</p>
                <p><strong>Auslastung:</strong> {dbTestInfo.extended.connectionUsagePercent}%</p>
              </div>
              <h3>Plattenplatz <span style={{color:dbTestInfo.extended.statusBlocks?.disk}}>&#9679;</span></h3>
              <div className={styles.debugCard}>
                <p><strong>Freier Plattenplatz:</strong> {dbTestInfo.extended.freeDisk ? (dbTestInfo.extended.freeDisk/1024/1024/1024).toFixed(2) + ' GB' : 'Unbekannt'}</p>
              </div>
              <h3>WAL-Durchsatz</h3>
              <div className={styles.debugCard}>
                <p><strong>WAL-Größe:</strong> {
                  dbTestInfo.extended.walBytes !== null && dbTestInfo.extended.walBytes !== undefined 
                    ? `${(dbTestInfo.extended.walBytes / 1024 / 1024).toFixed(2)} MB` 
                    : 'Unbekannt'
                }</p>
              </div>
              <h3>Autovacuum/Analyse & Dead Tuples</h3>
              <div className={styles.debugCard}>
                <details><summary>Top Dead Tuples</summary>
                  <pre>{JSON.stringify(dbTestInfo.extended.vacuumRes, null, 2)}</pre>
                </details>
              </div>
              <h3>Seq-/Index-Scans</h3>
              <div className={styles.debugCard}>
                <details><summary>Hotspot-Tabellen</summary>
                  <pre>{JSON.stringify(dbTestInfo.extended.scanRes, null, 2)}</pre>
                </details>
              </div>
              <h3>Slow Queries <span style={{color:dbTestInfo.extended.statusBlocks?.slowQueries}}>&#9679;</span></h3>
              <div className={styles.debugCard}>
                <details><summary>Top 5</summary>
                  <pre>{JSON.stringify(dbTestInfo.extended.slowQueries, null, 2)}</pre>
                </details>
              </div>
              <h3>Locks & Blocker <span style={{color:dbTestInfo.extended.statusBlocks?.locks}}>&#9679;</span></h3>
              <div className={styles.debugCard}>
                <details><summary>Blockierte Prozesse</summary>
                  <pre>{JSON.stringify(dbTestInfo.extended.lockBlockerRes, null, 2)}</pre>
                </details>
              </div>
              <h3>Größte Tabellen/Indizes</h3>
              <div className={styles.debugCard}>
                <details><summary>Top 10</summary>
                  <pre>{JSON.stringify(dbTestInfo.extended.sizeRes, null, 2)}</pre>
                </details>
              </div>
              <h3>Integrität & Datenqualität</h3>
              <div className={styles.debugCard}>
                <p><strong>Posts ohne User:</strong> {dbTestInfo.extended.orphanPosts}</p>
              </div>
              <h3>Sicherheit/Konfiguration</h3>
              <div className={styles.debugCard}>
                <details><summary>Rollen</summary>
                  <pre>{JSON.stringify(dbTestInfo.extended.roles, null, 2)}</pre>
                </details>
                <p><strong>Encoding:</strong> {dbTestInfo.extended.encoding}</p>
                <p><strong>Timezone:</strong> {dbTestInfo.extended.timezone}</p>
                <p><strong>SSL:</strong> {dbTestInfo.extended.ssl}</p>
                <details><summary>Extensions</summary>
                  <pre>{JSON.stringify(dbTestInfo.extended.extensions, null, 2)}</pre>
                </details>
              </div>
              <h3>Replikation</h3>
              <div className={styles.debugCard}>
                <p><strong>Recovery:</strong> {dbTestInfo.extended.recovery ? 'Standby' : 'Primary'}</p>
                <details><summary>Slots</summary>
                  <pre>{JSON.stringify(dbTestInfo.extended.slots, null, 2)}</pre>
                </details>
              </div>
              <h3>Zeitstempel</h3>
              <div className={styles.debugCard}>
                <p><strong>UTC:</strong> {dbTestInfo.environment.testTimestamp}</p>
                <p><strong>Lokalzeit:</strong> {dbTestInfo.extended.localTimestamp}</p>
              </div>
              <h3>Maskierte DB-URL</h3>
              <div className={styles.debugCard}>
                <p><strong>DB-URL:</strong> {dbTestInfo.extended.maskedDbUrl}</p>
              </div>
              <h3>JSON-Sektion</h3>
              <details>
                <summary>Maschinelle Werte</summary>
                <pre>{JSON.stringify(dbTestInfo.json, null, 2)}</pre>
              </details>
            </>
          )}
        </div>
      ) : (
        <p>Klicken Sie auf "Datenbank testen", um Informationen zur Datenbankverbindung zu erhalten.</p>
      )}

      {errorDetails && (
        <div className={styles.errorState} style={{ color: 'red', marginBottom: '16px' }}>
          <strong>Fehler beim Abrufen der Datenbank-Informationen:</strong>
          <pre>{errorDetails}</pre>
        </div>
      )}
    </div>
  );
};

export default Debug;
