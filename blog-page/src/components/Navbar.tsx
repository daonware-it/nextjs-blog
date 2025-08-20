import { useEffect, useState } from "react";
import navbarStyles from "./navbar.module.css";
import { useSession, signOut } from "next-auth/react";
import type { Session } from "next-auth";

// Google Fonts für moderne Schrift überall einbinden
function useGlobalFonts() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!document.getElementById("global-fonts")) {
        const link = document.createElement("link");
        link.id = "global-fonts";
        link.href = "https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=Inter:wght@400;500;700&display=swap";
        link.rel = "stylesheet";
        document.head.appendChild(link);
      }
    }
  }, []);
}

export default function Navbar() {
  useGlobalFonts();
  const { data: session } = useSession() as { data: Session | null };
  const isLoggedIn = !!session;
  const user = session?.user as (Session["user"] & { role?: string }) | undefined;
  const isAdminOrMod = user?.role === "ADMIN" || user?.role === "MODERATOR";
  const [menuOpen, setMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [lastNotificationCheck, setLastNotificationCheck] = useState<string | null>(null);


  // Notifications aus der Datenbank laden
  useEffect(() => {
    if (isLoggedIn) {
      // Initial beim Laden Benachrichtigungen abrufen
      fetchNotifications();
      
      // Effizientere Benachrichtigungs-Abfrage alle Minute
      const intervalId = setInterval(fetchNotificationsPolling, 60000); // Jede Minute
      
      // Custom-Event-Listener für Notification-Reload
      function reloadHandler() {
        fetchNotifications();
      }
      
      window.addEventListener("reload-notifications", reloadHandler);
      
      return () => {
        window.removeEventListener("reload-notifications", reloadHandler);
        clearInterval(intervalId);
      };
    }
  }, [isLoggedIn]);
  
  // Funktion zum Abrufen der Benachrichtigungen
  const fetchNotifications = () => {
    // Timestamp zur Cache-Vermeidung
    const timestamp = new Date().getTime();
    fetch(`/api/notifications-list?t=${timestamp}`)
      .then(res => res.json())
      .then(data => {
        // Nur aktualisieren, wenn neue Benachrichtigungen vorhanden sind
        if (data.notifications && 
            (data.notifications.length !== notifications.length || 
             JSON.stringify(data.notifications) !== JSON.stringify(notifications))) {
          setNotifications(data.notifications || []);
          
          // Wenn neue Benachrichtigungen hinzugekommen sind und das Popup nicht angezeigt wird,
          // eine kurze Animation oder ein Sound-Feedback anzeigen
          if (data.notifications.length > notifications.length && !showNotifications) {
            // Kurze Animation für die Glocke
            const bell = document.querySelector(`.${navbarStyles.notificationBell}`);
            if (bell) {
              bell.classList.add(navbarStyles.bellShake);
              setTimeout(() => {
                bell.classList.remove(navbarStyles.bellShake);
              }, 1000);
            }
          }
        }
        
        // Aktualisiere den Zeitstempel des letzten Abrufs
        setLastNotificationCheck(new Date().toISOString());
      })
      .catch(error => console.error("Fehler beim Laden der Benachrichtigungen:", error));
  };

  // Optimierte Funktion für regelmäßiges Polling
  const fetchNotificationsPolling = () => {
    // Wir verwenden lastNotificationCheck, um nur neue Benachrichtigungen abzurufen
    const timestamp = new Date().getTime();
    const lastCheckParam = lastNotificationCheck ? `&lastCheck=${encodeURIComponent(lastNotificationCheck)}` : '';
    
    fetch(`/api/notifications-polling?t=${timestamp}${lastCheckParam}`)
      .then(res => res.json())
      .then(data => {
        // Nur wenn es neue Benachrichtigungen gibt, aktualisieren wir die Liste
        if (data.newNotifications && data.notifications && data.notifications.length > 0) {
          setNotifications(data.notifications);
          
          // Wenn das Popup nicht angezeigt wird, eine kurze Animation anzeigen
          if (!showNotifications) {
            // Kurze Animation für die Glocke
            const bell = document.querySelector(`.${navbarStyles.notificationBell}`);
            if (bell) {
              bell.classList.add(navbarStyles.bellShake);
              setTimeout(() => {
                bell.classList.remove(navbarStyles.bellShake);
              }, 1000);
            }
          }
        }
        
        // Aktualisiere den Zeitstempel des letzten Abrufs
        if (data.currentTime) {
          setLastNotificationCheck(data.currentTime);
        }
      })
      .catch(error => console.error("Fehler beim Polling der Benachrichtigungen:", error));
  };

  // Funktion zum Löschen aller Benachrichtigungen (Frontend + Backend)
  const clearNotifications = async () => {
    try {
      // Timestamp zur Cache-Vermeidung
      const timestamp = new Date().getTime();
      
      for (const n of notifications) {
        await fetch(`/api/notification-delete?t=${timestamp}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: n.id }),
        });
      }
      setNotifications([]);
    } catch (error) {
      console.error("Fehler beim Löschen aller Benachrichtigungen:", error);
    }
  };

  // Funktion zum Löschen einer einzelnen Benachrichtigung (Frontend + Backend)
  const deleteNotification = async (id: number) => {
    try {
      // Timestamp zur Cache-Vermeidung
      const timestamp = new Date().getTime();
      await fetch(`/api/notification-delete?t=${timestamp}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setNotifications(notifications => notifications.filter(n => n.id !== id));
    } catch (error) {
      console.error("Fehler beim Löschen einer Benachrichtigung:", error);
    }
  };

  // Links für das Overlay-Menü
  const menuLinks = [
    { href: "/", label: "Home" },
    { href: "/blogs", label: "Blogs" },
    { href: "/top", label: "Top Beiträge" },
    { href: "/categories", label: "Kategorien" },
    { href: "/authors", label: "Autoren" },
    { href: "/contact", label: "Kontakt" },
    { href: "/about", label: "Über uns" },
    { href: "/faq", label: "FAQ" },
  ];

  return (
    <>
      <nav className={navbarStyles.navbar}>
        {/* Hamburger-Button nur auf Mobile und linksbündig */}
        <button
          className={navbarStyles.hamburger + ' ' + navbarStyles.hamburgerMobile}
          aria-label="Menü öffnen"
          onClick={() => setMenuOpen(true)}
        >
          <span className={navbarStyles.hamburgerIcon}>
            <span className={navbarStyles.hamburgerBar}></span>
            <span className={navbarStyles.hamburgerBar}></span>
            <span className={navbarStyles.hamburgerBar}></span>
          </span>
        </button>
        <div className={navbarStyles.navLeft}>
          <a href="/" className={navbarStyles.navBrand}>DaonWare</a>
          <a href="/" className={navbarStyles.navLink}>Home</a>
          <div className={navbarStyles.navDropdown}>
            <a href="/blogs" className={navbarStyles.navLink}>Blogs</a>
            <div className={navbarStyles.dropdownContent}>
              <a href="/top" className={navbarStyles.navLink}>Top Beiträge</a>
              <a href="/categories" className={navbarStyles.navLink}>Kategorien</a>
              <a href="/authors" className={navbarStyles.navLink}>Autoren</a>
            </div>
          </div>
          <div className={navbarStyles.navDropdown}>
            <a href="/contact" className={navbarStyles.navLink}>Kontakt</a>
            <div className={navbarStyles.dropdownContent}>
              <a href="/about" className={navbarStyles.navLink}>Über uns</a>
            </div>
          </div>
          <a href="/faq" className={navbarStyles.navLink}>FAQ</a>
          {isAdminOrMod && (
            <a href="/admin" className={navbarStyles.navLink} style={{fontWeight:600, color:'#1976d2'}}>Admin</a>
          )}
        </div>
        <div className={navbarStyles.navRight}>
          {/* Notification Bell wie bei YouTube */}
          <div className={navbarStyles.notificationWrapper}>
            <button
              className={navbarStyles.notificationBell}
              aria-label="Benachrichtigungen"
              onClick={() => setShowNotifications(v => !v)}
            >
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 3C9.58 3 6 6.58 6 11V17.17L4.59 18.59C4.21 18.98 4 19.48 4 20V21C4 21.55 4.45 22 5 22H23C23.55 22 24 21.55 24 21V20C24 19.48 23.79 18.98 23.41 18.59L22 17.17V11C22 6.58 18.42 3 14 3ZM14 25C15.1 25 16 24.1 16 23H12C12 24.1 12.9 25 14 25Z" fill="#444"/>
              </svg>
              {notifications.length > 0 && (
                <span className={navbarStyles.notificationBadge}>
                  {notifications.length > 99 ? "99+" : notifications.length}
                </span>
              )}
            </button>
            {/* Popup für Benachrichtigungen */}
            {showNotifications && (
              <div className={navbarStyles.notificationPopup}>
                <div className={navbarStyles.notificationPopupTitle}>Benachrichtigungen</div>
                {notifications.length === 0 ? (
                  <div className={navbarStyles.notificationPopupEmpty}>Keine Benachrichtigungen vorhanden.</div>
                ) : (
                  <ul className={navbarStyles.notificationList}>
                    {notifications.map(n => (
                      <li key={n.id} className={navbarStyles.notificationItem}>
                        <span>{n.message}</span>
                        <button
                          className={navbarStyles.notificationDelete}
                          onClick={() => deleteNotification(n.id)}
                          aria-label={`Benachrichtigung löschen: ${n.message}`}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 6h18" stroke="#d32f2f" strokeWidth="2" strokeLinecap="round"/>
                            <rect x="5" y="6" width="14" height="14" rx="2" stroke="#d32f2f" strokeWidth="2"/>
                            <path d="M9 10v6" stroke="#d32f2f" strokeWidth="2" strokeLinecap="round"/>
                            <path d="M15 10v6" stroke="#d32f2f" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className={navbarStyles.notificationPopupActions}>
                  <button
                    className={navbarStyles.notificationClear}
                    onClick={clearNotifications}
                  >Alle löschen</button>
                  <button
                    className={navbarStyles.notificationClose}
                    onClick={() => setShowNotifications(false)}
                  >Schließen</button>
                </div>
              </div>
            )}
          </div>
          {/* ...bestehende Login/Logout-Links... */}
          {isLoggedIn ? (
            <>
              <a href="/profile" className={navbarStyles.navLink} style={{display: 'flex', alignItems: 'center', gap: 8}}>
                {session?.user?.image && session.user.image.trim() !== "" ? (
                  <img
                    src={session.user.image}
                    alt="Profilbild"
                    style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}
                  />
                ) : (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: '#e0e0e0',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
                  }}>
                    <span style={{ fontSize: 24, color: '#1976d2', lineHeight: 1 }}>👤</span>
                  </span>
                )}
              </a>
              <a
                href="#"
                className={navbarStyles.loginButton}
                style={{ marginLeft: 12 }}
                onClick={e => {
                  e.preventDefault();
                  signOut({ callbackUrl: "/login" });
                }}
              >
                Logout
              </a>
            </>
          ) : (
            <>
              <a href="/login" className={navbarStyles.loginButton}>Login</a>
              <a href="/register" className={navbarStyles.signupAnchor}>Registrieren</a>
            </>
          )}
        </div>
      </nav>

      {/* Overlay-Menü für Mobile */}
      {menuOpen && (
        <div className={navbarStyles.mobileMenuOverlay}>
          <button
            className={navbarStyles.mobileMenuClose}
            aria-label="Menü schließen"
            onClick={() => setMenuOpen(false)}
          >
            &times;
          </button>
          <div className={navbarStyles.mobileMenuLinks}>
            {menuLinks.map(link => (
              <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>
                {link.label}
              </a>
            ))}
            {isLoggedIn && (
              <>
                {isAdminOrMod && (
                  <a href="/admin" onClick={() => setMenuOpen(false)} style={{fontWeight:600, color:'#1976d2'}}>Admin</a>
                )}
                <a href="/profile" onClick={() => setMenuOpen(false)}>Profile</a>
                <a
                  href="#"
                  onClick={e => {
                    e.preventDefault();
                    setMenuOpen(false);
                    signOut({ callbackUrl: "/login" });
                  }}
                >Logout</a>
              </>
            )}
            {!isLoggedIn && (
              <>
                <a href="/login" onClick={() => setMenuOpen(false)}>Login</a>
                <a href="/register" onClick={() => setMenuOpen(false)}>Registrieren</a>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
