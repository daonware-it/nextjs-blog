import React, { useState, useEffect } from 'react';
import styles from './profile.module.css';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface AuditLogEntry {
  id: number;
  action: string;
  details: string;
  oldValue?: string | null;
  newValue?: string | null;
  createdAt: string;
  admin?: {
    id: number;
    username: string;
  } | null;
}

interface Pagination {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

interface AuditLogResponse {
  auditLogs: AuditLogEntry[];
  pagination: Pagination;
}

const AuditLogView: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAuditLogs(1);
  }, []);

  const fetchAuditLogs = async (page: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/profile/auditlog-simple?page=${page}&pageSize=10`);
      if (!response.ok) {
        setError('Fehler beim Abrufen der Audit-Logs');
        setLoading(false);
        return;
      }
      
      const data: AuditLogResponse = await response.json();
      setAuditLogs(data.auditLogs);
      setPagination(data.pagination);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      fetchAuditLogs(newPage);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd. MMMM yyyy, HH:mm', { locale: de });
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      TOKEN_UPDATE: 'Token-Aktualisierung',
      TOKEN_BLOCK: 'Token-Sperrung',
      TOKEN_UNBLOCK: 'Token-Entsperrung',
      STATUS_CHANGE: 'Statusänderung',
      ROLE_CHANGE: 'Rollenänderung',
      SUBSCRIPTION_CREATE: 'Abo erstellt',
      SUBSCRIPTION_UPDATE: 'Abo aktualisiert',
      SUBSCRIPTION_DELETE: 'Abo gelöscht',
      USER_UPDATE: 'Benutzerdaten aktualisiert',
      USER_CREATE: 'Benutzer erstellt',
      USER_DELETE: 'Benutzer gelöscht'
    };
    
    return labels[action] || action;
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'TOKEN_BLOCK':
        return '#ff4d4f'; // Rot
      case 'TOKEN_UNBLOCK':
        return '#52c41a'; // Grün
      case 'SUBSCRIPTION_CREATE':
      case 'SUBSCRIPTION_UPDATE':
        return '#1890ff'; // Blau
      case 'SUBSCRIPTION_DELETE':
        return '#faad14'; // Gelb
      default:
        return '#722ed1'; // Lila
    }
  };

  if (loading && auditLogs.length === 0) {
    return <div className={styles.loadingContainer}>Daten werden geladen...</div>;
  }

  if (error) {
    // Statt einen Fehler anzuzeigen, zeigen wir eine leere Ansicht
    return <div className={styles.noData}>Keine Aktivitäten verfügbar</div>;
  }

  return (
    <div className={styles.auditLogContainer}>
      <h3>Konto-Aktivitäten</h3>
      
      {auditLogs.length === 0 ? (
        <div className={styles.noData}>Keine Aktivitäten gefunden</div>
      ) : (
        <>
          <div className={styles.auditLogList}>
            {auditLogs.map((log) => (
              <div key={log.id} className={styles.auditLogItem}>
                <div className={styles.auditLogHeader}>
                  <span 
                    className={styles.auditLogAction} 
                    style={{ backgroundColor: getActionColor(log.action) }}
                  >
                    {getActionLabel(log.action)}
                  </span>
                  <span className={styles.auditLogDate}>{formatDate(log.createdAt)}</span>
                </div>
                
                <div className={styles.auditLogDetails}>
                  <p>{log.details}</p>
                  
                  {(log.oldValue || log.newValue) && (
                    <div className={styles.auditLogChanges}>
                      {log.oldValue && (
                        <div className={styles.auditLogOldValue}>
                          <span>Vorher:</span> {log.oldValue}
                        </div>
                      )}
                      {log.newValue && (
                        <div className={styles.auditLogNewValue}>
                          <span>Nachher:</span> {log.newValue}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {log.admin && (
                    <div className={styles.auditLogAdmin}>
                      <span>Durchgeführt von:</span> {log.admin.username}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {pagination.totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className={styles.paginationButton}
              >
                &lt; Zurück
              </button>
              
              <span className={styles.paginationInfo}>
                Seite {pagination.page} von {pagination.totalPages}
              </span>
              
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className={styles.paginationButton}
              >
                Weiter &gt;
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AuditLogView;
