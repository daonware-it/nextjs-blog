import React from 'react';
import Head from "next/head";
import styles from "../components/profile.module.css";
import { useSession, signOut } from "next-auth/react";
import Image from 'next/image';
import TwoFactorSetupDialog from "../components/TwoFactorSetupDialog";
import Navbar from "../components/Navbar";
import dynamic from "next/dynamic";
const AvatarUpload = dynamic(() => import("../components/AvatarUpload"), { ssr: false });
import Footer from "../components/Footer";


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

export default function ProfilePage() {
  const { data: session, status } = useSession({
    required: false,
    onUnauthenticated() {
      // Optional: Umleitung zur Login-Seite, wenn nicht authentifiziert
      // Stattdessen zeigen wir eine Nachricht im UI
    }
  });
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
    if (status === "authenticated" && user?.email) {
      const intervalId = setInterval(() => {
        refreshRequestsInfo().catch(console.error);
      }, 300000); // 5 Minuten = 300000ms
      
      return () => clearInterval(intervalId);
    }
  }, [user?.email, refreshRequestsInfo]);

  React.useEffect(() => {
    async function fetchPlan() {
      if (status === "authenticated" && user?.email) {
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

  // 2FA State
  const [twoFactorEnabled, setTwoFactorEnabled] = React.useState<boolean>(false);
  const [showTwoFAPasswordModal, setShowTwoFAPasswordModal] = React.useState(false);
  const [twoFAPassword, setTwoFAPassword] = React.useState("");
  const [twoFAMode, setTwoFAMode] = React.useState<'setup' | 'manage'>("setup");
  const [show2FASetup, setShow2FASetup] = React.useState(false);
  const [show2FAManage, setShow2FAManage] = React.useState(false);
  const [showDisable2FAModal, setShowDisable2FAModal] = React.useState(false);
  const [disable2faLoading, setDisable2faLoading] = React.useState(false);

  React.useEffect(() => {
    async function fetchAvatar() {
      if (status === "authenticated" && user?.email) {
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
      if (status === "authenticated" && user?.email) {
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

  React.useEffect(() => {
    // 2FA-Status immer aus der API laden, nicht aus der Session
    if (status === "authenticated" && user?.email) {
      refreshUserData().catch(console.error);
    }
  }, [status, user?.email]);

  // 2FA generieren (öffnet den Setup-Dialog)
  const handleGenerate2FA = () => {
    setShow2FASetup(true);
  };

  // 2FA deaktivieren
  const handleDisable2FA = async () => {
    setShowDisable2FAModal(true);
  };

  const confirmDisable2FA = async () => {
    setDisable2faLoading(true);
    try {
      const res = await fetch("/api/auth/disable-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Ein unbekannter Fehler ist aufgetreten');
      }
      const data = await res.json();
      if (data.success) {
        setMessage("2FA wurde erfolgreich deaktiviert.");
        setTwoFactorEnabled(false);
        await refreshUserData();
      } else {
        setMessage("Fehler beim Deaktivieren: " + (data.error || 'Unbekannter Fehler'));
      }
    } catch (err: any) {
      setMessage("Fehler beim Deaktivieren: " + err.message);
    }
    setDisable2faLoading(false);
    setShowDisable2FAModal(false);
  };

  const refreshUserData = async () => {
    if (!user?.email || status !== "authenticated") return;
    try {
      const res = await fetch(`/api/profile-info?email=${encodeURIComponent(user.email)}&t=${new Date().getTime()}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error("API-Fehler:", errorText);
        throw new Error(errorText);
      }
      const data = await res.json();
      console.log('API twoFactorEnabled:', data.twoFactorEnabled);
      // Aktualisieren des 2FA-Status aus der API-Antwort
      if (typeof data.twoFactorEnabled !== "undefined") {
        setTwoFactorEnabled(data.twoFactorEnabled);
      } else {
        setTwoFactorEnabled(user?.twoFactorEnabled ?? false);
      }
    } catch (err: any) {
      console.error("Fehler beim Aktualisieren der Benutzerdaten:", err.message);
    }
  };

  const [isTokenStatusRefreshing, setIsTokenStatusRefreshing] = React.useState(false);

  const handleTokenStatusRefresh = async () => {
    if (isTokenStatusRefreshing) return;
    setIsTokenStatusRefreshing(true);
    try {
      const res = await fetch("/api/profile-token-status-simple", {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setTokenBlockStatus(data.isBlocked);
      await refreshUserData();
    } catch (err: any) {
      console.error("Fehler beim Aktualisieren des Token-Status:", err.message);
    }
    setIsTokenStatusRefreshing(false);
  };

  React.useEffect(() => {
    const interval = setInterval(() => {
      handleTokenStatusRefresh().catch(console.error);
    }, 60000); // 1 Minute
    return () => clearInterval(interval);
  }, []);

  const [avatarUploadInProgress, setAvatarUploadInProgress] = React.useState(false);

  const handleAvatarUpload = async (file: File) => {
    setAvatarUploadInProgress(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/profile-avatar-upload", {
        method: "POST",
        body: formData
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setAvatarUrl(data.avatarUrl);
      setMessage("Avatar erfolgreich aktualisiert.");
      await refreshUserData();
    } catch (err: any) {
      setMessage("Fehler beim Hochladen des Avatars: " + err.message);
    }
    setAvatarUploadInProgress(false);
  };

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

  // Funktion zum Öffnen des Passwort-Modals für 2FA
  const openTwoFAPasswordModal = (mode: 'setup' | 'manage') => {
    setTwoFAMode(mode);
    setShowTwoFAPasswordModal(true);
  };

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
                onUpload={handleAvatarUpload}
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
                fontSize: 32,
                color: '#888',
              }}>
                <span>👤</span>
              </div>
            )}
          </div>
          <p className={styles.profileDesc}>
            Hier findest du deine persönlichen Daten, Einstellungen und Aktivitäten.
          </p>
          {message && (
            <div className={styles.profileMessage} style={{ color: message.includes("erfolgreich") ? "#388e3c" : "#d32f2f" }}>{message}</div>
          )}
          <div className={styles.profileCards}>
            {/* KI-Anfragen und Token-Status ganz oben */}
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
            {/* Abo-Plan und Benutzername */}
            <ProfileCard
              label="Abo-Plan"
              value={<span>{userPlan ? `${userPlan.name} (${userPlan.planIncludedRequests} Anfragen/Monat)` : "-"}</span>}
              color="#1976d2"
              icon="💳"
            />
            <ProfileCard
              label="Benutzername"
              value={user?.username || "-"}
              color="#1976d2"
              icon="👤"
              action={() => handleEdit("username")}
            />
            {/* E-Mail und Rolle */}
            <ProfileCard
              label="E-Mail"
              value={user?.email || "-"}
              color="#1976d2"
              icon="✉️"
              action={() => handleEdit("email")}
            />
            <ProfileCard
              label="Rolle"
              value={user?.role || "-"}
              color="#1976d2"
              icon="🛡️"
            />
            {/* Mitglied seit und Passwort */}
            <ProfileCard
              label="Mitglied seit"
              value={formatDate(user?.createdAt)}
              color="#1976d2"
              icon="📅"
            />
            <ProfileCard
              label="Passwort"
              value={"********"}
              color="#1976d2"
              icon="🔒"
              action={() => setShowPasswordModal(true)}
            />
            {/* Newsletter und 2FA */}
            <div className={styles.profileCard}>
              <h3 style={{ marginBottom: 8 }}>Newsletter</h3>
              <div>
                {allNewsletters.length === 0 ? (
                  <span>Keine Newsletter verfügbar.</span>
                ) : (
                  allNewsletters.map(nl => (
                    <div key={nl.id} style={{ marginBottom: 6 }}>
                      <label>
                        <input
                          type="checkbox"
                          checked={userNewsletters.includes(nl.id)}
                          onChange={async (e) => {
                            setNlLoading(true);
                            try {
                              const res = await fetch("/api/profile-newsletter-update", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ newsletterId: nl.id, subscribe: e.target.checked })
                              });
                              if (!res.ok) throw new Error(await res.text());
                              setNlMessage("Newsletter-Einstellungen aktualisiert.");
                              setUserNewsletters(prev => e.target.checked ? [...prev, nl.id] : prev.filter(id => id !== nl.id));
                            } catch (err: any) {
                              setNlMessage("Fehler: " + err.message);
                            }
                            setNlLoading(false);
                          }}
                          disabled={nlLoading}
                        /> {nl.name}
                      </label>
                    </div>
                  ))
                )}
                {nlMessage && <div style={{ color: nlMessage.includes("Fehler") ? "#d32f2f" : "#388e3c", marginTop: 8 }}>{nlMessage}</div>}
              </div>
            </div>
            <ProfileCard
              label="Zwei-Faktor-Authentifizierung"
              value={twoFactorEnabled ? "Aktiv" : "Inaktiv"}
              color={twoFactorEnabled ? "#388e3c" : "#d32f2f"}
              icon="🔐"
              action={twoFactorEnabled ? handleDisable2FA : handleGenerate2FA}
            />
          </div>
        </main>
        <Footer />
      </div>
      {/* Modale außerhalb des Haupt-Containers */}
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
      {/* Passwort-Modal für 2FA */}
      {showTwoFAPasswordModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2>2FA: Passwort bestätigen</h2>
            <input
              type="password"
              placeholder="Passwort eingeben"
              value={twoFAPassword}
              onChange={e => setTwoFAPassword(e.target.value)}
              className={styles.inputField}
              autoFocus
            />
            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <button
                className={styles.profileButton}
                onClick={() => {
                  setShowTwoFAPasswordModal(false);
                  setTwoFAPassword("");
                }}
              >Abbrechen</button>
              <button
                className={styles.profileButton}
                disabled={!twoFAPassword}
                onClick={() => {
                  setShowTwoFAPasswordModal(false);
                  if (twoFAMode === "setup") setShow2FASetup(true);
                  else setShow2FAManage(true);
                }}
              >Weiter</button>
            </div>
          </div>
        </div>
      )}
      {/* 2FA-Setup-Dialog als Komponente */}
      {show2FASetup && (
        <TwoFactorSetupDialog 
          userId={user?.id} 
          email={user?.email || ""}
          password={twoFAPassword}
          onClose={() => {
            setShow2FASetup(false);
            refreshUserData().catch(console.error);
          }}
          onSuccess={async () => {
            await refreshUserData();
            setTwoFactorEnabled(true);
          }}
          mode="setup"
        />
      )}
      {show2FAManage && (
        <TwoFactorSetupDialog
          userId={user?.id}
          email={user?.email || ""}
          password={twoFAPassword}
          mode="manage"
          onClose={() => setShow2FAManage(false)}
        />
      )}
      {/* 2FA-Deaktivierungs-Dialog */}
      {showDisable2FAModal && (
        <div className={styles.profileModalOverlay}>
          <div className={styles.profileModal} style={{ minWidth: 340, position: 'relative', padding: 32 }}>
            <span style={{ fontSize: 38, color: '#f44336', marginBottom: 12, display: 'block', textAlign: 'center' }}>⚠️</span>
            <h2 style={{ textAlign: 'center', marginBottom: 10, color: '#f44336', fontWeight: 700 }}>Zwei-Faktor-Authentifizierung deaktivieren?</h2>
            <p style={{ textAlign: 'center', color: '#555', marginBottom: 24 }}>
              Möchtest du die Zwei-Faktor-Authentifizierung wirklich deaktivieren?<br />
              <span style={{ color: '#f44336', fontWeight: 500 }}>Dies macht dein Konto weniger sicher.</span>
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 8 }}>
              <button
                onClick={confirmDisable2FA}
                disabled={disable2faLoading}
                className={styles.profileButton}
                style={{ background: 'linear-gradient(90deg,#f44336 60%,#ff7961 100%)', color: '#fff', fontWeight: 600, fontSize: 16, cursor: disable2faLoading ? 'not-allowed' : 'pointer', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', transition: 'background 0.2s' }}
              >Deaktivieren</button>
              <button
                onClick={() => setShowDisable2FAModal(false)}
                disabled={disable2faLoading}
                className={styles.profileButton}
              >Abbrechen</button>
            </div>
            {disable2faLoading && <div style={{ textAlign: 'center', marginTop: 16, color: '#888' }}>Bitte warten...</div>}
          </div>
        </div>
      )}
    </>
  );
}
