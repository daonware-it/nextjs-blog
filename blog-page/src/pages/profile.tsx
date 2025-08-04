import React from 'react';
import Head from "next/head";
import styles from "../components/profile.module.css";
import { useSession, signOut } from "next-auth/react";

interface ProfileCardProps {
  label: string;
  value: React.ReactNode;
  color: string;
  icon: string;
  action?: () => void;
}

function ProfileCard(props: ProfileCardProps) {
  const { label, value, color, icon, action } = props;
  return (
    <div className={styles.profileCard}>
      <span style={{ fontSize: 22, marginBottom: 8 }}>{icon}</span>
      <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 6, color: "#2a3a4a" }}>{label}</div>
      <div style={{ fontSize: 16, color, wordBreak: "break-word" }}>{value}</div>
      {action && (
        <button
          onClick={action}
          className={styles.profileCardButton}
        >Bearbeiten</button>
      )}
    </div>
  );
}
import Navbar from "../components/Navbar";
import dynamic from "next/dynamic";
const AvatarUpload = dynamic(() => import("../components/AvatarUpload"), { ssr: false });
import Footer from "../components/Footer";


export default function ProfilePage() {
  const { data: session, status } = useSession();
  const user = session?.user as any;
  const [userPlan, setUserPlan] = React.useState<{ name: string; includedRequests: number; price: number; planIncludedRequests?: number; isActive?: boolean; usage?: { available: number; total: number; used: number } } | null>(null);
  const [tokenBlockStatus, setTokenBlockStatus] = React.useState<boolean | null>(null);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [requestsInfo, setRequestsInfo] = React.useState<{ available: number; total: number; used: number } | null>(null);

  const refreshRequestsInfo = React.useCallback(async () => {
      if (!user?.email) {
        return;
      }

      try {
        setIsRefreshing(true);
        const timestamp = new Date().getTime();
        const res = await fetch(`/api/profile-plan-simple?t=${timestamp}`);

        if (res.ok) {
          const data = await res.json();

          if (data.plan) {
            if (data.plan.usage) {
              setRequestsInfo(data.plan.usage);
            } else {
              const totalRequests = data.plan.planIncludedRequests || data.plan.includedRequests || 0;
              const availableRequests = data.plan.includedRequests || 0;
              const usedRequests = Math.max(0, totalRequests - availableRequests);

              const requestsData = {
                available: availableRequests,
                total: totalRequests,
                used: usedRequests
              };

              setRequestsInfo(requestsData);
            }

            setUserPlan(prevPlan => {
              if (!prevPlan) return data.plan;

              return {
                ...prevPlan,
                includedRequests: data.plan.includedRequests,
                planIncludedRequests: data.plan.planIncludedRequests || data.plan.includedRequests,
                isActive: data.plan.isActive,
                usage: data.plan.usage
              };
            });
          } else {
            console.error("Kein Plan in der Refresh-Antwort gefunden");
        }
      } else {
        console.error("Fehler beim Aktualisieren der KI-Anfragen:", await res.text());
      }
    } catch (error) {
      console.error("Fehler beim Aktualisieren der KI-Anfragen:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [user?.email]);

  React.useEffect(() => {
    if (user?.email) {
      const intervalId = setInterval(() => {
        refreshRequestsInfo().catch(console.error);
      }, 300000); // 5 Minuten = 300000ms
      
      return () => clearInterval(intervalId);
    }
  }, [user?.email, refreshRequestsInfo]);

  React.useEffect(() => {
    async function fetchPlan() {
      if (user?.email) {
        try {
          const timestamp = new Date().getTime();
          const res = await fetch(`/api/profile-plan-simple?t=${timestamp}`);
          if (!res.ok) {
            console.error("Error fetching profile plan:", await res.text());
            return;
          }
          const data = await res.json();

          if (!data.plan) {
            console.error("Keine Plan-Daten in der API-Antwort");
            return;
          }

          setUserPlan(data.plan);

          if (data.plan.usage) {
            setRequestsInfo(data.plan.usage);
          } else {
            const planIncludedRequests = data.plan.planIncludedRequests !== undefined ? 
              data.plan.planIncludedRequests : data.plan.includedRequests || 0;

            const availableRequests = data.plan.includedRequests || 0;
            const totalRequests = planIncludedRequests || 0;
            const usedRequests = Math.max(0, totalRequests - availableRequests);

            const requestsData = {
              available: availableRequests,
              total: totalRequests,
              used: usedRequests
            };

            setRequestsInfo(requestsData);
          }
          
          const tokenStatusTimestamp = new Date().getTime();
          const tokenStatusRes = await fetch(`/api/profile-token-status-simple?t=${tokenStatusTimestamp}`);
          if (!tokenStatusRes.ok) {
            console.error("Error fetching token status:", await tokenStatusRes.text());
            return;
          }
          const tokenStatusData = await tokenStatusRes.json();
          setTokenBlockStatus(tokenStatusData.isBlocked);
        } catch (error) {
          console.error("Error in fetchPlan:", error);
          setUserPlan({
            name: "Free",
            includedRequests: 0,
            price: 0,
            planIncludedRequests: 0,
            isActive: true
          });
          setRequestsInfo({
            available: 0,
            total: 0,
            used: 0
          });
          setTokenBlockStatus(false);
        }
      }
    }
    fetchPlan().catch(console.error);
  }, [user?.email]);

  const [avatarUrl, setAvatarUrl] = React.useState<string | undefined>(undefined);
  const [editField, setEditField] = React.useState<string | null>(null);
  const [inputValue, setInputValue] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = React.useState(false);
  const [repeatPassword, setRepeatPassword] = React.useState("");
  const [pwLoading, setPwLoading] = React.useState(false);
  const [pwMessage, setPwMessage] = React.useState<string | null>(null);
  const [oldPassword, setOldPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [deleteLoading, setDeleteLoading] = React.useState(false);
  const [deleteMessage, setDeleteMessage] = React.useState<string | null>(null);
  const [showNewsletterModal, setShowNewsletterModal] = React.useState(false);
  const [allNewsletters, setAllNewsletters] = React.useState<any[]>([]);
  const [userNewsletters, setUserNewsletters] = React.useState<number[]>([]);
  const [nlLoading, setNlLoading] = React.useState(false);
  const [nlMessage, setNlMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchAvatar() {
      if (user?.email) {
        try {
          const timestamp = new Date().getTime();
          const res = await fetch(`/api/profile-avatar?email=${encodeURIComponent(user.email)}&t=${timestamp}`);
          if (!res.ok) {
            console.error("Fehler beim Laden des Avatars:", await res.text());
            return;
          }
          const data = await res.json();
          if (data.avatarUrl) setAvatarUrl(data.avatarUrl);
        } catch (error) {
          console.error("Fehler beim Laden des Avatars:", error);
        }
      }
    }
    fetchAvatar().catch(console.error);
  }, [user?.email]);

  React.useEffect(() => {
    async function fetchNewsletters() {
      try {
        const timestamp = new Date().getTime();
        const res = await fetch(`/api/newsletter-list?t=${timestamp}`);
        if (!res.ok) {
          console.error("Fehler beim Laden der Newsletter:", await res.text());
          setAllNewsletters([]);
          return;
        }
        const data = await res.json();
        setAllNewsletters(data.newsletters || []);
      } catch (error) {
        console.error("Fehler beim Laden der Newsletter:", error);
        setAllNewsletters([]);
      }
    }
    fetchNewsletters().catch(console.error);
  }, []);

  React.useEffect(() => {
    async function fetchUserNewsletters() {
      if (user?.email) {
        try {
          const timestamp = new Date().getTime();
          const res = await fetch(`/api/profile-newsletters?email=${encodeURIComponent(user.email)}&t=${timestamp}`);
          if (!res.ok) {
            console.error("Fehler beim Laden der Benutzer-Newsletter:", await res.text());
            setUserNewsletters([]);
            return;
          }
          const data = await res.json();
          setUserNewsletters((data.newsletters || []).map((nl: any) => nl.id));
        } catch (error) {
          console.error("Fehler beim Laden der Benutzer-Newsletter:", error);
          setUserNewsletters([]);
        }
      }
    }
    if (showNewsletterModal) fetchUserNewsletters().catch(console.error);
  }, [user?.email, showNewsletterModal]);

  function formatDate(dateString?: string) {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("de-DE", { year: "numeric", month: "long" });
  }

  async function handleEdit(field: "username" | "email") {
    setEditField(field);
    setInputValue(user?.[field] || "");
    setMessage(null);
  }

  async function handleSave() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/profile-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [editField!]: inputValue }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Änderung erfolgreich! Bitte neu einloggen.");
        
        setTimeout(() => {
          signOut({ redirect: true, callbackUrl: "/login?updated=true" });
        }, 2000);
        
        setEditField(null);
      } else {
        setMessage(data.error || "Fehler bei der Änderung.");
      }
    } catch (e) {
      setMessage("Serverfehler.");
    }
    setLoading(false);
  }

  if (status === "loading") {
    return (
      <div className={styles.profileContainer}>
        <Navbar />
        <main className={styles.profileMain}>
          <div>Profil wird geladen ...</div>
        </main>
        <Footer />
      </div>
    );
  }
  if (status === "unauthenticated") {
    return (
      <div className={styles.profileContainer}>
        <Navbar />
        <main className={styles.profileMain}>
          <div style={{ color: "#d32f2f", fontWeight: 600, fontSize: 20, margin: "60px auto", textAlign: "center" }}>
            Du bist nicht angemeldet.<br />Bitte logge dich ein, um dein Profil zu sehen.
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  return (
    <>
      <Head>
        <title>Mein Profil | Homepage</title>
      </Head>
      <div className={styles.profileContainer}>
        <Navbar />
        <main className={styles.profileMain}>
          <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 24 }}>
            {avatarUrl ? (
              <AvatarUpload
                avatarUrl={avatarUrl}
                onUpload={() => {}}
              />
            ) : (
              <div style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: '#e0e0e0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 36,
                color: '#888',
                marginRight: 16
              }}>
                <span role="img" aria-label="Avatar">👤</span>
              </div>
            )}
            <h1 className={styles.profileTitle}>Mein Profil</h1>
          </div>
          <p className={styles.profileDesc}>
            Hier findest du deine persönlichen Daten, Einstellungen und Aktivitäten.
          </p>
          {message && (
            <div className={styles.profileMessage} style={{ color: message.includes("erfolgreich") ? "#388e3c" : "#d32f2f" }}>{message}</div>
          )}
          <div className={styles.profileCards}>
            <ProfileCard
              label="KI-Anfragen (Verfügbar)"
              value={
                <span className={tokenBlockStatus || (userPlan && !userPlan.isActive) ? styles.strikethrough : ""}>
                  {userPlan ? (
                    <span>
                      <strong>{userPlan.includedRequests}</strong>
                      {isRefreshing ? ' wird aktualisiert...' : ''}
                      <span style={{ fontSize: '12px', color: '#666', marginLeft: '4px' }}>
                        (von {userPlan.planIncludedRequests})
                      </span>
                    </span>
                  ) : "-"}
                  {(tokenBlockStatus || (userPlan && !userPlan.isActive)) && (
                    <span className={styles.tokenBlockBadge}>Gesperrt</span>
                  )}
                  {(!tokenBlockStatus && userPlan && userPlan.includedRequests === 0) && (
                    <span className={styles.tokenBlockBadge} style={{ background: 'rgba(251, 140, 0, 0.15)', color: '#fb8c00' }}>Aufgebraucht</span>
                  )}
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      refreshRequestsInfo().catch(console.error);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      marginLeft: '8px',
                      padding: '0',
                      fontSize: '14px',
                      color: '#1976d2',
                      display: 'inline-flex',
                      alignItems: 'center'
                    }}
                    title="Anzahl aktualisieren"
                    disabled={isRefreshing}
                  >
                    {isRefreshing ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 6v6l4 2" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                      </svg>
                    )}
                  </button>
                </span>
              }
              color={tokenBlockStatus || (userPlan && !userPlan.isActive) ? "#d32f2f" : (userPlan && userPlan.includedRequests === 0) ? "#fb8c00" : "#1976d2"}
              icon="🤖"
            />
            <div className={`${styles.profileCard} ${styles.tokenStatusCard} ${tokenBlockStatus || (userPlan && !userPlan.isActive) ? styles.tokenBlocked : styles.tokenActive}`}>
              <div className={styles.tokenStatusIcon}>
                {tokenBlockStatus || (userPlan && !userPlan.isActive) ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                )}
              </div>
              <div className={styles.tokenStatusLabel}>
                Token-Status
                {requestsInfo && (
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    {requestsInfo.used} von {requestsInfo.total} verwendet
                  </div>
                )}
              </div>
              <div className={styles.tokenStatusValue}>
                {tokenBlockStatus === null && !userPlan ? (
                  <span className={styles.tokenStatusLoading}>Wird geladen...</span>
                ) : tokenBlockStatus || (userPlan && !userPlan.isActive) ? (
                  <span className={styles.tokenStatusBlocked}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6 6 18M6 6l12 12"></path>
                    </svg>
                    Gesperrt
                  </span>
                ) : requestsInfo && requestsInfo.available === 0 ? (
                  <span className={styles.tokenStatusExhausted}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="8" y1="12" x2="16" y2="12" />
                    </svg>
                    Aufgebraucht
                  </span>
                ) : (
                  <span className={styles.tokenStatusActive}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Aktiv
                  </span>
                )}
              </div>
              {(tokenBlockStatus || (userPlan && !userPlan.isActive)) && (
                <div className={styles.tokenBlockMessage}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  <span>Deine KI-Tokens wurden gesperrt. Bitte kontaktiere den Support für weitere Informationen.</span>
                </div>
              )}
              {(!tokenBlockStatus && userPlan && userPlan.includedRequests === 0) && (
                <div className={styles.tokenExhaustedMessage}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#fb8c00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  <span>Deine KI-Anfragen sind für diesen Monat aufgebraucht. Am Anfang des nächsten Abrechnungszeitraums erhältst du neue Anfragen.</span>
                </div>
              )}
            </div>
            <ProfileCard
              label="Abo-Plan"
              value={<span>{userPlan ? `${userPlan.name} (${userPlan.planIncludedRequests} Anfragen/Monat)` : "-"}</span>}
              color="#1976d2"
              icon="💳"
            />
            <ProfileCard
              label="Benutzername"
              value={<span>{user?.username || user?.name || "-"}</span>}
              color="#1976d2"
              icon="👤"
              action={editField !== "username" ? () => handleEdit("username") : undefined}
            />
            <ProfileCard
              label="E-Mail"
              value={<span>{user?.email || "-"}</span>}
              color="#388e3c"
              icon="✉️"
              action={editField !== "email" ? () => handleEdit("email") : undefined}
            />
          <ProfileCard label="Rolle" value={user?.role || "-"} color="#8e24aa" icon="⭐" />
          <ProfileCard label="Mitglied seit" value={formatDate(user?.createdAt)} color="#444" icon="📅" />
          <ProfileCard
            label="Passwort"
            value={<span>••••••••</span>}
            color="#d32f2f"
            icon="🔒"
            action={() => setShowPasswordModal(true)}
          />
          <ProfileCard
            label="Newsletter"
            value={<span>{userNewsletters.length > 0 ? `${userNewsletters.length} abonniert` : "Keine abonniert"}</span>}
            color="#1976d2"
            icon="📰"
            action={() => setShowNewsletterModal(true)}
          />
          </div>
        <div style={{ marginTop: 40, textAlign: "center" }}>
          <button
            onClick={() => setShowDeleteModal(true)}
            className={styles.profileButton}
            style={{
              background: "linear-gradient(90deg,#d32f2f 60%,#ff7043 100%)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 18,
              boxShadow: "0 2px 12px rgba(211,47,47,0.12)",
              transition: "background 0.2s",
              padding: "14px 36px",
              borderRadius: 12,
              letterSpacing: "0.5px",
              display: "inline-flex",
              alignItems: "center",
              gap: 10
            }}
          >
            <span style={{ fontSize: 22, marginRight: 6 }}>🗑️</span>
            Konto löschen
          </button>
        </div>
        </main>
        <Footer />
        {editField && (
          <div className={styles.profileModalOverlay}>
            <div className={styles.profileModal}>
              <button
                onClick={() => setEditField(null)}
                style={{ position: "absolute", top: 18, right: 18, background: "none", border: "none", fontSize: 22, color: "#888", cursor: "pointer" }}
                aria-label="Schließen"
              >×</button>
              <div style={{ fontWeight: 600, fontSize: 19, marginBottom: 6, color: "#2a3a4a" }}>
                {editField === "username" ? "Benutzername ändern" : "E-Mail ändern"}
              </div>
              <div style={{ position: "relative", width: "100%" }}>
                <input
                  className={styles.profileInput}
                  type={editField === "email" ? "email" : "text"}
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  disabled={loading}
                  autoFocus
                />
                <span style={{ position: "absolute", right: 25, top: 7, fontSize: 20, color: "#bfc8e0" }}>
                  {editField === "username" ? "👤" : "✉️"}
                </span>
              </div>
              <div style={{ display: "flex", gap: 12, width: "100%", justifyContent: "flex-end" }}>
                <button
                  onClick={handleSave}
                  disabled={loading || !inputValue}
                  className={styles.profileButton}
                  style={{
                    background: editField === "username"
                      ? "linear-gradient(90deg,#1976d2 60%,#42a5f5 100%)"
                      : "linear-gradient(90deg,#388e3c 60%,#66bb6a 100%)",
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: 16,
                    cursor: loading ? "not-allowed" : "pointer",
                    boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
                    transition: "background 0.2s"
                  }}
                >Speichern</button>
                <button
                  onClick={() => setEditField(null)}
                  disabled={loading}
                  className={styles.profileButton}
                >Abbrechen</button>
              </div>
          </div>
        </div>
      )}
      {showNewsletterModal && (
        <div className={styles.profileModalOverlay}>
          <div className={styles.profileModal} style={{ minWidth: 340 }}>
            <button
              onClick={() => { setShowNewsletterModal(false); setNlMessage(null); }}
              style={{ position: "absolute", top: 18, right: 18, background: "none", border: "none", fontSize: 22, color: "#888", cursor: "pointer" }}
              aria-label="Schließen"
            >×</button>
            <div style={{ fontWeight: 600, fontSize: 19, marginBottom: 6, color: "#2a3a4a" }}>
              Newsletter verwalten
            </div>
            <div style={{ marginBottom: 12, color: "#444" }}>
              Wähle die Newsletter aus, die du abonnieren möchtest:
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {allNewsletters.map(nl => (
                <label key={nl.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={userNewsletters.includes(nl.id)}
                    onChange={e => {
                      if (e.target.checked) {
                        setUserNewsletters([...userNewsletters, nl.id]);
                      } else {
                        setUserNewsletters(userNewsletters.filter(id => id !== nl.id));
                      }
                    }}
                  />
                  <span>{nl.title}</span>
                </label>
              ))}
            </div>
            {nlMessage && (
              <div style={{ color: nlMessage.includes("erfolgreich") ? "#388e3c" : "#d32f2f", marginBottom: 10, fontWeight: 500 }}>{nlMessage}</div>
            )}
            <div style={{ display: "flex", gap: 12, width: "100%", justifyContent: "flex-end" }}>
              <button
                onClick={async () => {
                  setNlLoading(true);
                  setNlMessage(null);
                  try {
                    const res = await fetch("/api/profile-newsletters", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email: user.email, newsletterIds: userNewsletters }),
                    });
                    const data = await res.json();
                    if (res.ok) {
                      setNlMessage("Newsletter erfolgreich gespeichert!");
                      setShowNewsletterModal(false);
                    } else {
                      setNlMessage(data.error || "Fehler beim Speichern.");
                    }
                  } catch (e) {
                    setNlMessage("Serverfehler.");
                  }
                  setNlLoading(false);
                }}
                disabled={nlLoading}
                className={styles.profileButton}
                style={{ background: "linear-gradient(90deg,#1976d2 60%,#42a5f5 100%)", color: "#fff", fontWeight: 600, fontSize: 16, cursor: nlLoading ? "not-allowed" : "pointer", boxShadow: "0 1px 6px rgba(0,0,0,0.07)", transition: "background 0.2s" }}
              >Speichern</button>
              <button
                onClick={() => setShowNewsletterModal(false)}
                disabled={nlLoading}
                className={styles.profileButton}
              >Abbrechen</button>
            </div>
          </div>
        </div>
      )}
      {showDeleteModal && (
        <div className={styles.profileModalOverlay}>
          <div className={styles.profileModal} style={{ minWidth: 370, animation: "fadeIn 0.3s" }}>
            <button
              onClick={() => { setShowDeleteModal(false); setDeleteMessage(null); }}
              style={{ position: "absolute", top: 18, right: 18, background: "none", border: "none", fontSize: 22, color: "#888", cursor: "pointer" }}
              aria-label="Schließen"
            >×</button>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 28, color: "#d32f2f" }}>🗑️</span>
              <span style={{ fontWeight: 700, fontSize: 21, color: "#d32f2f" }}>Kundenkonto unwiderruflich löschen</span>
            </div>
            <div style={{ marginBottom: 16, color: "#d32f2f", fontWeight: 500, fontSize: 16, background: "#fff3f3", borderRadius: 8, padding: "10px 14px" }}>
              <span style={{ marginRight: 6 }}>⚠️</span>
              Möchtest du dein Konto wirklich löschen? <br />Alle Daten werden entfernt und sind nicht wiederherstellbar.
            </div>
            {deleteMessage && (
              <div style={{ color: deleteMessage.includes("erfolgreich") ? "#388e3c" : "#d32f2f", marginBottom: 10, fontWeight: 500 }}>{deleteMessage}</div>
            )}
            <div style={{ display: "flex", gap: 16, width: "100%", justifyContent: "flex-end", marginTop: 10 }}>
              <button
                onClick={async () => {
                  setDeleteLoading(true);
                  setDeleteMessage(null);
                  try {
                    const res = await fetch("/api/profile-delete", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email: user.email }),
                    });
                    const data = await res.json();
                    if (res.ok) {
                      setDeleteMessage("Konto erfolgreich gelöscht! Du wirst abgemeldet.");
                      setTimeout(async () => {
                        await signOut({ redirect: false });
                        window.location.href = "/goodbye";
                      }, 2000);
                    } else {
                      setDeleteMessage(data.error || "Fehler beim Löschen.");
                    }
                  } catch (e) {
                    setDeleteMessage("Serverfehler.");
                  }
                  setDeleteLoading(false);
                }}
                disabled={deleteLoading}
                className={styles.profileButton}
                style={{ background: "linear-gradient(90deg,#d32f2f 60%,#ff7043 100%)", color: "#fff", fontWeight: 700, fontSize: 17, cursor: deleteLoading ? "not-allowed" : "pointer", boxShadow: "0 2px 12px rgba(211,47,47,0.12)", transition: "background 0.2s", borderRadius: 10, padding: "12px 28px" }}
              >
                <span style={{ fontSize: 20, marginRight: 6 }}>🗑️</span>
                Konto löschen
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
                className={styles.profileButton}
                style={{ background: "#eee", color: "#444", fontWeight: 600, fontSize: 16, borderRadius: 10, padding: "12px 28px" }}
              >Abbrechen</button>
            </div>
          </div>
        </div>
      )}
      {showPasswordModal && (
        <div className={styles.profileModalOverlay}>
          <div className={styles.profileModal}>
              <button
                onClick={() => { setShowPasswordModal(false); setOldPassword(""); setNewPassword(""); setRepeatPassword(""); setPwMessage(null); }}
                style={{ position: "absolute", top: 18, right: 18, background: "none", border: "none", fontSize: 22, color: "#888", cursor: "pointer" }}
                aria-label="Schließen"
              >×</button>
              <div style={{ fontWeight: 600, fontSize: 19, marginBottom: 6, color: "#2a3a4a" }}>
                Passwort ändern
              </div>
              <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
                <input
                  className={styles.profileInput}
                  type="password"
                  placeholder="Altes Passwort"
                  value={oldPassword}
                  onChange={e => setOldPassword(e.target.value)}
                  disabled={pwLoading}
                  autoFocus
                />
                <input
                  className={styles.profileInput}
                  type="password"
                  placeholder="Neues Passwort"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  disabled={pwLoading}
                />
                <input
                  className={styles.profileInput}
                  type="password"
                  placeholder="Neues Passwort wiederholen"
                  value={repeatPassword}
                  onChange={e => setRepeatPassword(e.target.value)}
                  disabled={pwLoading}
                />
              </div>
              {pwMessage && (
                <div style={{ color: pwMessage.includes("erfolgreich") ? "#388e3c" : "#d32f2f", marginTop: 10, fontWeight: 500 }}>{pwMessage}</div>
              )}
              <div style={{ display: "flex", gap: 12, width: "100%", justifyContent: "flex-end", marginTop: 10 }}>
                <button
                  onClick={async () => {
                    setPwLoading(true);
                    setPwMessage(null);
                    if (!oldPassword || !newPassword || !repeatPassword) {
                      setPwMessage("Bitte alle Felder ausfüllen.");
                      setPwLoading(false);
                      return;
                    }
                    if (newPassword !== repeatPassword) {
                      setPwMessage("Die neuen Passwörter stimmen nicht überein.");
                      setPwLoading(false);
                      return;
                    }
                    if (newPassword.length < 8) {
                      setPwMessage("Das neue Passwort muss mindestens 8 Zeichen lang sein.");
                      setPwLoading(false);
                      return;
                    }
                    try {
                      const res = await fetch("/api/auth/password-update", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ oldPassword, newPassword }),
                      });
                      const data = await res.json();
                      if (res.ok) {
                        setPwMessage("Passwort erfolgreich geändert! Bitte neu einloggen.");
                        setOldPassword("");
                        setNewPassword("");
                        setRepeatPassword("");
                      } else {
                        setPwMessage(data.error || "Fehler bei der Änderung.");
                      }
                    } catch (e) {
                      setPwMessage("Serverfehler.");
                    }
                    setPwLoading(false);
                  }}
                  disabled={pwLoading}
                  className={styles.profileButton}
                  style={{
                    background: "linear-gradient(90deg,#d32f2f 60%,#ff7043 100%)",
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: 16,
                    cursor: pwLoading ? "not-allowed" : "pointer",
                    boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
                    transition: "background 0.2s"
                  }}
                >Speichern</button>
                <button
                  onClick={() => { setShowPasswordModal(false); setOldPassword(""); setNewPassword(""); setRepeatPassword(""); setPwMessage(null); }}
                  disabled={pwLoading}
                  className={styles.profileButton}
                >Abbrechen</button>
              </div>
            </div>
          </div>
        )}

      </div>

    </>
  );
}
