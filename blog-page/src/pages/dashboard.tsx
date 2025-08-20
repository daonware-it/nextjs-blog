import React, { useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import styles from "./dashboard.module.css";
import { useSession } from "next-auth/react";
import type { Session } from "next-auth";

// Google Fonts wie auf anderen Seiten laden
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

export default function DashboardPage() {
  useGlobalFonts();
  const { data: session } = useSession() as { data: Session | null };
  const router = useRouter();
  const [drafts, setDrafts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [draftToDelete, setDraftToDelete] = React.useState<any | null>(null);

  // Zugriffsschutz: Nur eingeloggte Nutzer mit Rolle BLOGGER, MODERATOR oder ADMIN
  useEffect(() => {
    if (session === null) return;
    if (!["BLOGGER", "MODERATOR", "ADMIN"].includes(session.user.role as string)) {
      router.replace("/");
    }
  }, [session, router]);

  React.useEffect(() => {
    if (session?.user?.email) {
      fetch("/api/profile-plan"); // Nur zum Triggern, keine Auswertung nötig
      fetch("/api/block-drafts")
        .then(r => r.json())
        .then(data => {
          setDrafts(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [session?.user?.email]);

  React.useEffect(() => {
    if (session?.user?.id) {
      // Sicherstellen, dass ein UserSubscription-Eintrag existiert
      fetch("/api/ensure-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session.user.id })
      });
    }
  }, [session?.user?.id]);

  // Aktive und gelöschte Entwürfe trennen
  // Auch "NICHT_OEFFENTLICH" wie Entwurf behandeln
  const filteredDrafts = drafts.filter(d => (d.status === 'ENTWURF' || d.status === 'NICHT_OEFFENTLICH') && !d.deleteAt);
  const deletedDrafts = drafts.filter(d => (d.status === 'ENTWURF' || d.status === 'NICHT_OEFFENTLICH') && d.deleteAt);

  // Veröffentlicht: separat laden (nur Anzahl, nur für Admin)
  // Veröffentlicht: eigene Beiträge laden
  const [publishedPosts, setPublishedPosts] = React.useState<any[]>([]);
  React.useEffect(() => {
    if (session?.user?.id) {
      fetch('/api/published-blocks')
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) {
            const own = data.filter((p) => p.userId === Number(session.user.id));
            setPublishedPosts(own);
          } else {
            setPublishedPosts([]);
          }
        });
    }
  }, [session?.user?.id]);

  // Zeige Ladezustand während die Session geprüft wird
  if (session === null) {
    return (
      <>
        <Head>
          <title>Blog-Dashboard | Daonware</title>
        </Head>
        <Navbar />
        <main className={styles.dashboardWrapper}>
          <div className={styles.dashboardContainer}>
            <div style={{textAlign: 'center', marginTop: 80, fontSize: 18}}>Lade...</div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Zugriff verweigern, wenn der Benutzer keine der erforderlichen Rollen hat
  if (!["BLOGGER", "MODERATOR", "ADMIN"].includes(session.user.role as string)) {
    return null; // Nichts rendern, da wir bereits zur Startseite weiterleiten
  }

  return (
    <>
      <Head>
        <title>Blog-Dashboard | Daonware</title>
      </Head>
      <Navbar />
      <main className={styles.dashboardWrapper}>
        <div className={styles.dashboardContainer}>
          <div style={{ textAlign: 'right', marginBottom: 16 }}>
            <a href="/blogs" className={styles.dashboardBackBtn}>Zurück zu den Blogs</a>
          </div>
          <h1 className={styles.dashboardTitle}>Blog-Dashboard</h1>
          {/* Statistik-Box */}
          <div style={{
            display: 'flex',
            gap: 24,
            justifyContent: 'center',
            margin: '24px 0 32px 0',
            flexWrap: 'wrap',
          }}>
            <div style={{
              background: '#f8fbff',
              border: '1.5px solid #bcd0ee',
              borderRadius: 14,
              padding: '18px 32px',
              minWidth: 180,
              textAlign: 'center',
              boxShadow: '0 1px 6px rgba(25,118,210,0.06)',
            }}>
              <div style={{ fontSize: 15, color: '#1976d2', fontWeight: 600, marginBottom: 6 }}>Entwürfe</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{filteredDrafts.length}</div>
            </div>
            <div style={{
              background: '#f8fbff',
              border: '1.5px solid #bcd0ee',
              borderRadius: 14,
              padding: '18px 32px',
              minWidth: 180,
              textAlign: 'center',
              boxShadow: '0 1px 6px rgba(25,118,210,0.06)',
            }}>
              <div style={{ fontSize: 15, color: '#1976d2', fontWeight: 600, marginBottom: 6 }}>Veröffentlicht</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{publishedPosts.length}</div>
            </div>
            <div style={{
              background: '#f8fbff',
              border: '1.5px solid #bcd0ee',
              borderRadius: 14,
              padding: '18px 32px',
              minWidth: 180,
              textAlign: 'center',
              boxShadow: '0 1px 6px rgba(25,118,210,0.06)',
            }}>
              <div style={{ fontSize: 15, color: '#1976d2', fontWeight: 600, marginBottom: 6 }}>Gelöscht</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{deletedDrafts.length}</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '32px 0 24px 0' }}>
            <button
              type="button"
              onClick={async () => {
                // Neuen Draft per API anlegen und weiterleiten
                const res = await fetch("/api/block-draft", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({})
                });
                const data = await res.json();
                if (data?.draft?.id) {
                  window.location.href = `/create-blog?id=${data.draft.id}`;
                }
              }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8, cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
              title="Neuen Blog-Beitrag erstellen"
            >
              <svg width="48" height="48" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="19" cy="19" r="18" fill="#1976d2"/>
                <path d="M19 12v14M12 19h14" stroke="#fff" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
          <div className={styles.dashboardBox}>
            {loading ? (
              <div className={styles.dashboardEmpty}>Lade Entwürfe...</div>
            ) : filteredDrafts.length === 0 ? (
              <div className={styles.dashboardEmpty}>Noch keine Entwürfe vorhanden.</div>
            ) : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {filteredDrafts.map(draft => (
                  <li key={draft.id} className={styles.draftCard} style={{ cursor: draft.locked ? 'not-allowed' : 'pointer', position: 'relative', opacity: draft.locked ? 0.6 : 1 }}>
                    {draft.locked ? (
                      <div style={{ textDecoration: 'none', color: '#888', display: 'block', pointerEvents: 'none' }} title="Gesperrt - Bearbeitung nicht möglich">
                        <div className={styles.draftCardTitle}>{draft.title || '(Kein Titel)'}</div>
                        <div className={styles.draftCardDesc}>{draft.description || ''}</div>
                        <span className={styles.draftCardStatus} style={{ background: '#d32f2f', color: '#fff', fontWeight: 700 }}>Gesperrt</span>
                        <span className={styles.draftCardDate}>Zuletzt geändert: {draft.updatedAt ? new Date(draft.updatedAt).toLocaleString() : ''}</span>
                        {draft.coAuthor && (
                          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className={styles.coAuthorBadge}>Co-Author</span>
                            <span style={{ color: '#1976d2', fontWeight: 600, fontSize: 14 }}>
                              {draft.coAuthor.name ? draft.coAuthor.name : draft.coAuthor.username}
                            </span>
                            {draft.coAuthor.username && draft.coAuthor.name && (
                              <span style={{ color: '#888', fontWeight: 400, fontSize: 13, marginLeft: 4 }}>({draft.coAuthor.username})</span>
                            )}
                          </div>
                        )}
                        <div style={{ marginTop: 10, color: '#d32f2f', fontWeight: 600, fontSize: 15 }}>Dieser Beitrag wurde von einem Admin gesperrt und kann nicht bearbeitet werden.</div>
                      </div>
                    ) : (
                      <a href={`/create-blog?id=${draft.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }} title="Entwurf bearbeiten">
                        <div className={styles.draftCardTitle}>{draft.title || '(Kein Titel)'}</div>
                        <div className={styles.draftCardDesc}>{draft.description || ''}</div>
                        <span className={styles.draftCardStatus}>{draft.status === 'NICHT_OEFFENTLICH' ? 'Nicht öffentlich' : 'Entwurf'}</span>
                        <span className={styles.draftCardDate}>Zuletzt geändert: {draft.updatedAt ? new Date(draft.updatedAt).toLocaleString() : ''}</span>
                        {draft.coAuthor && (
                          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className={styles.coAuthorBadge}>Co-Author</span>
                            <span style={{ color: '#1976d2', fontWeight: 600, fontSize: 14 }}>
                              {draft.coAuthor.name ? draft.coAuthor.name : draft.coAuthor.username}
                            </span>
                            {draft.coAuthor.username && draft.coAuthor.name && (
                              <span style={{ color: '#888', fontWeight: 400, fontSize: 13, marginLeft: 4 }}>({draft.coAuthor.username})</span>
                            )}
                          </div>
                        )}
                      </a>
                    )}
                    {/* Soft Delete Button nur wenn nicht gesperrt */}
                    {!draft.locked && (
                      <button
                        onClick={e => {
                          e.preventDefault();
                          setDraftToDelete(draft);
                        }}
                        style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', color: '#d32f2f', fontSize: 20, cursor: 'pointer' }}
                        title="Entwurf löschen"
                      >🗑️</button>
                    )}
      {/* Modal für Löschen-Bestätigung */}
      {draftToDelete && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.35)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{ background: '#fff', borderRadius: 8, padding: 32, minWidth: 320, boxShadow: '0 2px 16px rgba(0,0,0,0.15)', textAlign: 'center', position: 'relative' }}>
            <h3 style={{ marginBottom: 16 }}>Entwurf löschen?</h3>
            <div style={{ marginBottom: 20 }}>
              Möchtest du den Entwurf <b>{draftToDelete.title || '(Kein Titel)'}</b> wirklich löschen?
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
              <button
                onClick={async () => {
                  await fetch(`/api/block-draft`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: draftToDelete.id })
                  });
                  setDraftToDelete(null);
                  setLoading(true);
                  fetch('/api/block-drafts')
                    .then(r => r.json())
                    .then(data => {
                      setDrafts(Array.isArray(data) ? data : []);
                      setLoading(false);
                    })
                    .catch(() => setLoading(false));
                }}
                style={{ background: '#d32f2f', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 20px', fontWeight: 600, cursor: 'pointer' }}
              >Löschen</button>
              <button
                onClick={() => setDraftToDelete(null)}
                style={{ background: '#eee', color: '#222', border: 'none', borderRadius: 4, padding: '8px 20px', fontWeight: 600, cursor: 'pointer' }}
              >Abbrechen</button>
            </div>
          </div>
        </div>
      )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Veröffentlichte Beiträge */}
          {/* Veröffentlichte Beiträge: Nur Statistik, keine Liste */}
          <div className={styles.dashboardBox} style={{ marginTop: 32 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>Veröffentlichte Beiträge ({publishedPosts.length})</h2>
            {publishedPosts.length === 0 ? (
              <div className={styles.dashboardEmpty}>Noch keine veröffentlichten Beiträge.</div>
            ) : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {publishedPosts.map(post => (
                  <li key={post.id} className={styles.draftCard} style={{ position: 'relative' }}>
                    <a href={`/create-blog?id=${post.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }} title="Beitrag anzeigen oder bearbeiten">
                      <div className={styles.draftCardTitle}>{post.title || '(Kein Titel)'}</div>
                      <div className={styles.draftCardDesc}>{post.description || ''}</div>
                      <span className={styles.draftCardStatus} style={{ background: '#1976d2', color: '#fff', fontWeight: 700 }}>Veröffentlicht</span>
                      <span className={styles.draftCardDate}>Zuletzt geändert: {post.updatedAt ? new Date(post.updatedAt).toLocaleString() : ''}</span>
                      {post.coAuthor && (
                        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className={styles.coAuthorBadge}>Co-Author</span>
                          <span style={{ color: '#1976d2', fontWeight: 600, fontSize: 14 }}>
                            {post.coAuthor.name ? post.coAuthor.name : post.coAuthor.username}
                          </span>
                          {post.coAuthor.username && post.coAuthor.name && (
                            <span style={{ color: '#888', fontWeight: 400, fontSize: 13, marginLeft: 4 }}>({post.coAuthor.username})</span>
                          )}
                        </div>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Gelöschte Entwürfe anzeigen und wiederherstellen */}
          {deletedDrafts.length > 0 && (
            <div className={styles.dashboardBox} style={{ marginTop: 32 }}>
              <h2 style={{ fontSize: 20, marginBottom: 12 }}>Gelöschte Entwürfe ({deletedDrafts.length})</h2>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {deletedDrafts.map(draft => (
                  <li key={draft.id} className={styles.draftCard} style={{ opacity: 0.6, position: 'relative' }}>
                    <div>
                      <div className={styles.draftCardTitle}>{draft.title || '(Kein Titel)'}</div>
                      <div className={styles.draftCardDesc}>{draft.description || ''}</div>
                      <span className={styles.draftCardStatus}>Gelöscht</span>
                      <span className={styles.draftCardDate}>Gelöscht am: {draft.deleteAt ? new Date(draft.deleteAt).toLocaleString() : ''}</span>
                    </div>
                    {/* Wiederherstellen Button */}
                    <button
                      onClick={async () => {
                        await fetch(`/api/block-draft`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ id: draft.id, restore: true })
                        });
                        // Drafts neu laden
                        setLoading(true);
                        fetch('/api/block-drafts')
                          .then(r => r.json())
                          .then(data => {
                            setDrafts(Array.isArray(data) ? data : []);
                            setLoading(false);
                          })
                          .catch(() => setLoading(false));
                      }}
                      style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', color: '#1976d2', fontSize: 20, cursor: 'pointer' }}
                      title="Entwurf wiederherstellen"
                    >↩️</button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
