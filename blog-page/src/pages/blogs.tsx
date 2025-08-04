import React, { useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import styles from "./blogs.module.css";

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

export default function BlogsPage() {
  useGlobalFonts();
  const [posts, setPosts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");

  useEffect(() => {
    fetch('/api/published-blocks')
      .then(r => r.json())
      .then(data => {
        setPosts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <>
      <Navbar />
      <main className={styles.blogsPageWrapper}>
        <div className={styles.blogsContainer}>
          <h1 className={styles.blogsTitle}>Blogs</h1>
          <p className={styles.blogsDesc}>
            Hier findest du aktuelle Beiträge, Analysen und News rund um IT-Sicherheit und Malware.
          </p>
          {/* Suchleiste */}
          <div style={{ margin: '18px 0 24px 0', display: 'flex', justifyContent: 'center' }}>
            <input
              type="text"
              placeholder="Beiträge suchen..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: 340,
                padding: '10px 16px',
                borderRadius: 8,
                border: '1.5px solid #b6d4f7',
                fontSize: 16,
                outline: 'none',
                boxShadow: '0 1px 4px rgba(25,118,210,0.07)'
              }}
            />
          </div>
          <div className={styles.blogsListBox}>
            {loading ? (
              <div className={styles.blogsEmpty}>Lade Beiträge...</div>
            ) : posts.length === 0 ? (
              <div className={styles.blogsEmpty}>Noch keine Blog-Beiträge vorhanden.</div>
            ) : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {posts
                  .filter(post => {
                    const q = search.trim().toLowerCase();
                    if (!q) return true;
                    return (
                      (post.title && post.title.toLowerCase().includes(q)) ||
                      (post.description && post.description.toLowerCase().includes(q))
                    );
                  })
                  .map(post => (
                    <li key={post.id} className={styles.blogCard} style={{ background: '#f6fafd', marginBottom: 18, borderRadius: 8, padding: 18, position: 'relative' }}>
                      <a href={`/blogs/${post.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className={styles.blogCardTitle} style={{ fontWeight: 700, fontSize: 20 }}>{post.title || '(Kein Titel)'}</div>
                            <div className={styles.blogCardDesc} style={{ color: '#444', margin: '8px 0 10px 0' }}>{post.description || ''}</div>
                            <span className={styles.blogCardDate} style={{ fontSize: 13, color: '#888' }}>Veröffentlicht am: {post.updatedAt ? new Date(post.updatedAt).toLocaleString() : ''}</span>
                            {typeof post.readingTimeMinutes === 'number' && (
                              <span style={{ fontSize: 13, color: '#1976d2', marginLeft: 12 }}>
                                Lesedauer: {post.readingTimeMinutes} min
                              </span>
                            )}
                            {/* Author-Box mit Icon */}
                            {post.user && (
                              <div style={{
                                marginTop: 12,
                                marginBottom: 2,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                background: 'rgba(230,240,255,0.7)',
                                border: '1.5px solid #b6d4f7',
                                borderRadius: 8,
                                padding: '7px 14px',
                                maxWidth: 240
                              }}>
                                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" style={{marginRight: 4}} xmlns="http://www.w3.org/2000/svg">
                                  <circle cx="10" cy="10" r="9" stroke="#1976d2" strokeWidth="1.5" fill="#e3f0fc" />
                                  <circle cx="10" cy="8" r="3.2" fill="#1976d2" />
                                  <path d="M16.5 16c0-2.5-2.5-4-6.5-4s-6.5 1.5-6.5 4" stroke="#1976d2" strokeWidth="1.2" fill="none" />
                                </svg>
                                <span style={{ color: '#1976d2', fontWeight: 600, fontSize: 14 }}>{post.user.name || post.user.username}</span>
                              </div>
                            )}
                            {/* Co-Author-Box */}
                            {post.coAuthor && (
                              <div style={{
                                marginTop: 10,
                                marginBottom: 2,
                                display: 'block',
                                background: 'linear-gradient(90deg, #e3f0fc 0%, #f6fafd 100%)',
                                border: '1.5px solid #b6d4f7',
                                borderRadius: 8,
                                padding: '8px 16px',
                                boxShadow: '0 2px 8px rgba(25,118,210,0.07)',
                                maxWidth: 240
                              }}>
                                <span style={{ fontWeight: 500, color: '#1976d2', fontSize: 13, marginRight: 6 }}>Co-Author:</span>
                                <span style={{ color: '#1976d2', fontWeight: 600, fontSize: 14 }}>
                                  {post.coAuthor.name ? post.coAuthor.name : post.coAuthor.username}
                                </span>
                                {post.coAuthor.username && post.coAuthor.name && (
                                  <span style={{ color: '#888', fontWeight: 400, fontSize: 13, marginLeft: 4 }}>({post.coAuthor.username})</span>
                                )}
                              </div>
                            )}
                          </div>
                          {/* Like/Comment-Box rechts */}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 54, marginLeft: 18 }}>
                            {/* Like-Icon und Zahl */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 8 }}>
                              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1976d2" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{marginBottom: 2}}>
                                <path d="M6 21h12a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-5.28a1 1 0 0 1-.95-.68l-1.34-4A2 2 0 0 0 8 3H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" />
                              </svg>
                              <span style={{ color: '#1976d2', fontWeight: 600, fontSize: 15 }}>{post.likeCount ?? 0}</span>
                            </div>
                            {/* Kommentar-Icon und Zahl */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1976d2" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{marginBottom: 2}}>
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                              </svg>
                              <span style={{ color: '#1976d2', fontWeight: 600, fontSize: 15 }}>{post.commentCount ?? 0}</span>
                            </div>
                          </div>
                        </div>
                        {/* Kategorie-Label unten und mittig */}
                        {post.category && (
                          <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginTop: 18,
                            marginBottom: 0,
                          }}>
                            <div style={{
                              display: 'inline-block',
                              padding: '3px 16px',
                              borderRadius: 14,
                              background: post.category.color || '#e3f0fc',
                              color: '#fff',
                              fontWeight: 600,
                              fontSize: 14,
                              letterSpacing: 0.2,
                              boxShadow: '0 1px 4px rgba(25,118,210,0.08)'
                            }}>
                              {post.category.name}
                            </div>
                          </div>
                        )}
                      </a>
                    </li>
                  ))}
              </ul>
            )}
          </div>
          <div className={styles.blogsDashboardBtnWrapper}>
            <a href="/dashboard" className={styles.blogsDashboardBtn} title="Blog-Dashboard">
              <span className={styles.blogsDashboardBtnIcon}>
                <svg width="28" height="28" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="19" cy="19" r="18" fill="#1976d2"/>
                  <path d="M19 12v14M12 19h14" stroke="#fff" strokeWidth="3" strokeLinecap="round"/>
                </svg>
              </span>
              <span className={styles.blogsDashboardBtnText}>Dashboard</span>
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
