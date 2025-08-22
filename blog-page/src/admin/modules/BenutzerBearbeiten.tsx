import React from 'react';
import styles from '../admin.module.css';
import BenutzerAuditLog from './BenutzerAuditLog';

// Modernes Entsperr-Icon (Schloss)
const UnlockIcon = ({ size = 20, color = '#3b82f6' }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="8" width="12" height="8" rx="2" stroke={color} strokeWidth="1.5" fill="white"/>
    <path d="M7 8V6a3 3 0 1 1 6 0v2" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    <circle cx="10" cy="12.5" r="1.2" fill={color} />
  </svg>
);

// Sperr-Icon (Schloss geschlossen)
const LockIcon = ({ size = 20, color = '#dc2626' }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="8" width="12" height="8" rx="2" stroke={color} strokeWidth="1.5" fill="white"/>
    <path d="M7 8V6a3 3 0 1 1 6 0v2" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    <rect x="8.5" y="10" width="3" height="5" rx="1.5" fill={color} />
  </svg>
);

// Haken-Icon (Freigeben)
const CheckIcon = ({ size = 20, color = '#047857' }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16.5 5.5L8 14L3.5 9.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

interface BenutzerBearbeitenProps {
  user: {
    id: number;
    username: string;
    email: string;
    role: string;
    status?: string;
    subscription?: {
      name: string;
      status: string;
      renewDate: string;
      aiQuota: number;
      aiUsed: number;
    };
  } | null;
  open: boolean;
  onClose: () => void;
  onSave: (user: any) => void;
}

const BenutzerBearbeiten: React.FC<BenutzerBearbeitenProps> = ({ user, open, onClose, onSave }) => {
  const [form, setForm] = React.useState({
    username: user?.username || '',
    email: user?.email || '',
    role: user?.role || '',
    status: user?.status || 'ACTIVE',
  });
  const [originalForm, setOriginalForm] = React.useState({
    username: user?.username || '',
    email: user?.email || '',
    role: user?.role || '',
    status: user?.status || 'ACTIVE',
  });
  const [usernameLocked, setUsernameLocked] = React.useState(true);
  const [emailLocked, setEmailLocked] = React.useState(true);
  const [tokenInput, setTokenInput] = React.useState<string>('');
  const [aboInfo, setAboInfo] = React.useState<any>(null);
  const [aboLoading, setAboLoading] = React.useState(false);
  const [aboError, setAboError] = React.useState<string | null>(null);
  const [tokenEditMode, setTokenEditMode] = React.useState(false);
  const [tokensBlocked, setTokensBlocked] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  
  // Funktion zum Anzeigen einer Erfolgsmeldung, die nach 3 Sekunden verschwindet
  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
  };

  React.useEffect(() => {
    if (user && user.id) {
      setAboLoading(true);
      setAboError(null);
      fetch(`/api/admin/users/${user.id}`)
        .then(r => r.ok ? r.json() : Promise.reject(r))
        .then(data => {
          // Fallback für Free-Abo, falls keine subscription vorhanden ist
          if (!data.subscription) {
            setAboInfo({
              name: 'Free',
              status: 'Aktiv',
              renewDate: '-',
              aiQuota: 10,
              aiUsed: 0,
              isActive: true,
              tokensBlocked: false,
              aiRemaining: 10
            });
          } else {
            setAboInfo(data.subscription);
            setTokensBlocked(data.subscription?.tokensBlocked === true);
            // Auch den isActive-Status des Abos berücksichtigen
            if (data.subscription) {
              const isActive = data.subscription.status === 'Aktiv';
              setTokensBlocked(data.subscription.tokensBlocked === true || !isActive);
            }
          }
        })
        .catch(() => setAboError('Abo-Informationen konnten nicht geladen werden.'))
        .finally(() => setAboLoading(false));
      
      // Separater Aufruf für den Token-Sperrstatus
      fetch(`/api/admin/users/${user.id}/tokens/block`)
        .then(r => r.ok ? r.json() : { blocked: false })
        .then(data => {
          // tokensBlocked auf true setzen, wenn der Aufruf true zurückgibt
          // Dies berücksichtigt bereits den isActive-Status im Backend
          setTokensBlocked(data.blocked === true);
        })
        .catch(error => console.error("Fehler beim Laden des Token-Sperrstatus:", error));
    } else {
      setAboInfo(null);
    }
  }, [user, open]);

  React.useEffect(() => {
    if (user) {
      setForm({
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status || 'ACTIVE',
      });
      setOriginalForm({
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status || 'ACTIVE',
      });
      setUsernameLocked(true);
      setEmailLocked(true);
    }
  }, [user, open]);

  if (!open || !user) return null;

  return (
    <div className={styles.adminContainer}>
      <h1 className={styles.adminHeading}>Benutzerverwaltung</h1>
      <div className={styles.adminSection}>
        <h2 className={styles.adminSectionTitle}>Benutzer bearbeiten</h2>
        <p style={{fontStyle: 'italic'}}>Hier können Sie die Daten des Benutzers bearbeiten.</p>
        
        {/* Erfolgsmeldung */}
        {successMessage && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: '6px',
            color: '#047857',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckIcon size={18} />
              <span style={{ fontWeight: 500 }}>{successMessage}</span>
            </div>
            <button 
              onClick={() => setSuccessMessage(null)}
              className={styles.successButton}
              style={{
                fontSize: '14px',
                padding: '4px 12px',
                marginLeft: '16px',
                background: '#047857'
              }}
            >
              OK
            </button>
          </div>
        )}
        
        {/* Bearbeitungsformular */}
        <form id="editUserForm" onSubmit={async (e) => { 
          e.preventDefault(); 
          
          // Überprüfen, ob sich der Benutzername oder die E-Mail geändert haben
          // und entsprechende Benachrichtigungen und Audit-Logs erstellen
          const usernameChanged = form.username !== originalForm.username;
          const emailChanged = form.email !== originalForm.email;
          
          // Benutzer mit allen Änderungen speichern
          onSave({
            id: user.id,
            username: form.username,
            email: form.email,
            role: form.role,
            status: form.status
          });

          // Audit-Log-Einträge und Benachrichtigungen für Benutzername und E-Mail-Änderungen
          if (usernameChanged || emailChanged) {
            try {
              // Benachrichtigung für den Benutzer erstellen
              const notifyMessages = [];
              
              if (usernameChanged) {
                notifyMessages.push(`Ihr Benutzername wurde von einem Administrator geändert (von "${originalForm.username}" zu "${form.username}").`);
              }
              
              if (emailChanged) {
                notifyMessages.push(`Ihre E-Mail-Adresse wurde von einem Administrator geändert (von "${originalForm.email}" zu "${form.email}").`);
              }
              
              // Zusammengesetzte Nachricht für den Benutzer
              if (notifyMessages.length > 0) {
                void fetch(`/api/admin/users/${user?.id}/tokens-notify`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    message: notifyMessages.join(' '),
                    type: 'info'
                  })
                });
              }
              
              // Aktualisiere den originalForm-Zustand mit den neuen Werten
              setOriginalForm({...form});
            } catch (error) {
              console.error("Fehler beim Erstellen der Benachrichtigungen:", error);
            }
          }
          
          showSuccessMessage('Benutzerdaten wurden erfolgreich gespeichert.');
        }}>
          <div className={styles.formGroup} style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{flex:1}}>
              <label className={styles.adminLabel}>Benutzername</label>
              <input 
                type="text" 
                value={form.username} 
                onChange={e => setForm(f => ({...f, username: e.target.value}))} 
                className={styles.adminInput} 
                readOnly={usernameLocked}
                style={usernameLocked ? {background:'#f3f4f6',color:'#64748b',cursor:'not-allowed'} : {}}
              />
            </div>
            {usernameLocked ? (
              <button
                type="button"
                className={styles.iconButton}
                style={{marginTop:6,marginLeft:2,border:'1.5px solid #e5e7eb',background:'#fff',boxShadow:'0 2px 8px rgba(59,130,246,0.07)',transition:'all 0.2s',padding:8}}
                onClick={() => setUsernameLocked(false)}
                title="Feld entsperren"
                tabIndex={0}
                aria-label="Benutzername entsperren"
                onMouseOver={e => e.currentTarget.style.background='#f0f9ff'}
                onMouseOut={e => e.currentTarget.style.background='#fff'}
              >
                <UnlockIcon />
              </button>
            ) : null}
          </div>
          
          <div className={styles.formGroup} style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{flex:1}}>
              <label className={styles.adminLabel}>E-Mail</label>
              <input 
                type="email" 
                value={form.email} 
                onChange={e => setForm(f => ({...f, email: e.target.value}))} 
                className={styles.adminInput} 
                readOnly={emailLocked}
                style={emailLocked ? {background:'#f3f4f6',color:'#64748b',cursor:'not-allowed'} : {}}
              />
            </div>
            {emailLocked ? (
              <button
                type="button"
                className={styles.iconButton}
                style={{marginTop:6,marginLeft:2,border:'1.5px solid #e5e7eb',background:'#fff',boxShadow:'0 2px 8px rgba(59,130,246,0.07)',transition:'all 0.2s',padding:8}}
                onClick={() => setEmailLocked(false)}
                title="Feld entsperren"
                tabIndex={0}
                aria-label="E-Mail entsperren"
                onMouseOver={e => e.currentTarget.style.background='#f0f9ff'}
                onMouseOut={e => e.currentTarget.style.background='#fff'}
              >
                <UnlockIcon />
              </button>
            ) : null}
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.adminLabel}>Rolle</label>
            <select 
              value={form.role} 
              onChange={e => setForm(f => ({...f, role: e.target.value}))} 
              className={styles.adminSelect}
            >
              <option value="LESER">Leser</option>
              <option value="BLOGGER">Blogger</option>
              <option value="MODERATOR">Moderator</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.adminLabel}>Status</label>
            <select 
              value={form.status} 
              onChange={e => setForm(f => ({...f, status: e.target.value}))} 
              className={styles.adminSelect}
            >
              <option value="ACTIVE">Aktiv</option>
              <option value="PENDING">Verifizierung ausstehend</option>
              <option value="BANNED">Gesperrt</option>
            </select>
          </div>
          
          <div className={styles.dialogActions} style={{marginTop: '30px'}}>
            <button 
              type="button" 
              onClick={onClose} 
              className={styles.cancelButton}
            >
              Zurück zur Übersicht
            </button>
            <button 
              type="submit" 
              className={styles.successButton}
            >
              Benutzer speichern
            </button>
          </div>
        </form>
        {/* Abo- und KI-Anfragen-Karte */}
        <div style={{
          marginTop: 36,
          display: 'flex',
          justifyContent: 'center',
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 14,
            boxShadow: '0 4px 16px rgba(59,130,246,0.08)',
            padding: 28,
            minWidth: 320,
            maxWidth: 400,
            width: '100%',
            border: '1.5px solid #e5e7eb',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 16
          }}>
            <div style={{fontWeight:700, fontSize:18, color:'#1976d2', marginBottom:4}}>Abo-Status</div>
            {aboLoading ? (
              <div style={{color:'#64748b'}}>Lade Abo-Daten...</div>
            ) : aboError ? (
              <div style={{color:'#ef4444'}}>{aboError}</div>
            ) : aboInfo ? (
              <>
                <div style={{fontSize:15, color:'#334155'}}>
                  <b>Typ:</b> {aboInfo.name}<br/>
                  <b>Status:</b> {tokensBlocked ? (
                    <span style={{color:'#ef4444'}}>Gesperrt <span style={{fontSize:12,color:'#64748b'}}>(Tokens blockiert)</span></span>
                  ) : (
                    <span style={{color: aboInfo.status==='Aktiv'?'#10b981':'#ef4444'}}>{aboInfo.status}</span>
                  )}<br/>
                  <b>Verlängerung:</b> {aboInfo.renewDate ? formatDateDE(aboInfo.renewDate) : '—'}<br/>
                  <b>isActive:</b> <span style={{color: aboInfo.isActive ? '#10b981' : '#ef4444'}}>{aboInfo.isActive ? 'Ja' : 'Nein'}</span>
                </div>
                <div style={{width:'100%',marginTop:10}}>
                  <div style={{fontWeight:600, fontSize:15, color:'#334155', marginBottom:6}}>KI-Anfragen</div>
                  
                  {form.status !== 'ACTIVE' && (
                    <div style={{
                      padding: '8px 12px',
                      background: '#fee2e2',
                      border: '1px solid #fecaca',
                      borderRadius: 6,
                      color: '#b91c1c',
                      fontSize: 13,
                      marginBottom: 10
                    }}>
                      <strong>Hinweis:</strong> Der Benutzer ist gesperrt oder inaktiv. KI-Tokens können nicht verwendet werden.
                    </div>
                  )}
                  
                  {aboInfo.isActive === false && !tokensBlocked && (
                    <div style={{
                      padding: '8px 12px',
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: 6,
                      color: '#b91c1c',
                      fontSize: 13,
                      marginBottom: 10,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                        <LockIcon size={16} />
                        <span><strong>Hinweis:</strong> Das Abonnement ist deaktiviert.</span>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const response = await fetch(`/api/admin/users/${user?.id}/tokens/block`, {
                              method: 'PUT',
                              headers: {
                                'Content-Type': 'application/json'
                              },
                              body: JSON.stringify({
                                blocked: false // Tokens freigeben = isActive auf true setzen
                              })
                            });
                            
                            if (response.ok) {
                              setTokensBlocked(false);
                              
                              // Erfolgsmeldung anzeigen
                              showSuccessMessage('Abonnement wurde erfolgreich aktiviert.');
                              
                              // Sicherstellen, dass eine Benachrichtigung gesendet wird
                              try {
                                await fetch(`/api/admin/users/${user?.id}/tokens-notify`, {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json'
                                  },
                                  body: JSON.stringify({
                                    message: 'Ein Administrator hat Ihr Abonnement aktiviert und Ihre Token-Nutzung freigegeben.',
                                    type: 'success'
                                  })
                                });
                              } catch (notifyError) {
                                console.error('Fehler beim Senden der Benachrichtigung:', notifyError);
                              }
                              
                              // Abo-Informationen neu laden
                              setAboLoading(true);
                              try {
                                const data = await fetch(`/api/admin/users/${user?.id}`).then(r => r.json());
                                setAboInfo(data.subscription);
                              } catch (error) {
                                console.error('Fehler beim Neuladen der Abonnement-Informationen:', error);
                              } finally {
                                setAboLoading(false);
                              }
                              
                              // Dashboard aktualisieren
                              onSave({ ...user, isActive: true });
                            } else {
                              const errorData = await response.json();
                              alert(`Fehler beim Aktivieren des Abonnements: ${errorData.message || errorData.error || 'Unbekannter Fehler'}`);
                            }
                          } catch (error) {
                            console.error('Fehler beim Aktivieren des Abonnements:', error);
                            alert(`Fehler beim Aktivieren des Abonnements: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
                          }
                        }}
                        style={{
                          padding: '6px 12px',
                          fontSize: 13,
                          background: '#ecfdf5',
                          border: '1px solid #a7f3d0',
                          borderRadius: 6,
                          color: '#047857',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        <CheckIcon size={14} />
                        Aktivieren
                      </button>
                    </div>
                  )}
                  
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <div style={{fontSize:32,fontWeight:700,color: tokensBlocked ? '#9ca3af' : '#1976d2'}}>{aboInfo.aiRemaining ?? (aboInfo.aiQuota - (aboInfo.aiUsed ?? 0))}</div>
                    <div style={{fontSize:14,color:'#64748b'}}>von {aboInfo.aiQuota ?? 0} im Monat</div>
                    {!tokenEditMode ? (
                      <div style={{marginLeft: 'auto', display: 'flex', gap: 8}}>
                        <button 
                          type="button"
                          onClick={() => {
                            setTokenEditMode(true);
                            setTokenInput(aboInfo.aiQuota?.toString() ?? ''); // aiQuota statt aiRemaining
                          }}
                          style={{
                            padding: '6px 12px',
                            fontSize: 13,
                            background: '#f0f9ff',
                            border: '1px solid #bae6fd',
                            borderRadius: 6,
                            color: '#0284c7',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          Tokens bearbeiten
                        </button>
                        <button 
                          type="button"
                          onClick={async () => {
                            try {
                              const newBlockedState = !tokensBlocked;
                              const response = await fetch(`/api/admin/users/${user?.id}/tokens/block`, {
                                method: 'PUT',
                                headers: {
                                  'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                  blocked: newBlockedState
                                })
                              });
                              
                              if (response.ok) {
                                setTokensBlocked(newBlockedState);
                                
                                // Erfolgsmeldung anzeigen
                                showSuccessMessage(newBlockedState ? 
                                  'Tokens wurden erfolgreich gesperrt.' : 
                                  'Tokens wurden erfolgreich freigegeben.');
                                
                                // Sicherstellen, dass eine Benachrichtigung gesendet wird
                                try {
                                  const message = newBlockedState ? 
                                    'Ihre Token-Nutzung wurde von einem Administrator gesperrt.' : 
                                    'Ihre Token-Nutzung wurde wieder freigegeben.';
                                  
                                  const type = newBlockedState ? 'warning' : 'success';
                                  
                                  await fetch(`/api/admin/users/${user?.id}/tokens-notify`, {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({
                                      message,
                                      type
                                    })
                                  });
                                } catch (notifyError) {
                                  console.error('Fehler beim Senden der Benachrichtigung:', notifyError);
                                }
                                
                                // Abo-Informationen neu laden
                                setAboLoading(true);
                                try {
                                  const data = await fetch(`/api/admin/users/${user?.id}`).then(r => r.json());
                                  setAboInfo(data.subscription);
                                } catch (error) {
                                  console.error('Fehler beim Neuladen der Abonnement-Informationen:', error);
                                } finally {
                                  setAboLoading(false);
                                }
                                
                                // Dashboard aktualisieren mit korrektem isActive-Wert
                                // Da isActive das Gegenteil von blocked ist, verwenden wir !newBlockedState
                                onSave({ ...user, isActive: !newBlockedState });
                              } else {
                                const errorData = await response.json();
                                alert(`Fehler beim ${newBlockedState ? 'Sperren' : 'Freigeben'} der Tokens: ${errorData.message || errorData.error || 'Unbekannter Fehler'}`);
                              }
                            } catch (error) {
                              console.error('Token-Block-Fehler:', error);
                              alert(`Fehler beim ${tokensBlocked ? 'Freigeben' : 'Sperren'} der Tokens: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
                            }
                          }}
                          className={styles.iconButton}
                          style={{
                            marginLeft: 8,
                            padding: 10,
                            background: tokensBlocked ? '#ecfdf5' : '#fef2f2',
                            border: `1px solid ${tokensBlocked ? '#a7f3d0' : '#fecaca'}`,
                            borderRadius: 6,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          title={tokensBlocked ? 'Tokens freigeben' : 'Tokens sperren'}
                        >
                          {tokensBlocked ? <CheckIcon /> : <LockIcon />}
                        </button>
                      </div>
                    ) : null}
                  </div>
                  
                  {tokensBlocked && (
                    <div style={{
                      padding: '8px 12px',
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: 6,
                      color: '#b91c1c',
                      fontSize: 13,
                      marginTop: 10,
                      marginBottom: tokenEditMode ? 0 : 10,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8
                    }}>
                      <LockIcon size={16} />
                      <span><strong>Hinweis:</strong> Die Token-Nutzung für diesen Benutzer ist gesperrt.</span>
                    </div>
                  )}
                  
                  {tokenEditMode ? (
                    <div style={{marginTop: 10, marginBottom: 12}}>
                      <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                        <input
                          type="number"
                          value={tokenInput}
                          onChange={e => setTokenInput(e.target.value)}
                          min="0"
                          max={aboInfo.aiQuota}
                          className={styles.adminInput}
                          style={{margin: 0, flex: 1}}
                          placeholder="Neue Anzahl an Tokens"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            const newTokenValue = parseInt(tokenInput, 10);
                            if (isNaN(newTokenValue) || newTokenValue < 0 || newTokenValue > (aboInfo.aiQuota ?? 0)) {
                              alert('Bitte geben Sie eine gültige Token-Anzahl zwischen 0 und ' + (aboInfo.aiQuota ?? 0) + ' ein.');
                              return;
                            }
                            try {
                              const response = await fetch(`/api/admin/users/${user?.id}/tokens`, {
                                method: 'PUT',
                                headers: {
                                  'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                  tokens: newTokenValue,
                                  userStatus: form.status
                                })
                              });
                              
                              if (response.ok) {
                                // Token aktualisiert, Abo-Daten neu laden
                                setTokenEditMode(false);
                                setAboLoading(true);
                                
                                // Erfolgsmeldung anzeigen
                                showSuccessMessage('Tokens wurden erfolgreich aktualisiert.');
                                
                                // Sicherstellen, dass eine Benachrichtigung gesendet wird
                                try {
                                  const oldTokens = aboInfo.aiRemaining || 0;
                                  const newTokens = parseInt(tokenInput, 10) || 0;
                                  const tokenDiff = newTokens - oldTokens;
                                  
                                  let message = '';
                                  let type = 'info';
                                  
                                  if (tokenDiff > 0) {
                                    message = `Ein Administrator hat Ihnen ${tokenDiff} zusätzliche Tokens zugeteilt. Neue Gesamtanzahl: ${newTokens}`;
                                    type = 'success';
                                  } else if (tokenDiff < 0) {
                                    message = `Ein Administrator hat Ihre verfügbaren Tokens um ${Math.abs(tokenDiff)} reduziert. Neue Gesamtanzahl: ${newTokens}`;
                                    type = 'warning';
                                  } else {
                                    message = `Ein Administrator hat Ihre Tokens aktualisiert. Neue Gesamtanzahl: ${newTokens}`;
                                  }
                                  
                                  await fetch(`/api/admin/users/${user?.id}/tokens-notify`, {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({
                                      message,
                                      type
                                    })
                                  });
                                } catch (notifyError) {
                                  console.error('Fehler beim Senden der Benachrichtigung:', notifyError);
                                }
                                
                                const data = await fetch(`/api/admin/users/${user?.id}`).then(r => r.json());
                                setAboInfo(data.subscription);
                                // Dashboard aktualisieren
                                onSave({ ...user, tokens: parseInt(tokenInput, 10) || 0 });
                              } else {
                                // Fehlermeldung aus dem API-Response holen
                                const errorData = await response.json();
                                alert(`Fehler beim Aktualisieren der Tokens: ${errorData.message || errorData.error || 'Unbekannter Fehler'}`);
                              }
                            } catch (error) {
                              console.error('Token-Update-Fehler:', error);
                              alert(`Fehler beim Aktualisieren der Tokens: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
                            } finally {
                              setAboLoading(false);
                            }
                          }}
                          style={{
                            padding: '10px 16px',
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: 6,
                            fontWeight: 500,
                            cursor: 'pointer'
                          }}
                        >
                          Speichern
                        </button>
                        <button
                          type="button"
                          onClick={() => setTokenEditMode(false)}
                          style={{
                            padding: '10px 16px',
                            background: '#f3f4f6',
                            color: '#4b5563',
                            border: '1px solid #d1d5db',
                            borderRadius: 6,
                            fontWeight: 500,
                            cursor: 'pointer'
                          }}
                        >
                          Abbrechen
                        </button>
                      </div>
                    </div>
                  ) : null}
                  
                  <div style={{height:8,background:'#e5e7eb',borderRadius:4,marginTop:8,overflow:'hidden'}}>
                    <div 
                      style={{
                        width: `${aboInfo.aiQuota ? (aboInfo.aiRemaining/aboInfo.aiQuota)*100 : 0}%`, 
                        height: '100%', 
                        background: tokensBlocked ? '#9ca3af' : '#3b82f6', 
                        borderRadius: 4, 
                        transition: 'width 0.3s'
                      }}
                    ></div>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 13,
                    color: '#64748b',
                    marginTop: 2
                  }}>
                    <div>Verbleibend: {Math.round((aboInfo.aiRemaining/aboInfo.aiQuota)*100)}%</div>
                    <div>{tokensBlocked ? 'Gesperrt' : `${aboInfo.aiUsed ?? 0} genutzt`}</div>
                  </div>
                </div>
              </>
            ) : (
              <div style={{color:'#64748b'}}>Keine Abo-Informationen vorhanden.</div>
            )}
          </div>
        </div>

        {/* Audit-Log-Bereich */}
        <div className={styles.benutzerSection}>
          <BenutzerAuditLog userId={user.id} />
        </div>
      </div>
    </div>
  );
};

// Hilfsfunktion für Datumsformatierung
function formatDateDE(dateString: string): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '—';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

export default BenutzerBearbeiten;
