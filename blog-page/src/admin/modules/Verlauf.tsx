import React, { useState, useEffect } from 'react';
import styles from './admin.module.css';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface User {
  id: number;
  username: string | null;
  email: string;
}

interface AuditLogEntry {
  id: number;
  action: string;
  details: string;
  oldValue?: string | null;
  newValue?: string | null;
  createdAt: string;
  userId: number;
  adminId?: number | null;
  user: User;
  admin?: User | null;
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

const Verlauf: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 50,
    totalCount: 0,
    totalPages: 0
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter-Status
  const [filterAction, setFilterAction] = useState<string>('');
  const [filterUserId, setFilterUserId] = useState<string>('');
  const [filterFromDate, setFilterFromDate] = useState<string>('');
  const [filterToDate, setFilterToDate] = useState<string>('');

  useEffect(() => {
    (async () => {
      await fetchAuditLogs(1);
    })();
  }, []);

  const fetchAuditLogs = async (page: number) => {
    setLoading(true);
    try {
      // URL mit Filtern erstellen
      let url = `/api/admin/auditlog?page=${page}&pageSize=${pagination.pageSize}`;
      
      if (filterAction) {
        url += `&action=${filterAction}`;
      }
      
      if (filterUserId) {
        url += `&userId=${filterUserId}`;
      }
      
      if (filterFromDate) {
        url += `&fromDate=${filterFromDate}`;
      }
      
      if (filterToDate) {
        url += `&toDate=${filterToDate}`;
      }
      
      const response = await fetch(url);
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

  const handleFilter = () => {
    fetchAuditLogs(1).catch((err) => setError(err instanceof Error ? err.message : 'Unbekannter Fehler'));
  };

  const handleResetFilters = () => {
    setFilterAction('');
    setFilterUserId('');
    setFilterFromDate('');
    setFilterToDate('');
    setTimeout(() => {
      fetchAuditLogs(1).catch((err) => setError(err instanceof Error ? err.message : 'Unbekannter Fehler'));
    }, 0);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      fetchAuditLogs(newPage).catch((err) => setError(err instanceof Error ? err.message : 'Unbekannter Fehler'));
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd. MMMM yyyy, HH:mm:ss', { locale: de });
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
      USER_DELETE: 'Benutzer gelöscht',
      POST_CREATE: 'Beitrag erstellt',
      POST_UPDATE: 'Beitrag aktualisiert',
      POST_DELETE: 'Beitrag gelöscht',
      POST_PUBLISH: 'Beitrag veröffentlicht',
      BLOCK_DRAFT_CREATE: 'Entwurf erstellt',
      BLOCK_DRAFT_UPDATE: 'Entwurf aktualisiert',
      BLOCK_DRAFT_DELETE: 'Entwurf gelöscht',
      CATEGORY_CREATE: 'Kategorie erstellt',
      CATEGORY_UPDATE: 'Kategorie aktualisiert',
      CATEGORY_DELETE: 'Kategorie gelöscht'
    };
    
    return labels[action] || action;
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'TOKEN_BLOCK':
      case 'USER_DELETE':
      case 'POST_DELETE':
      case 'BLOCK_DRAFT_DELETE':
      case 'CATEGORY_DELETE':
        return '#ff4d4f'; // Rot
      
      case 'TOKEN_UNBLOCK':
      case 'POST_PUBLISH':
        return '#52c41a'; // Grün
      
      case 'SUBSCRIPTION_CREATE':
      case 'SUBSCRIPTION_UPDATE':
      case 'USER_CREATE':
      case 'POST_CREATE':
      case 'BLOCK_DRAFT_CREATE':
      case 'CATEGORY_CREATE':
        return '#1890ff'; // Blau
      
      case 'POST_UPDATE':
      case 'BLOCK_DRAFT_UPDATE':
      case 'CATEGORY_UPDATE':
      case 'TOKEN_UPDATE':
        return '#722ed1'; // Lila
      
      case 'SUBSCRIPTION_DELETE':
      case 'STATUS_CHANGE':
      case 'ROLE_CHANGE':
        return '#faad14'; // Gelb
      
      default:
        return '#8c8c8c'; // Grau
    }
  };

  const allActionTypes = [
    'TOKEN_UPDATE', 'TOKEN_BLOCK', 'TOKEN_UNBLOCK',
    'STATUS_CHANGE', 'ROLE_CHANGE',
    'SUBSCRIPTION_CREATE', 'SUBSCRIPTION_UPDATE', 'SUBSCRIPTION_DELETE',
    'USER_UPDATE', 'USER_CREATE', 'USER_DELETE',
    'POST_CREATE', 'POST_UPDATE', 'POST_DELETE', 'POST_PUBLISH',
    'BLOCK_DRAFT_CREATE', 'BLOCK_DRAFT_UPDATE', 'BLOCK_DRAFT_DELETE',
    'CATEGORY_CREATE', 'CATEGORY_UPDATE', 'CATEGORY_DELETE'
  ];

  return (
    <div className={styles.adminContent}>
      <h1 className={styles.adminTitle}>Aktivitätsverlauf</h1>
      <p className={styles.adminDescription}>
        Hier sehen Sie alle protokollierten Aktivitäten der Benutzer und Administratoren im System.
      </p>

      {/* Filter-Bereich */}
      <div className={styles.filterContainer}>
        <h3 className={styles.filterTitle}>Filter</h3>
        
        <div className={styles.filterGrid}>
          <div className={styles.filterItem}>
            <label htmlFor="actionFilter">Aktionstyp:</label>
            <select 
              id="actionFilter"
              value={filterAction} 
              onChange={(e) => setFilterAction(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">Alle Aktionen</option>
              {allActionTypes.map(action => (
                <option key={action} value={action}>
                  {getActionLabel(action)}
                </option>
              ))}
            </select>
          </div>
          
          <div className={styles.filterItem}>
            <label htmlFor="userIdFilter">Benutzer-ID:</label>
            <input
              id="userIdFilter"
              type="number"
              value={filterUserId}
              onChange={(e) => setFilterUserId(e.target.value)}
              placeholder="Benutzer-ID eingeben"
              className={styles.filterInput}
            />
          </div>
          
          <div className={styles.filterItem}>
            <label htmlFor="fromDateFilter">Von Datum:</label>
            <input
              id="fromDateFilter"
              type="date"
              value={filterFromDate}
              onChange={(e) => setFilterFromDate(e.target.value)}
              className={styles.filterInput}
            />
          </div>
          
          <div className={styles.filterItem}>
            <label htmlFor="toDateFilter">Bis Datum:</label>
            <input
              id="toDateFilter"
              type="date"
              value={filterToDate}
              onChange={(e) => setFilterToDate(e.target.value)}
              className={styles.filterInput}
            />
          </div>
        </div>
        
        <div className={styles.filterActions}>
          <button onClick={handleFilter} className={styles.primaryButton}>
            Filtern
          </button>
          <button onClick={handleResetFilters} className={styles.secondaryButton}>
            Filter zurücksetzen
          </button>
        </div>
      </div>

      {/* Audit-Log-Tabelle */}
      {loading && auditLogs.length === 0 ? (
        <div className={styles.loadingContainer}>Daten werden geladen...</div>
      ) : error ? (
        <div className={styles.errorContainer}>Fehler: {error}</div>
      ) : auditLogs.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Keine Aktivitäten gefunden</p>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Datum</th>
                <th>Benutzer</th>
                <th>Aktion</th>
                <th>Details</th>
                <th>Änderung</th>
                <th>Admin</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id}>
                  <td>{formatDate(log.createdAt)}</td>
                  <td>
                    <div className={styles.userCell}>
                      <strong>ID: {log.userId}</strong>
                      <div>{log.user.username || log.user.email}</div>
                    </div>
                  </td>
                  <td>
                    <span 
                      className={styles.actionBadge} 
                      style={{ backgroundColor: getActionColor(log.action) }}
                    >
                      {getActionLabel(log.action)}
                    </span>
                  </td>
                  <td className={styles.detailsCell}>{log.details}</td>
                  <td>
                    {(log.oldValue || log.newValue) && (
                      <div className={styles.changeDetails}>
                        {log.oldValue && <div className={styles.oldValue}>Von: {log.oldValue}</div>}
                        {log.newValue && <div className={styles.newValue}>Zu: {log.newValue}</div>}
                      </div>
                    )}
                  </td>
                  <td>
                    {log.admin ? (
                      <div className={styles.adminCell}>
                        <strong>ID: {log.adminId}</strong>
                        <div>{log.admin.username || log.admin.email}</div>
                      </div>
                    ) : (
                      <span className={styles.noAdmin}>-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginierung */}
      {pagination.totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className={styles.pageButton}
          >
            &lt; Zurück
          </button>
          
          <div className={styles.pageInfo}>
            Seite {pagination.page} von {pagination.totalPages}
            <span className={styles.totalItems}>
              (Gesamt: {pagination.totalCount} Einträge)
            </span>
          </div>
          
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className={styles.pageButton}
          >
            Weiter &gt;
          </button>
        </div>
      )}
    </div>
  );
};

export default Verlauf;
