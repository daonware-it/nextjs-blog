import * as React from 'react';
import { useState, useRef, useCallback, DragEvent, ReactNode } from 'react';
import styles from '../admin.module.css';

// Lokale CSS-Stile für das Datei-Upload-Element
const fileUploadStyles = {
  dropzone: {
    border: '2px dashed #ccc',
    borderRadius: '4px',
    padding: '20px',
    textAlign: 'center' as const,
    cursor: 'pointer',
    backgroundColor: '#fafafa',
    transition: 'all 0.3s ease',
    marginBottom: '15px',
    position: 'relative' as const,
    minHeight: '120px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropzoneActive: {
    border: '2px dashed #1976d2',
    backgroundColor: 'rgba(25, 118, 210, 0.05)',
  },
  hiddenInput: {
    width: '0.1px',
    height: '0.1px',
    opacity: 0,
    overflow: 'hidden',
    position: 'absolute' as const,
    zIndex: -1,
  },
  browseButton: {
    display: 'inline-block',
    padding: '8px 20px',
    marginTop: '10px',
    backgroundColor: '#1976d2',
    color: 'white',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  },
  fileInfo: {
    marginTop: '10px',
    backgroundColor: 'rgba(25, 118, 210, 0.1)',
    padding: '10px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  fileName: {
    marginLeft: '10px',
    wordBreak: 'break-all' as const,
    flex: 1,
  },
  removeButton: {
    background: 'none',
    border: 'none',
    color: '#f44336',
    cursor: 'pointer',
    padding: '0 5px',
    fontSize: '16px',
  },
  icon: {
    color: '#1976d2',
    marginBottom: '10px',
  }
};

const System: React.FC = () => {
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [error, setError] = useState<string | React.ReactNode | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filename, setFilename] = useState('db-backup.zip');
  const [isDragActive, setIsDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBackup = async () => {
    setBackupLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch('/api/admin/backup');
      if (!res.ok) throw new Error('Fehler beim Backup');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename && filename.trim() ? filename.trim() : 'db-backup.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setSuccess('Backup wurde erfolgreich erstellt und heruntergeladen.');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBackupLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    if (!file.name.endsWith('.zip')) {
      setError('Die Datei muss im ZIP-Format vorliegen.');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return false;
    }
    setSelectedFile(file);
    setError(null);
    return true;
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
      // Aktualisiere auch den Wert des versteckten Datei-Inputs
      if (fileInputRef.current) {
        // Dies funktioniert nicht direkt in allen Browsern, aber wir setzen selectedFile bereits
        // fileInputRef.current.files = e.dataTransfer.files;
      }
    }
  }, []);

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleOpenFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRestore = async () => {
    if (!selectedFile) {
      setError('Bitte wählen Sie eine Backup-Datei aus.');
      return;
    }

    setRestoreLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('backup', selectedFile);

      const res = await fetch('/api/admin/restore', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        let errorMessage = errorData.error || 'Fehler beim Wiederherstellen des Backups';

        if (errorData.details) {
          errorMessage += ': ' + errorData.details;
        }

        if (errorData.suggestion) {
          errorMessage += '\n\n' + errorData.suggestion;
        }

        throw new Error(errorMessage);
      }

      const data = await res.json();

      // Detailliertere Erfolgsmeldung basierend auf der Serverantwort
      let successMessage = 'Backup wurde erfolgreich eingespielt.';

      if (data.tables) {
        if (typeof data.tables === 'object') {
          successMessage += ` ${data.tables.imported} von ${data.tables.total} Tabellen wurden importiert.`;

          if (data.tables.skipped > 0) {
            successMessage += ` ${data.tables.skipped} Tabellen wurden übersprungen.`;
          }

          if (data.tables.failed > 0) {
            successMessage += ` Bei ${data.tables.failed} Tabellen traten Fehler auf.`;
          }
        } else if (Array.isArray(data.tables)) {
          successMessage += ` ${data.tables.length} Tabellen wurden importiert.`;
        }
      }

      if (data.metadata?.createdAt) {
        const backupDate = new Date(data.metadata.createdAt);
        successMessage += ` Backup vom ${backupDate.toLocaleDateString('de-DE')} um ${backupDate.toLocaleTimeString('de-DE')}.`;
      }

      setSuccess(successMessage);

      // Formular zurücksetzen
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (e: any) {
      // Fehlermeldung formatieren, um Zeilenumbrüche zu berücksichtigen
      const errorLines = e.message.split('\n\n');
      if (errorLines.length > 1) {
        setError(
          React.createElement('div', {}, [
            React.createElement('p', {}, errorLines[0]),
            React.createElement('p', { className: styles.adminHint }, errorLines[1])
          ])
        );
      } else {
        setError(e.message);
      }
    } finally {
      setRestoreLoading(false);
    }
  };

  const handleCleanupBlockDrafts = async () => {
    setCleanupLoading(true);
    setCleanupResult(null);
    setError(null);
    try {
      const res = await fetch('/api/admin/cleanup-blockdrafts', { method: 'POST' });
      if (!res.ok) throw new Error('Fehler bei der Datenbankbereinigung');
      const data = await res.json();
      setCleanupResult(`${data.deletedCount} BlockDrafts wurden entfernt.`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCleanupLoading(false);
    }
  };

  return (
    <div className={styles.adminSection}>
      <div className={styles.adminCard}>
        <div className={styles.adminSectionTitle + ' ' + styles.flexRow}>
          <span className={styles.iconWrap}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1976d2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 9v6M12 9v6M16 9v6"/></svg>
          </span>
          <span>Datenbanksicherung</span>
        </div>

        {success && <p className={styles.adminSuccess}>{success}</p>}
        {error && <p className={styles.adminError}>{error}</p>}

        <div className={styles.adminSubsection}>
          <h3>Backup erstellen</h3>
          <p className={styles.adminDescription}>Erstelle ein Backup der aktuellen Datenbank und lade es als ZIP-Datei herunter.</p>
          <div className={styles.formGroup}>
            <label htmlFor="backup-filename" className={styles.adminLabel}>Dateiname</label>
            <input
              id="backup-filename"
              type="text"
              value={filename}
              onChange={e => setFilename(e.target.value)}
              placeholder="db-backup.zip"
              className={styles.adminInput}
            />
          </div>
          <button 
            onClick={handleBackup} 
            disabled={backupLoading} 
            className={styles.adminButton}
          >
            {backupLoading ? (
              <span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1976d2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" strokeDasharray="60" strokeDashoffset={backupLoading ? 30 : 0} /></svg>
                Backup wird erstellt...
              </span>
            ) : (
              <span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1976d2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
                Backup herunterladen
              </span>
            )}
          </button>
        </div>

        <div className={styles.adminSubsection}>
          <h3>Backup wiederherstellen</h3>
          <p className={styles.adminDescription}>Spiele ein zuvor erstelltes Backup wieder ein. Die Daten werden in die Datenbank importiert.</p>

          <div className={styles.formGroup}>
            <label className={styles.adminLabel}>Backup-Datei</label>
            <div
              style={{
                ...fileUploadStyles.dropzone,
                ...(isDragActive ? fileUploadStyles.dropzoneActive : {})
              }}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={handleOpenFileDialog}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".zip"
                style={fileUploadStyles.hiddenInput}
                id="restore-file"
              />

              {!selectedFile ? (
                <>
                  <div style={fileUploadStyles.icon}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#1976d2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 14V18C21 19.1046 20.1046 20 19 20H5C3.89543 20 3 19.1046 3 18V14" />
                      <path d="M12 3L12 15" />
                      <path d="M16 7L12 3L8 7" />
                    </svg>
                  </div>
                  <p>Ziehen Sie eine ZIP-Datei hierher oder</p>
                  <div style={fileUploadStyles.browseButton}>Datei auswählen</div>
                </>
              ) : (
                <div style={fileUploadStyles.fileInfo}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1976d2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path>
                    <path d="M14 2v6h6"></path>
                    <path d="M16 13H8"></path>
                    <path d="M16 17H8"></path>
                    <path d="M10 9H9"></path>
                  </svg>
                  <span style={fileUploadStyles.fileName}>{selectedFile.name}</span>
                  <button 
                    type="button" 
                    onClick={(e) => {
                      e.stopPropagation(); 
                      handleRemoveFile();
                    }} 
                    style={fileUploadStyles.removeButton}
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>

          <button 
            onClick={handleRestore} 
            disabled={restoreLoading || !selectedFile} 
            className={`${styles.adminButton} ${styles.warningButton}`}
          >
            {restoreLoading ? (
              <span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1976d2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" strokeDasharray="60" strokeDashoffset={restoreLoading ? 30 : 0} /></svg>
                Backup wird eingespielt...
              </span>
            ) : (
              <span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1976d2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                Backup wiederherstellen
              </span>
            )}
          </button>
          <p className={styles.adminWarning}>
            Achtung: Das Wiederherstellen eines Backups kann zu Datenverlust führen, wenn das Backup veraltet ist. Stellen Sie sicher, dass Sie ein aktuelles Backup verwenden.
          </p>
        </div>

        <div className={styles.adminSubsection}>
          <h3>Datenbankbereinigung</h3>
          <p className={styles.adminDescription}>Entfernt alte BlockDrafts (älter als 30 Tage) aus der Datenbank.</p>
          <button
            onClick={handleCleanupBlockDrafts}
            disabled={cleanupLoading}
            className={styles.adminButton}
          >
            {cleanupLoading ? (
              <span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1976d2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" strokeDasharray="60" strokeDashoffset={cleanupLoading ? 30 : 0} /></svg>
                Bereinigung läuft...
              </span>
            ) : (
              <span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1976d2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M9 6v12M15 6v12"/></svg>
                Datenbankbereinigung starten
              </span>
            )}
          </button>
          {cleanupResult && <p className={styles.adminSuccess}>{cleanupResult}</p>}
        </div>
      </div>
    </div>
  );
};

export default System;
