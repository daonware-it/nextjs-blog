import React, { useState } from 'react';
import styles from '../admin.module.css';

interface DebugProps {
  ensureSession: () => Promise<boolean>;
}

const Debug: React.FC<DebugProps> = ({ ensureSession }) => {
  const [isLoadingDbTest, setIsLoadingDbTest] = useState(false);
  const [dbTestInfo, setDbTestInfo] = useState<any>(null);

  
  const fetchDbTestInfo = async () => {
    try {
      
      if (!(await ensureSession())) return;
      
      setIsLoadingDbTest(true);
      
      
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
        console.error('Fehler beim Abrufen der Datenbank-Informationen:', response.statusText);
        alert(`Fehler beim Abrufen der Datenbank-Informationen: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Fehler beim Abrufen der Datenbank-Informationen:', error);
      alert('Ein unerwarteter Fehler ist aufgetreten. Bitte überprüfen Sie die Konsole für Details.');
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
            <p><strong>Umgebung:</strong> {dbTestInfo.environment.nodeEnv}</p>
            <p><strong>Prisma Version:</strong> {dbTestInfo.environment.prismaVersion}</p>
            <p><strong>Datenbank-Provider:</strong> {dbTestInfo.environment.databaseProvider}</p>
          </div>
          
          <h3>Datenbankverbindung</h3>
          <div className={styles.debugCard}>
            <p><strong>Status:</strong> {dbTestInfo.connection.status}</p>
            <p><strong>Verbindungszeit:</strong> {dbTestInfo.connection.connectionTime} ms</p>
            <p><strong>Datenbankname:</strong> {dbTestInfo.connection.databaseName}</p>
          </div>
          
          <h3>Tabellenstatistik</h3>
          <div className={styles.debugCard}>
            <p><strong>Benutzer:</strong> {dbTestInfo.database.userCount}</p>
            <p><strong>Blog-Beiträge:</strong> {dbTestInfo.database.postCount}</p>
            <p><strong>Kategorien:</strong> {dbTestInfo.database.categoryCount}</p>
            <p><strong>Block-Entwürfe:</strong> {dbTestInfo.database.blockDraftCount}</p>
          </div>
          
          {dbTestInfo.database.users.length > 0 && (
            <div>
              <h3>Beispielbenutzer</h3>
              <div className={styles.debugCard}>
                <table className={styles.adminTable} style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Benutzername</th>
                      <th>E-Mail</th>
                      <th>Rolle</th>
                      <th>Erstellt am</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dbTestInfo.database.users.map((user: any) => (
                      <tr key={user.id}>
                        <td>{user.id}</td>
                        <td>{user.username}</td>
                        <td>{user.email}</td>
                        <td>{user.role}</td>
                        <td>{new Date(user.createdAt).toLocaleDateString('de-DE')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        <p>Klicken Sie auf "Datenbank testen", um Informationen zur Datenbankverbindung zu erhalten.</p>
      )}
    </div>
  );
};

export default Debug;
