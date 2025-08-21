import React, { useState, useEffect } from 'react';
import BenutzerBearbeiten from './BenutzerBearbeiten';
import { useSession } from 'next-auth/react';
import styles from '../admin.module.css';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  createdAt: string;
  status?: string;
}

interface BenutzerProps {
  ensureSession: () => Promise<boolean>;
}

const Benutzerverwaltung: React.FC<BenutzerProps> = ({ ensureSession }) => {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [userFilter, setUserFilter] = useState({
    role: '',
    status: '',
    sortBy: 'newest'
  });
  
  // Dialog-Zustände
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [rankPopupVisible, setRankPopupVisible] = useState(false);
  const [selectedUserForRank, setSelectedUserForRank] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  const [userStatusChange, setUserStatusChange] = useState<{userId: number, newStatus: string} | null>(null);
  const [userRoleChange, setUserRoleChange] = useState<{userId: number, newRole: string} | null>(null);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');

  // Funktion zum Laden aller Benutzer
  const fetchAllUsers = async () => {
    try {
      // Stelle sicher, dass eine aktive Session existiert
      if (!(await ensureSession())) return;
      
      setIsLoadingUsers(true);
      
        // Benutzer aus der Datenbank laden mit Paginierung und Filterung
  const response = await fetch(`/api/admin/users?page=${currentPage}&pageSize=${pageSize}&role=${userFilter.role}&status=${userFilter.status}&sortBy=${userFilter.sortBy}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Stellen Sie sicher, dass jeder Benutzer einen Status hat
        const usersWithStatus = data.users.map((user: User) => ({
          ...user,
          status: user.status || 'ACTIVE' // Standard-Status ist aktiv, wenn keiner gesetzt ist
        }));
        setUsers(usersWithStatus);
        setTotalUsers(data.total);
      } else {
        console.error('Fehler beim Laden der Benutzer:', response.statusText);
        // Leere Benutzerliste anzeigen, wenn die Anfrage fehlschlägt
        setUsers([]);
        setTotalUsers(0);
        
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        setDialogMessage(`Fehler beim Laden der Benutzer: ${errorData.error || response.statusText}`);
        setErrorDialogOpen(true);
      }    
    } catch (error) {
      console.error('Fehler beim Laden der Benutzer:', error);
      setUsers([]);
      setTotalUsers(0);
      alert('Ein unerwarteter Fehler ist aufgetreten. Bitte überprüfen Sie die Konsole für Details.');
    } finally {
      setIsLoadingUsers(false);
    }
  };
  
  // Funktion zum Suchen von Benutzern
  const handleUserSearch = async () => {
    if (!searchQuery.trim()) {
      // Wenn die Suche leer ist, alle Benutzer laden
      return fetchAllUsers();
    }
    
    try {
      // Stelle sicher, dass eine aktive Session existiert
      if (!(await ensureSession())) return;
      
      setIsLoadingUsers(true);
      
      // Benutzer anhand der Suchanfrage suchen
      const response = await fetch(`/api/admin/users/search?query=${encodeURIComponent(searchQuery)}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setTotalUsers(data.total);
      } else {
        console.error('Fehler bei der Benutzersuche:', response.statusText);
        setUsers([]);
        setTotalUsers(0);
        
        // Wir könnten hier ein Fallback zur normalen Benutzerabfrage machen, 
        // wenn der Suchendpunkt nicht implementiert ist (404)
        if (response.status === 404) {
          // Fallback: Normale Benutzerabfrage ohne Suche
          setDialogMessage('Die Suchfunktion ist noch nicht implementiert. Alle Benutzer werden angezeigt.');
          setErrorDialogOpen(true);
          
          // Normale Abfrage ausführen
          fetchAllUsers();
        } else {
          const errorData = await response.json().catch(() => ({ error: response.statusText }));
          setDialogMessage(`Fehler bei der Benutzersuche: ${errorData.error || response.statusText}`);
          setErrorDialogOpen(true);
        }
      }
    } catch (error) {
      console.error('Fehler bei der Benutzersuche:', error);
      setUsers([]);
      setTotalUsers(0);
    } finally {
      setIsLoadingUsers(false);
    }
  };
  
  // Handler für Tastatureingaben im Suchfeld
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleUserSearch();
    }
  };
  
  // Funktion zum Bearbeiten eines Benutzers
  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setEditModalOpen(true);
  };

  // Speichern-Handler für das Bearbeiten-Modal
  const handleSaveEditUser = async (updatedUser: any) => {
    try {
      if (!(await ensureSession())) return;
      
      // Finden des aktuellen Benutzers, um Änderungen für das Audit-Log zu verfolgen
      const originalUser = users.find(u => u.id === updatedUser.id);
      
      // PUT-Request anlegen (hier username, email, role, status)
      const response = await fetch(`/api/admin/users`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          role: updatedUser.role,
          status: updatedUser.status,
          // Originaldaten für Audit-Log hinzufügen
          originalUsername: originalUser?.username,
          originalEmail: originalUser?.email,
          originalRole: originalUser?.role,
          originalStatus: originalUser?.status
        })
      });
      if (response.ok) {
        // Erfolgsmeldung wird jetzt direkt in BenutzerBearbeiten.tsx angezeigt
        fetchAllUsers();
        // Das Bearbeiten-Fenster bleibt geöffnet
      } else {
        const errorData = await response.json();
        setDialogMessage(`Fehler beim Speichern: ${errorData.error || response.statusText}`);
        setErrorDialogOpen(true);
      }
    } catch (error) {
      setDialogMessage('Fehler beim Speichern.');
      setErrorDialogOpen(true);
    }
  };

  // Funktion zum Öffnen des Rangverwaltungs-Popups
  const openRankManagementPopup = (user: User) => {
    setSelectedUserForRank(user);
    setRankPopupVisible(true);
  };

  // Funktion zum Ändern der Benutzerrolle
  const handleChangeUserRole = async (userId: number, newRole: string) => {
    setUserRoleChange({ userId, newRole });
    setRankPopupVisible(false); // Rollenmanagement-Popup schließen, bevor Bestätigungsdialog angezeigt wird
    setTimeout(() => {
      setRoleDialogOpen(true); // Bestätigungsdialog mit kurzer Verzögerung öffnen
    }, 50);
  };
  
  // Funktion zum Bestätigen der Rollenänderung
  const confirmRoleChange = async () => {
    if (!userRoleChange) return;
    
    try {
      // Stelle sicher, dass eine aktive Session existiert
      if (!(await ensureSession())) return;
      
      setIsLoadingUsers(true);
      
      // Benutzerrolle in der Datenbank aktualisieren
      const response = await fetch(`/api/admin/users/role`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          userId: userRoleChange.userId, 
          role: userRoleChange.newRole
        })
      });
      
      if (response.ok) {
        // Nach erfolgreicher Aktualisierung die Benutzerliste neu laden
        fetchAllUsers();
        setDialogMessage('Benutzerrolle wurde erfolgreich geändert.');
        setSuccessDialogOpen(true);
      } else {
        const errorData = await response.json();
        setDialogMessage(`Fehler beim Aktualisieren der Benutzerrolle: ${errorData.error || response.statusText}`);
        setErrorDialogOpen(true);
        setIsLoadingUsers(false);
      }
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Benutzerrolle:', error);
      setDialogMessage('Fehler beim Aktualisieren der Benutzerrolle. Bitte versuchen Sie es später erneut.');
      setErrorDialogOpen(true);
      setIsLoadingUsers(false);
    } finally {
      setRoleDialogOpen(false);
      setUserRoleChange(null);
    }
  };
  
  // Funktion zum Ändern des Benutzerstatus (aktivieren, deaktivieren, verifizieren)
  const handleToggleUserStatus = async (userId: number, newStatus: string) => {
    setUserStatusChange({ userId, newStatus });
    setStatusDialogOpen(true);
  };
  
  // Funktion zum Bestätigen der Statusänderung
  const confirmStatusChange = async () => {
    if (!userStatusChange) return;
    
    try {
      // Stelle sicher, dass eine aktive Session existiert
      if (!(await ensureSession())) return;
      
      setIsLoadingUsers(true);
      
      // Benutzer-Status in der Datenbank aktualisieren
      const response = await fetch(`/api/admin/users`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          userId: userStatusChange.userId, 
          active: userStatusChange.newStatus === 'ACTIVE' ? true : false
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Aktualisiere den Status des Benutzers in der lokalen Liste
        setUsers(users.map(user => {
          if (user.id === data.userId) {
            return {
              ...user,
              status: data.status
            };
          }
          return user;
        }));
        
        setDialogMessage('Benutzerstatus wurde erfolgreich geändert.');
        setSuccessDialogOpen(true);
      } else {
        const errorData = await response.json();
        setDialogMessage(`Fehler beim Aktualisieren des Benutzerstatus: ${errorData.error || response.statusText}`);
        setErrorDialogOpen(true);
      }
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Benutzerstatus:', error);
      setDialogMessage('Fehler beim Aktualisieren des Benutzerstatus. Bitte versuchen Sie es später erneut.');
      setErrorDialogOpen(true);
    } finally {
      setStatusDialogOpen(false);
      setUserStatusChange(null);
      setIsLoadingUsers(false);
    }
  };
  
  // Funktion zum Blockieren oder Entsperren von Tokens für einen Benutzer
  const handleToggleTokens = async (userId: number, blockTokens: boolean) => {
    try {
      // Stelle sicher, dass eine aktive Session existiert
      if (!(await ensureSession())) return;
      
      setIsLoadingUsers(true);
      
      // Token-Status in der Datenbank aktualisieren
      const response = await fetch(`/api/admin/users/${userId}/tokens/block`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ block: blockTokens })
      });
      
      if (response.ok) {
        // Nach erfolgreicher Aktualisierung die Benutzerliste neu laden
        fetchAllUsers();
        setDialogMessage(`Tokens wurden erfolgreich ${blockTokens ? 'gesperrt' : 'entsperrt'}.`);
        setSuccessDialogOpen(true);
      } else {
        const errorData = await response.json();
        setDialogMessage(`Fehler beim ${blockTokens ? 'Sperren' : 'Entsperren'} der Tokens: ${errorData.error || response.statusText}`);
        setErrorDialogOpen(true);
      }
    } catch (error) {
      console.error(`Fehler beim ${blockTokens ? 'Sperren' : 'Entsperren'} der Tokens:`, error);
      setDialogMessage(`Fehler beim ${blockTokens ? 'Sperren' : 'Entsperren'} der Tokens. Bitte versuchen Sie es später erneut.`);
      setErrorDialogOpen(true);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Funktion zum Benachrichtigen eines Benutzers über Token-Status
  const handleNotifyTokens = async (userId: number) => {
    try {
      // Stelle sicher, dass eine aktive Session existiert
      if (!(await ensureSession())) return;
      
      setIsLoadingUsers(true);
      
      // Benachrichtigung senden
      const response = await fetch(`/api/admin/users/${userId}/tokens-notify`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        setDialogMessage('Benutzer wurde erfolgreich über seinen Token-Status benachrichtigt.');
        setSuccessDialogOpen(true);
      } else {
        const errorData = await response.json();
        setDialogMessage(`Fehler beim Benachrichtigen des Benutzers: ${errorData.error || response.statusText}`);
        setErrorDialogOpen(true);
      }
    } catch (error) {
      console.error('Fehler beim Benachrichtigen des Benutzers:', error);
      setDialogMessage('Fehler beim Benachrichtigen des Benutzers. Bitte versuchen Sie es später erneut.');
      setErrorDialogOpen(true);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Funktion zum Löschen eines Benutzers
  const handleDeleteUser = async (userId: number) => {
    setUserToDelete(userId);
    setDeleteDialogOpen(true);
  };
  
  // Funktion zum Bestätigen der Löschung
  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      // Stelle sicher, dass eine aktive Session existiert
      if (!(await ensureSession())) return;
      
      setIsLoadingUsers(true);
      
      // Benutzer aus der Datenbank löschen
      const response = await fetch(`/api/admin/users`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: userToDelete })
      });
      
      if (response.ok) {
        // Nach erfolgreicher Löschung die Benutzerliste neu laden
        fetchAllUsers();
        setDialogMessage('Benutzer wurde erfolgreich gelöscht.');
        setSuccessDialogOpen(true);
      } else {
        const errorData = await response.json();
        setDialogMessage(`Fehler beim Löschen des Benutzers: ${errorData.error || response.statusText}`);
        setErrorDialogOpen(true);
        setIsLoadingUsers(false);
      }
    } catch (error) {
      console.error('Fehler beim Löschen des Benutzers:', error);
      setDialogMessage('Fehler beim Löschen des Benutzers. Bitte versuchen Sie es später erneut.');
      setErrorDialogOpen(true);
      setIsLoadingUsers(false);
    } finally {
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  // Event-Listener für Klicks außerhalb der Dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdowns = document.querySelectorAll('[data-role-dropdown]');
      dropdowns.forEach(dropdown => {
        if (dropdown.parentElement && !dropdown.parentElement.contains(event.target as Node)) {
          (dropdown as HTMLElement).style.display = 'none';
        }
      });
      
      // Pop-Up für Rangverwaltung schließen, wenn außerhalb geklickt wird
      const rankPopup = document.getElementById('rankManagementPopup');
      if (rankPopup && !rankPopup.contains(event.target as Node)) {
        setRankPopupVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Benutzer laden, wenn die Komponente geladen wird oder sich relevante Zustände ändern
  useEffect(() => {
    if (session && status !== 'loading') {
      fetchAllUsers();
    }
  }, [session, status, currentPage, pageSize, userFilter]);

  return (
    <div className={styles.adminSection}>
      <h2 className={styles.adminSectionTitle}>Benutzer verwalten</h2>
      <p>Hier können Sie Benutzerkonten verwalten, bearbeiten und neue erstellen.</p>
      
      {/* Löschen-Bestätigungsdialog */}
      {deleteDialogOpen && (
        <div className={styles.dialogOverlay}>
          <div className={styles.dialogContent}>
            <h3>Benutzer löschen</h3>
            <p>Sind Sie sicher, dass Sie diesen Benutzer löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.</p>
            <div className={styles.dialogActions}>
              <button 
                className={styles.cancelButton} 
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setUserToDelete(null);
                }}
              >
                Abbrechen
              </button>
              <button 
                className={styles.deleteButton} 
                onClick={confirmDeleteUser}
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status-Änderungsdialog */}
      {statusDialogOpen && (
        <div className={styles.dialogOverlay}>
          <div className={styles.dialogContent}>
            <h3>Status ändern</h3>
            <p>Möchten Sie den Status dieses Benutzers wirklich ändern?</p>
            <div className={styles.dialogActions}>
              <button 
                className={styles.cancelButton} 
                onClick={() => {
                  setStatusDialogOpen(false);
                  setUserStatusChange(null);
                }}
              >
                Abbrechen
              </button>
              <button 
                className={styles.confirmButton} 
                onClick={confirmStatusChange}
              >
                Bestätigen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rollenänderungsdialog */}
      {roleDialogOpen && userRoleChange && (
        <div className={styles.dialogOverlay}>
          <div className={styles.dialogContent}>
            <div className={styles.dialogHeader} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '16px', 
              borderBottom: '1px solid #e2e8f0',
              paddingBottom: '8px'
            }}>
              <svg 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#3b82f6" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                style={{ marginRight: '8px' }}
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="8.5" cy="7" r="4"></circle>
                <polyline points="17 11 19 13 23 9"></polyline>
              </svg>
              <h3 style={{ margin: 0 }}>Benutzerrolle ändern</h3>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <p style={{
                fontSize: '1.1rem',
                fontWeight: 'bold',
                color: '#1e293b',
                marginBottom: '10px',
                textAlign: 'center',
                padding: '8px 12px',
                backgroundColor: '#f8fafc',
                borderRadius: '6px',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
              }}>Möchten Sie die Rolle dieses Benutzers ändern zu:</p>
              
              <div style={{ 
                backgroundColor: (() => {
                  switch (userRoleChange.newRole) {
                    case 'ADMIN': return '#f0f9ff';
                    case 'MODERATOR': return '#faf5ff';
                    case 'BLOGGER': return '#f0fdf4';
                    default: return '#f8fafc';
                  }
                })(),
                padding: '12px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                border: `1px solid ${(() => {
                  switch (userRoleChange.newRole) {
                    case 'ADMIN': return '#bfdbfe';
                    case 'MODERATOR': return '#e9d5ff';
                    case 'BLOGGER': return '#bbf7d0';
                    default: return '#e2e8f0';
                  }
                })()}`
              }}>
                <div style={{ 
                  width: '16px', 
                  height: '16px', 
                  borderRadius: '50%',
                  backgroundColor: (() => {
                    switch (userRoleChange.newRole) {
                      case 'ADMIN': return '#1976d2';
                      case 'MODERATOR': return '#9333ea';
                      case 'BLOGGER': return '#10b981';
                      default: return '#64748b';
                    }
                  })(),
                  marginRight: '8px'
                }}></div>
                <span style={{ 
                  fontWeight: 'bold',
                  color: (() => {
                    switch (userRoleChange.newRole) {
                      case 'ADMIN': return '#1976d2';
                      case 'MODERATOR': return '#9333ea';
                      case 'BLOGGER': return '#10b981';
                      default: return '#64748b';
                    }
                  })()
                }}>
                  {
                    {
                      'ADMIN': 'Administrator',
                      'MODERATOR': 'Moderator',
                      'BLOGGER': 'Blogger',
                      'LESER': 'Leser'
                    }[userRoleChange.newRole] || userRoleChange.newRole
                  }
                </span>
              </div>
              
              <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '12px' }}>
                Diese Aktion ändert die Berechtigungen des Benutzers im System. Bestätigen Sie nur, wenn Sie sicher sind.
              </p>
            </div>
            
            <div className={styles.dialogActions}>
              <button 
                className={styles.cancelButton} 
                onClick={() => {
                  setRoleDialogOpen(false);
                  setUserRoleChange(null);
                }}
                style={{
                  backgroundColor: '#f1f5f9',
                  color: '#334155',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Abbrechen
              </button>
              <button 
                className={styles.confirmButton} 
                onClick={confirmRoleChange}
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Bestätigen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fehlermeldung-Dialog */}
      {errorDialogOpen && (
        <div className={styles.dialogOverlay}>
          <div className={styles.dialogContent}>
            <div className={styles.dialogHeader}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <h3>Fehler</h3>
            </div>
            <p>{dialogMessage}</p>
            <div className={styles.dialogActions}>
              <button 
                className={styles.errorButton} 
                onClick={() => setErrorDialogOpen(false)}
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Rangverwaltungs-PopUp */}
      {rankPopupVisible && selectedUserForRank && (
        <div className={styles.dialogOverlay} style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.5)'
        }}>
          <div 
            id="rankManagementPopup"
            className={styles.dialogContent} 
            style={{
              width: '450px',
              maxWidth: '95%',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
              padding: '24px',
              position: 'relative'
            }}
          >
            <button 
              onClick={() => setRankPopupVisible(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#64748b',
                fontSize: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ 
                fontSize: '1.25rem', 
                fontWeight: 'bold', 
                color: '#1e293b',
                marginBottom: '8px'
              }}>
                Benutzerrolle verwalten
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
                Benutzer: <span style={{ fontWeight: 'bold', color: '#334155' }}>{selectedUserForRank.username}</span>
              </p>
              <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
                Aktuelle Rolle: <span style={{ 
                  fontWeight: 'bold', 
                  color: (() => {
                    switch (selectedUserForRank.role) {
                      case 'ADMIN': return '#1976d2';
                      case 'MODERATOR': return '#9333ea';
                      case 'BLOGGER': return '#10b981';
                      default: return '#64748b';
                    }
                  })(),
                }}>
                  {(() => {
                    switch (selectedUserForRank.role) {
                      case 'ADMIN': return 'Administrator';
                      case 'MODERATOR': return 'Moderator';
                      case 'BLOGGER': return 'Blogger';
                      case 'LESER': return 'Leser';
                      default: return 'Leser';
                    }
                  })()}
                </span>
              </p>
            </div>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '12px',
              marginBottom: '20px'
            }}>
              <div 
                onClick={() => handleChangeUserRole(selectedUserForRank.id, 'ADMIN')}
                style={{
                  padding: '16px',
                  borderRadius: '8px',
                  backgroundColor: selectedUserForRank.role === 'ADMIN' ? '#f0f9ff' : '#f8fafc',
                  border: `1px solid ${selectedUserForRank.role === 'ADMIN' ? '#bfdbfe' : '#e2e8f0'}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center'
                }}
                onMouseOver={(e) => {
                  if (selectedUserForRank.role !== 'ADMIN') {
                    e.currentTarget.style.backgroundColor = '#f1f5f9';
                    e.currentTarget.style.borderColor = '#cbd5e1';
                  }
                }}
                onMouseOut={(e) => {
                  if (selectedUserForRank.role !== 'ADMIN') {
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }
                }}
              >
                <div style={{ 
                  width: '40px', 
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#e6f2ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '8px'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1976d2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
                <div style={{ 
                  fontWeight: 'bold', 
                  color: '#1976d2',
                  marginBottom: '4px'
                }}>
                  Administrator
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Voller Zugriff auf alle Funktionen
                </div>
                {selectedUserForRank.role === 'ADMIN' && (
                  <div style={{ 
                    backgroundColor: '#1976d2', 
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '0.7rem',
                    marginTop: '8px'
                  }}>
                    Aktiv
                  </div>
                )}
              </div>
              
              <div 
                onClick={() => handleChangeUserRole(selectedUserForRank.id, 'MODERATOR')}
                style={{
                  padding: '16px',
                  borderRadius: '8px',
                  backgroundColor: selectedUserForRank.role === 'MODERATOR' ? '#faf5ff' : '#f8fafc',
                  border: `1px solid ${selectedUserForRank.role === 'MODERATOR' ? '#e9d5ff' : '#e2e8f0'}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center'
                }}
                onMouseOver={(e) => {
                  if (selectedUserForRank.role !== 'MODERATOR') {
                    e.currentTarget.style.backgroundColor = '#f1f5f9';
                    e.currentTarget.style.borderColor = '#cbd5e1';
                  }
                }}
                onMouseOut={(e) => {
                  if (selectedUserForRank.role !== 'MODERATOR') {
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }
                }}
              >
                <div style={{ 
                  width: '40px', 
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#f5eeff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '8px'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                </div>
                <div style={{ 
                  fontWeight: 'bold', 
                  color: '#9333ea',
                  marginBottom: '4px'
                }}>
                  Moderator
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Kann Inhalte prüfen und bearbeiten
                </div>
                {selectedUserForRank.role === 'MODERATOR' && (
                  <div style={{ 
                    backgroundColor: '#9333ea', 
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '0.7rem',
                    marginTop: '8px'
                  }}>
                    Aktiv
                  </div>
                )}
              </div>
              
              <div 
                onClick={() => handleChangeUserRole(selectedUserForRank.id, 'BLOGGER')}
                style={{
                  padding: '16px',
                  borderRadius: '8px',
                  backgroundColor: selectedUserForRank.role === 'BLOGGER' ? '#f0fdf4' : '#f8fafc',
                  border: `1px solid ${selectedUserForRank.role === 'BLOGGER' ? '#bbf7d0' : '#e2e8f0'}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center'
                }}
                onMouseOver={(e) => {
                  if (selectedUserForRank.role !== 'BLOGGER') {
                    e.currentTarget.style.backgroundColor = '#f1f5f9';
                    e.currentTarget.style.borderColor = '#cbd5e1';
                  }
                }}
                onMouseOut={(e) => {
                  if (selectedUserForRank.role !== 'BLOGGER') {
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }
                }}
              >
                <div style={{ 
                  width: '40px', 
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#ecfdf5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '8px'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9"></path>
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                  </svg>
                </div>
                <div style={{ 
                  fontWeight: 'bold', 
                  color: '#10b981',
                  marginBottom: '4px'
                }}>
                  Blogger
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Kann Beiträge erstellen und bearbeiten
                </div>
                {selectedUserForRank.role === 'BLOGGER' && (
                  <div style={{ 
                    backgroundColor: '#10b981', 
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '0.7rem',
                    marginTop: '8px'
                  }}>
                    Aktiv
                  </div>
                )}
              </div>
              
              <div 
                onClick={() => handleChangeUserRole(selectedUserForRank.id, 'LESER')}
                style={{
                  padding: '16px',
                  borderRadius: '8px',
                  backgroundColor: selectedUserForRank.role === 'LESER' ? '#f8fafc' : '#f8fafc',
                  border: `1px solid ${selectedUserForRank.role === 'LESER' ? '#94a3b8' : '#e2e8f0'}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center'
                }}
                onMouseOver={(e) => {
                  if (selectedUserForRank.role !== 'LESER') {
                    e.currentTarget.style.backgroundColor = '#f1f5f9';
                    e.currentTarget.style.borderColor = '#cbd5e1';
                  }
                }}
                onMouseOut={(e) => {
                  if (selectedUserForRank.role !== 'LESER') {
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }
                }}
              >
                <div style={{ 
                  width: '40px', 
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '8px'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </div>
                <div style={{ 
                  fontWeight: 'bold', 
                  color: '#64748b',
                  marginBottom: '4px'
                }}>
                  Leser
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Kann Inhalte lesen und kommentieren
                </div>
                {selectedUserForRank.role === 'LESER' && (
                  <div style={{ 
                    backgroundColor: '#64748b', 
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '0.7rem',
                    marginTop: '8px'
                  }}>
                    Aktiv
                  </div>
                )}
              </div>
            </div>
            
            <div style={{ 
              padding: '12px', 
              backgroundColor: '#f8fafc', 
              borderRadius: '6px',
              marginBottom: '20px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span style={{ fontWeight: 'bold', color: '#334155', fontSize: '0.9rem' }}>Hinweis zu Rollen</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                Die Rollenänderung wird sofort wirksam. Beachten Sie, dass diese Aktion die Berechtigungen des Benutzers im System beeinflusst.
              </p>
            </div>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end',
              gap: '10px'
            }}>
              <button 
                onClick={() => setRankPopupVisible(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#f8fafc',
                  color: '#334155',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className={styles.adminToolbar} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className={styles.adminButton}
            onClick={() => { 
              setSearchQuery('');
              fetchAllUsers();
            }}
          >
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              style={{ marginRight: '8px' }}
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            Alle Benutzer anzeigen
          </button>
          
          <button 
            className={styles.adminButton}
            style={{ background: '#10b981' }}
            onClick={() => {
              /* Hier Logik für das Hinzufügen eines neuen Benutzers */
            }}
          >
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              style={{ marginRight: '8px' }}
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Neuen Benutzer anlegen
          </button>
        </div>
        
        <div className={styles.userFilter} style={{ display: 'flex', gap: '10px' }}>
          <select 
            className={styles.adminSelect}
            value={userFilter.role}
            onChange={(e) => {
              setUserFilter({...userFilter, role: e.target.value});
              setCurrentPage(1);
            }}
          >
            <option value="">Alle Rollen</option>
            <option value="LESER">Leser</option>
            <option value="BLOGGER">Blogger</option>
            <option value="MODERATOR">Moderator</option>
            <option value="ADMIN">Administrator</option>
          </select>

          <select
            className={styles.adminSelect}
            value={userFilter.status}
            onChange={(e) => {
              setUserFilter({ ...userFilter, status: e.target.value });
              setCurrentPage(1);
            }}
          >
            <option value="">Alle Status</option>
            <option value="ACTIVE">Aktiv</option>
            <option value="PENDING">Verifizierung ausstehend</option>
            <option value="BANNED">Gesperrt</option>
          </select>

          <select 
            className={styles.adminSelect}
            value={userFilter.sortBy}
            onChange={(e) => {
              setUserFilter({...userFilter, sortBy: e.target.value});
            }}
          >
            <option value="newest">Neueste zuerst</option>
            <option value="oldest">Älteste zuerst</option>
            <option value="a-z">A-Z</option>
            <option value="z-a">Z-A</option>
          </select>
        </div>
      </div>
      
      <div className={styles.userSearchBox} style={{ marginBottom: '20px' }}>
        <label className={styles.adminLabel} htmlFor="userSearch">Benutzer suchen</label>
        <div style={{ position: 'relative', width: '100%', maxWidth: '100%' }}>
          <svg 
            style={{ 
              position: 'absolute', 
              left: '14px', 
              top: '35%', 
              transform: 'translateY(-50%)',
              color: '#6B7280',
              zIndex: 1
            }} 
            width="18" 
            height="18" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input 
            className={styles.adminInput} 
            id="userSearch" 
            type="text" 
            placeholder="Benutzername oder E-Mail suchen..." 
            style={{ paddingLeft: '42px', paddingRight: searchQuery ? '42px' : '12px' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#6B7280'
              }}
              aria-label="Suche zurücksetzen"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>
        <button 
          className={styles.adminButton}
          onClick={handleUserSearch}
        >
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            style={{ marginRight: '8px' }}
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          Suchen
        </button>
      </div>
      
      {/* Bearbeiten-Modal */}
      <BenutzerBearbeiten
        user={editingUser}
        open={editModalOpen}
        onClose={() => { setEditModalOpen(false); setEditingUser(null); }}
        onSave={handleSaveEditUser}
      />

      {/* Benutzer-Tabelle */}
      <div className={styles.userListContainer} style={{ overflowX: 'auto' }}>
        {isLoadingUsers ? (
          <div className={styles.loadingState}>
            <p>Benutzer werden geladen...</p>
          </div>
        ) : users.length === 0 ? (
          <div className={styles.emptyState} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px 0',
            background: '#f8fafc',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 24 }}>
              <circle cx="12" cy="12" r="10" fill="#f1f5f9"/>
              <path d="M9 10h.01M15 10h.01M8 15c1.5-1 6.5-1 8 0" stroke="#94a3b8" strokeWidth="1.5"/>
            </svg>
            <div style={{ fontSize: '1.25rem', color: '#334155', fontWeight: 600, marginBottom: 8, textAlign: 'center' }}>
              Keine Benutzer gefunden
            </div>
            <div style={{ color: '#64748b', fontSize: '1rem', marginBottom: 16, textAlign: 'center' }}>
              Es wurden keine Benutzer gefunden, die Ihren Suchkriterien entsprechen.<br/>
              Passe die Filter oder Suchbegriffe an und versuche es erneut.
            </div>
            {searchQuery && (
              <button 
                className={styles.adminButton}
                onClick={() => {
                  setSearchQuery('');
                  fetchAllUsers();
                }}
                style={{ marginTop: '10px', background: '#3b82f6', color: 'white', borderRadius: '6px', fontWeight: 500 }}
              >
                Alle Benutzer anzeigen
              </button>
            )}
          </div>
        ) : (
          <table className={styles.adminTable}>
            <colgroup>
              <col style={{ width: '5%' }} /> {/* ID */}
              <col style={{ width: '18%' }} /> {/* Benutzername */}
              <col style={{ width: '20%' }} /> {/* E-Mail */}
              <col style={{ width: '15%' }} /> {/* Rolle */}
              <col style={{ width: '12%' }} /> {/* Erstellt am */}
              <col style={{ width: '15%' }} /> {/* Status */}
              <col style={{ width: '15%' }} /> {/* Aktionen */}
            </colgroup>
            <thead>
              <tr>
                <th>ID</th>
                <th>Benutzername</th>
                <th>E-Mail</th>
                <th>Rolle</th>
                <th>Erstellt am</th>
                <th>Status</th>
                <th>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => {
                // Funktion zum Bestimmen der Farbe basierend auf der Rolle
                const getRoleColor = (role: string) => {
                  switch (role) {
                    case 'ADMIN':
                      return '#1976d2'; // Blau
                    case 'MODERATOR':
                      return '#9333ea'; // Lila
                    case 'BLOGGER':
                      return '#10b981'; // Grün
                    default:
                      return '#64748b'; // Grau (für LESER)
                  }
                };
                
                // Funktion zum Bestimmen des Anzeigenamens für die Rolle
                const getRoleName = (role: string) => {
                  switch (role) {
                    case 'ADMIN':
                      return 'Administrator';
                    case 'MODERATOR':
                      return 'Moderator';
                    case 'BLOGGER':
                      return 'Blogger';
                    case 'LESER':
                      return 'Leser';
                    default:
                      return 'Leser';
                  }
                };
                
                // Funktion zum Bestimmen der Statusfarbe
                const getStatusColor = (status: string) => {
                  switch (status) {
                    case 'ACTIVE':
                      return '#10b981'; // Grün
                    case 'PENDING':
                      return '#f59e0b'; // Orange
                    case 'BANNED':
                      return '#ef4444'; // Rot
                    default:
                      return '#64748b'; // Grau
                  }
                };
                
                // Funktion zum Bestimmen des Anzeigenamens für den Status
                const getStatusName = (status: string) => {
                  switch (status) {
                    case 'ACTIVE':
                      return 'Aktiv';
                    case 'PENDING':
                      return 'Verifizierung ausstehend';
                    case 'BANNED':
                      return 'Gesperrt';
                    default:
                      return 'Aktiv'; // Standard ist aktiv
                  }
                };
                
                // Datum formatieren
                const formatDate = (date: string) => {
                  return new Date(date).toLocaleDateString('de-DE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  });
                };
                
                return (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td title={user.username}>{user.username}</td>
                    <td title={user.email}>{user.email}</td>
                    <td>
                      <span className={styles.userRoleBadge} style={{ 
                        backgroundColor: getRoleColor(user.role), 
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        display: 'inline-block'
                      }}>
                        {getRoleName(user.role)}
                      </span>
                    </td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>
                      <span style={{ 
                        backgroundColor: getStatusColor(user.status || 'ACTIVE'), 
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        display: 'inline-block'
                      }}>
                        {getStatusName(user.status || 'ACTIVE')}
                      </span>
                    </td>
                    <td>
                      <div className={styles.userActions} style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className={styles.iconButton} 
                          title="Bearbeiten"
                          onClick={() => handleEditUser(user)}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </button>
                        
                        {/* Button für Rollenänderung - öffnet das Popup */}
                        <button 
                          className={styles.iconButton}
                          title="Rolle ändern"
                          onClick={() => openRankManagementPopup(user)}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="8.5" cy="7" r="4"></circle>
                            <polyline points="17 11 19 13 23 9"></polyline>
                          </svg>
                        </button>
                        
                        {/* Button für Token-Blockierung */}
                        <button 
                          className={styles.iconButton} 
                          title="Tokens blockieren/freigeben"
                          onClick={() => handleToggleTokens(user.id, false)} // Standardmäßig entsperren, kann im Modal angepasst werden
                          style={{ color: '#1976d2' }}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                          </svg>
                        </button>
                        
                        {/* Button für Token-Benachrichtigung */}
                        <button 
                          className={styles.iconButton} 
                          title="Token-Status-Benachrichtigung senden"
                          onClick={() => handleNotifyTokens(user.id)}
                          style={{ color: '#1976d2' }}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                          </svg>
                        </button>
                        
                        <button 
                          className={styles.iconButton} 
                          title={user.status === 'BANNED' ? "Entsperren" : "Sperren"}
                          onClick={() => handleToggleUserStatus(user.id, user.status === 'BANNED' ? 'ACTIVE' : 'BANNED')}
                        >
                          {user.status === 'BANNED' ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"></circle>
                              <line x1="12" y1="8" x2="12" y2="16"></line>
                              <line x1="8" y1="12" x2="16" y2="12"></line>
                            </svg>
                          ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"></circle>
                              <line x1="8" y1="12" x2="16" y2="12"></line>
                            </svg>
                          )}
                        </button>
                        
                        <button 
                          className={styles.iconButton} 
                          style={{ color: '#ef4444' }} 
                          title="Löschen"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      
      {/* Paginierung */}
      <div className={styles.pagination} style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginTop: '20px'
      }}>
        <div className={styles.paginationInfo}>
          {totalUsers > 0 ? (
            `Zeige ${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, totalUsers)} von ${totalUsers} Einträgen`
          ) : (
            <span style={{ color: '#64748b', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" fill="#f1f5f9"/>
                <path d="M9 10h.01M15 10h.01M8 15c1.5-1 6.5-1 8 0" stroke="#94a3b8" strokeWidth="1.5"/>
              </svg>
              Keine passenden Einträge gefunden
            </span>
          )}
        </div>
        <div className={styles.paginationControls} style={{ display: 'flex', gap: '5px' }}>
          <button 
            className={styles.paginationButton} 
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            style={{
              padding: '5px 10px',
              border: '1px solid #e2e8f0',
              borderRadius: '4px',
              background: '#f8fafc',
              cursor: currentPage <= 1 ? 'default' : 'pointer',
              opacity: currentPage <= 1 ? 0.5 : 1
            }}
          >
            Zurück
          </button>
          
          {/* Seitenzahlen generieren */}
          {Array.from({ length: Math.ceil(totalUsers / pageSize) }).map((_, index) => {
            const pageNumber = index + 1;
            // Nur einige Seitenzahlen anzeigen, um Platz zu sparen
            if (
              pageNumber === 1 || 
              pageNumber === Math.ceil(totalUsers / pageSize) || 
              (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
            ) {
              return (
                <button 
                  key={pageNumber}
                  className={styles.paginationPageButton} 
                  onClick={() => setCurrentPage(pageNumber)}
                  style={{
                    padding: '5px 10px',
                    border: `1px solid ${pageNumber === currentPage ? '#1976d2' : '#e2e8f0'}`,
                    borderRadius: '4px',
                    background: pageNumber === currentPage ? '#1976d2' : '#f8fafc',
                    color: pageNumber === currentPage ? 'white' : 'inherit',
                    cursor: 'pointer'
                  }}
                >
                  {pageNumber}
                </button>
              );
            } else if (
              (pageNumber === currentPage - 2 && currentPage > 3) || 
              (pageNumber === currentPage + 2 && currentPage < Math.ceil(totalUsers / pageSize) - 2)
            ) {
              // Auslassungspunkte anzeigen
              return <span key={pageNumber} style={{ padding: '0 5px' }}>...</span>;
            }
            return null;
          })}
          
          <button 
            className={styles.paginationButton} 
            disabled={currentPage >= Math.ceil(totalUsers / pageSize)}
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(totalUsers / pageSize)))}
            style={{
              padding: '5px 10px',
              border: '1px solid #e2e8f0',
              borderRadius: '4px',
              background: '#f8fafc',
              cursor: currentPage >= Math.ceil(totalUsers / pageSize) ? 'default' : 'pointer',
              opacity: currentPage >= Math.ceil(totalUsers / pageSize) ? 0.5 : 1
            }}
          >
            Weiter
          </button>
        </div>
      </div>
    </div>
  );
};

export default Benutzerverwaltung;
