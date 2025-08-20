import React, { useState, useEffect } from 'react';
import styles from '../admin.module.css';
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
    email: string;
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

interface BenutzerAuditLogProps {
  userId: number;
}

const BenutzerAuditLog: React.FC<BenutzerAuditLogProps> = ({ userId }) => {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 20,
    totalCount: 0,
    totalPages: 0
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      (async () => {
        await fetchAuditLogs(1);
      })();
    }
  }, [userId]);

  const fetchAuditLogs = async (page: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/auditlog?page=${page}&pageSize=20`);
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

  const handlePageChange = async (newPage: number) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      await fetchAuditLogs(newPage);
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
      case 'STATUS_CHANGE':
      case 'ROLE_CHANGE':
        return '#722ed1'; // Lila
      default:
        return '#8c8c8c'; // Grau
    }
  };

  if (loading && auditLogs.length === 0) {
    return <div className={styles.loadingText}>Daten werden geladen...</div>;
  }

  if (error) {
    return <div className={styles.errorText}>Fehler: {error}</div>;
  }

  return (
    <div className={styles.auditLogContainer}>
      <h3 className={styles.sectionSubTitle}>Aktivitätsprotokoll</h3>
      
      {auditLogs.length === 0 ? (
        <div className={styles.emptyText}>Keine Aktivitäten gefunden</div>
      ) : (
        <>
          <div className={styles.auditLogTable}>
            <table>
              <thead>
                <tr>
                  <th>Datum</th>
                  <th>Aktion</th>
                  <th>Details</th>
                  <th>Admin</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{formatDate(log.createdAt)}</td>
                    <td>
                      <span 
                        className={styles.actionBadge} 
                        style={{ backgroundColor: getActionColor(log.action) }}
                      >
                        {getActionLabel(log.action)}
                      </span>
                    </td>
                    <td>
                      <div>{log.details}</div>
                      {(log.oldValue || log.newValue) && (
                        <div className={styles.changeDetails}>
                          {log.oldValue && <div className={styles.oldValue}>Von: {log.oldValue}</div>}
                          {log.newValue && <div className={styles.newValue}>Zu: {log.newValue}</div>}
                        </div>
                      )}
                    </td>
                    <td>{log.admin ? log.admin.username : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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

export default BenutzerAuditLog;
