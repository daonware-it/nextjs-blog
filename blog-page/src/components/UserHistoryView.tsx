import React, { useState, useEffect } from 'react';
import styles from './profile.module.css';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

type HistoryItem = {
  id: number;
  changedAt: string;
  oldUsername?: string;
  newUsername?: string;
  oldEmail?: string;
  newEmail?: string;
};

export default function UserHistoryView() {
  const [usernameHistory, setUsernameHistory] = useState<HistoryItem[]>([]);
  const [emailHistory, setEmailHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      try {
        setLoading(true);
        const res = await fetch('/api/profile-history');
        
        if (!res.ok) {
          throw new Error('Fehler beim Laden der Benutzerhistorie');
        }
        
        const data = await res.json();
        setUsernameHistory(data.usernameHistory || []);
        setEmailHistory(data.emailHistory || []);
        setError(null);
      } catch (err) {
        console.error('Fehler beim Laden der Historie:', err);
        setError('Die Historie konnte nicht geladen werden');
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, []);

  function formatDate(dateString: string) {
    try {
      return format(new Date(dateString), 'dd. MMMM yyyy, HH:mm', { locale: de });
    } catch (e) {
      return dateString;
    }
  }

  if (loading) {
    return <div className={styles.historyLoading}>Historiedaten werden geladen...</div>;
  }

  if (error) {
    return <div className={styles.historyError}>{error}</div>;
  }

  if (usernameHistory.length === 0 && emailHistory.length === 0) {
    return (
      <div className={styles.historyEmpty}>
        <p>Keine Änderungshistorie verfügbar. Änderungen an deinem Benutzernamen oder deiner E-Mail-Adresse werden hier angezeigt.</p>
        <p className={styles.historyEmptyNote}>
          <strong>Hinweis:</strong> Benutzername und E-Mail können nur alle 90 Tage geändert werden.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.historyContainer}>
      {usernameHistory.length > 0 && (
        <div className={styles.historySection}>
          <h3 className={styles.historyTitle}>Benutzernamen-Änderungen</h3>
          <div className={styles.historyTable}>
            <table>
              <thead>
                <tr>
                  <th>Datum</th>
                  <th>Alter Benutzername</th>
                  <th>Neuer Benutzername</th>
                </tr>
              </thead>
              <tbody>
                {usernameHistory.map((item) => (
                  <tr key={`username-${item.id}`}>
                    <td>{formatDate(item.changedAt)}</td>
                    <td>{item.oldUsername}</td>
                    <td>{item.newUsername}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {emailHistory.length > 0 && (
        <div className={styles.historySection}>
          <h3 className={styles.historyTitle}>E-Mail-Änderungen</h3>
          <div className={styles.historyTable}>
            <table>
              <thead>
                <tr>
                  <th>Datum</th>
                  <th>Alte E-Mail</th>
                  <th>Neue E-Mail</th>
                </tr>
              </thead>
              <tbody>
                {emailHistory.map((item) => (
                  <tr key={`email-${item.id}`}>
                    <td>{formatDate(item.changedAt)}</td>
                    <td>{item.oldEmail}</td>
                    <td>{item.newEmail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      <div className={styles.historyInfo}>
        <p>
          <strong>Hinweis:</strong> Benutzername und E-Mail können nur alle 90 Tage geändert werden.
        </p>
      </div>
    </div>
  );
}
