import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import styles from './adminBlogList.module.css';
import BlockPreview from '../components/blockeditor/BlockPreview';

export default function AdminBlogList() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [modalRoot, setModalRoot] = useState<HTMLElement | null>(null);

  // Sperr-Status für den aktuellen Post (falls vorhanden)
  const isLocked = selectedPost && selectedPost.locked;

  /**
   * Artikel entsperren
   */
  const handleUnlockPost = async () => {
    if (!selectedPost) return;
    setActionLoading(true);
    setModalAction('unlock');
    setActionError(null);
    try {
      const res = await fetch('/api/block-draft', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedPost.id, lock: false })
      });
      if (!res.ok) throw new Error('Fehler beim Entsperren');
      setModalOpen(false);
      setPosts(posts => posts.map(p => p.id === selectedPost.id ? { ...p, locked: false } : p));
    } catch (e) {
      setActionError('Fehler beim Entsperren!');
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Artikel sperren
   */
  const handleLockPost = async () => {
    if (!selectedPost) return;
    setActionLoading(true);
    setModalAction('lock');
    setActionError(null);
    try {
      const res = await fetch('/api/block-draft', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedPost.id, lock: true })
      });
      if (!res.ok) throw new Error('Fehler beim Sperren');
      setModalOpen(false);
      setPosts(posts => posts.map(p => p.id === selectedPost.id ? { ...p, locked: true } : p));
    } catch (e) {
      setActionError('Fehler beim Sperren!');
    } finally {
      setActionLoading(false);
    }
  };
  
  // Nach dem Mounten des Komponenten, finde oder erstelle modalRoot Element
  useEffect(() => {
    let modalRootElement = document.getElementById('blog-modal-root');
    if (!modalRootElement) {
      modalRootElement = document.createElement('div');
      modalRootElement.id = 'blog-modal-root';
      document.body.appendChild(modalRootElement);
    }
    setModalRoot(modalRootElement);
    
    return () => {
      if (modalRootElement && document.body.contains(modalRootElement)) {
        document.body.removeChild(modalRootElement);
      }
    };
  }, []);
  
  // Beim Öffnen des Modals Body-Scrolling verhindern
  useEffect(() => {
    if (modalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [modalOpen]);

  // Blog-Beiträge laden
  useEffect(() => {
    fetch("/api/admin/blogs")
      .then(r => r.json())
      .then(data => {
        setPosts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setError("Fehler beim Laden der Blog-Beiträge.");
        setLoading(false);
      });
  }, []);

  // Filtern der Beiträge basierend auf der Suche
  const filteredPosts = posts.filter(post => {
    const q = search.toLowerCase();
    return (
      (post.title || "").toLowerCase().includes(q) ||
      (post.status || "").toLowerCase().includes(q) ||
      (post.user?.name || "").toLowerCase().includes(q) ||
      (post.user?.username || "").toLowerCase().includes(q) ||
      String(post.id).includes(q)
    );
  });

  /**
   * Status eines Beitrags ändern
   */
  const handleStatusChange = async () => {
    if (!selectedPost) return;
    
    setActionLoading(true);
    setModalAction('status');
    setActionError(null);
    
    try {
      const res = await fetch('/api/block-draft', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedPost.id, status: selectedPost.status })
      });
      
      if (!res.ok) throw new Error('Fehler beim Speichern');
      
      setModalOpen(false);
      setPosts(posts => posts.map(p => 
        p.id === selectedPost.id ? { ...p, status: selectedPost.status } : p
      ));
    } catch (e) {
      setActionError('Fehler beim Speichern!');
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Beitrag löschen
   */
  const handleDeletePost = async () => {
    if (!selectedPost) return;
    setActionLoading(true);
    setModalAction('delete');
    setActionError(null);
    try {
      const res = await fetch('/api/block-draft', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedPost.id })
      });
      if (!res.ok) throw new Error('Fehler beim Löschen');
      setModalOpen(false);
      setShowDeleteConfirm(false);
      setPosts(posts => posts.map(p => p.id === selectedPost.id ? { ...p, deleteAt: new Date().toISOString() } : p));
    } catch (e) {
      setActionError('Fehler beim Löschen!');
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Gelöschten Beitrag wiederherstellen
   */
  const handleRestorePost = async () => {
    if (!selectedPost) return;
    
    setActionLoading(true);
    setModalAction('restore');
    setActionError(null);
    
    try {
      const res = await fetch('/api/block-draft', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedPost.id, restore: true })
      });
      
      if (!res.ok) throw new Error('Fehler beim Wiederherstellen');
      
      setModalOpen(false);
      setPosts(posts => posts.map(p => 
        p.id === selectedPost.id ? { ...p, deleteAt: null } : p
      ));
    } catch (e) {
      setActionError('Fehler beim Wiederherstellen!');
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Beitrag veröffentlichen
   */
  const handlePublishPost = async () => {
    if (!selectedPost) return;
    
    setActionLoading(true);
    setModalAction('publish');
    setActionError(null);
    
    try {
      const res = await fetch('/api/block-draft', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedPost.id, status: 'VEROEFFENTLICHT' })
      });
      
      if (!res.ok) throw new Error('Fehler beim Freigeben');
      
      setModalOpen(false);
      setPosts(posts => posts.map(p => 
        p.id === selectedPost.id ? { ...p, status: 'VEROEFFENTLICHT' } : p
      ));
    } catch (e) {
      setActionError('Fehler beim Freigeben!');
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Render-Funktion für Blog-Inhaltsblöcke
   */
  const renderContentBlock = (block: any, idx: number) => {
    if (block.data && typeof block.data === 'string' && /<.+?>/.test(block.data)) {
      // HTML-Block - sicher anzeigen
      return (
        <div 
          key={idx} 
          dangerouslySetInnerHTML={{ __html: block.data }} 
          className={styles.contentBlock}
        />
      );
    } else if (block.data && typeof block.data === 'string') {
      // Textblock
      return <div key={idx} className={styles.contentBlock}>{block.data}</div>;
    } else {
      // Fallback: JSON anzeigen
      return (
        <pre 
          key={idx} 
          className={styles.contentBlock}
          style={{ overflowX: 'auto', whiteSpace: 'pre-wrap' }}
        >
          {JSON.stringify(block, null, 2)}
        </pre>
      );
    }
  };

  /**
   * Status als lesbare Text-Form anzeigen
   */
  const displayStatus = (post: any) => {
    if (post.deleteAt) return 'Gelöscht';
    if (post.locked) return 'Gesperrt';
    switch (post.status) {
      case 'VEROEFFENTLICHT': return 'Veröffentlicht';
      case 'ENTWURF': return 'Entwurf';
      case 'GEPLANT': return 'Geplant';
      case 'NICHT_OEFFENTLICH': return 'Nicht öffentlich';
      default: return post.status;
    }
  };

  return (
    <>
      <div className={styles.container}>
        {/* Suchfeld */}
        <div className={styles.searchContainer}>
          <div className={styles.searchWrapper}>
            <input
              type="text"
              placeholder="Suchen nach Titel, Autor, Status, ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={styles.searchInput}
            />
            <svg className={styles.searchIcon} width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="9" r="7"/>
              <line x1="16" y1="16" x2="13.5" y2="13.5"/>
            </svg>
          </div>
        </div>

        {/* Blog-Tabelle */}
        <div>
          {loading ? (
            <div>Lade Beiträge...</div>
          ) : error ? (
            <div style={{ color: "#d32f2f" }}>{error}</div>
          ) : filteredPosts.length === 0 ? (
            <div>Keine Blog-Beiträge gefunden.</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr className={styles.tableHeader}>
                  <th className={styles.tableHeaderCell}>ID</th>
                  <th className={styles.tableHeaderCell}>Titel</th>
                  <th className={styles.tableHeaderCell}>Status</th>
                  <th className={styles.tableHeaderCell}>Autor</th>
                  <th className={styles.tableHeaderCell}>Geändert am</th>
                  <th className={styles.tableHeaderCell}>Lesedauer</th>
                  <th className={styles.tableHeaderCell}>Gelöscht</th>
                  <th className={styles.tableHeaderCellLast}></th>
                </tr>
              </thead>
              <tbody>
                {filteredPosts.map(post => (
                  <tr
                    key={post.id}
                    className={styles.tableRow}
                    onMouseOver={e => (e.currentTarget.style.background = '#f3f8fd')}
                    onMouseOut={e => (e.currentTarget.style.background = '')}
                  >
                    <td className={styles.tableCellCenter}>{post.id}</td>
                    <td className={styles.tableCell}>
                      <a 
                        href={`/create-blog?id=${post.id}`} 
                        className={styles.titleLink} 
                        title="Beitrag bearbeiten"
                      >
                        {post.title || "(Kein Titel)"}
                      </a>
                    </td>
                    <td className={styles.tableCellCenter}>{displayStatus(post)}</td>
                    <td className={styles.tableCell}>
                      {post.user?.name || post.user?.username || post.userId}
                    </td>
                    <td className={styles.tableCellCenter}>
                      {post.updatedAt ? new Date(post.updatedAt).toLocaleString() : ""}
                    </td>
                    <td className={styles.tableCellCenter}>{post.readingTimeMinutes ? `${post.readingTimeMinutes} min` : '-'}</td>
                    <td className={styles.tableCellCenter}>
                      {post.deleteAt ? new Date(post.deleteAt).toLocaleString() : "-"}
                    </td>
                    <td className={styles.tableCellCenter}>
                      <button
                        className={styles.previewButton}
                        title="Beitrag anzeigen und verwalten"
                        onClick={() => { 
                          setSelectedPost(post); 
                          setModalOpen(true); 
                          setModalAction(null); 
                          setActionError(null); 
                        }}
                      >
                        Vorschau
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal für Vorschau und Admin-Aktionen außerhalb des Containers */}
      {modalOpen && (
        <style jsx global>{`
          body {
            overflow: hidden;
          }
        `}</style>
      )}
      {modalOpen && selectedPost && modalRoot && ReactDOM.createPortal(
        <div 
          className={styles.modalOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setModalOpen(false);
            }
          }}
        >
          <div 
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Schließen-Button */}
            <button 
              onClick={() => setModalOpen(false)} 
              className={styles.closeButton}
              title="Schließen"
            >
              ×
            </button>

            {/* Titel und Status */}
            <h2 className={styles.postTitle}>
              {selectedPost.title || '(Kein Titel)'}
            </h2>
            <div style={{marginBottom: 8, color: '#1976d2', fontWeight: 500}}>
              Geschätzte Lesedauer: {selectedPost.readingTimeMinutes ? `${selectedPost.readingTimeMinutes} min` : '-'}
            </div>
            <div className={styles.statusText}>
              Status: {displayStatus(selectedPost)}
            </div>

            {/* Status ändern (nur wenn nicht gelöscht) */}
            {!selectedPost.deleteAt && (
              <div className={styles.statusChangeContainer}>
                <div className={styles.statusChangeRow}>
                  <label htmlFor="status-select" className={styles.statusLabel}>
                    Status ändern:
                  </label>
                  <select
                    id="status-select"
                    value={selectedPost.status}
                    onChange={e => setSelectedPost((p: any) => ({ ...p, status: e.target.value }))}
                    className={styles.statusSelect}
                    disabled={actionLoading}
                  >
                    <option value="ENTWURF">Entwurf</option>
                    <option value="GEPLANT">Geplant</option>
                    <option value="NICHT_OEFFENTLICH">Nicht öffentlich</option>
                    <option value="VEROEFFENTLICHT">Veröffentlicht</option>
                  </select>
                  <button
                    className={styles.primaryButton}
                    disabled={actionLoading}
                    onClick={handleStatusChange}
                  >
                    Speichern
                  </button>
                </div>
              </div>
            )}

            {/* Autor-Information */}
            <div className={styles.authorText}>
              <b>Autor:</b> {selectedPost.user?.name || selectedPost.user?.username || selectedPost.userId}
            </div>

            {/* Beschreibung (wenn vorhanden) */}
            {selectedPost.description && (
              <div className={styles.descriptionText}>
                <b>Beschreibung:</b> {selectedPost.description}
              </div>
            )}

            {/* Blog-Inhalt */}
            <div className={styles.contentContainer}>
              <b>Inhalt:</b>
              <div className={styles.contentPreview}>
                {Array.isArray(selectedPost.blocks) && selectedPost.blocks.length > 0 ? (
                  selectedPost.blocks.map((block: any, idx: number) => (
                    <BlockPreview key={idx} block={block} blocks={selectedPost.blocks} />
                  ))
                ) : (
                  <span style={{ color: '#888' }}>Kein Inhalt vorhanden.</span>
                )}
              </div>
            </div>

            {/* Fehlermeldung anzeigen */}
            {actionError && (
              <div className={styles.errorMessage}>
                {actionError}
              </div>
            )}

            {/* Aktions-Buttons */}
            <div className={styles.buttonContainer}>
              {/* Sperren/Entsperren-Button (nur wenn nicht gelöscht) */}
              {!selectedPost.deleteAt && !isLocked && (
                <button
                  className={styles.dangerButton}
                  disabled={actionLoading}
                  onClick={handleLockPost}
                >
                  Sperren
                </button>
              )}
              {!selectedPost.deleteAt && isLocked && (
                <button
                  className={styles.primaryButton}
                  disabled={actionLoading}
                  onClick={handleUnlockPost}
                >
                  Entsperren
                </button>
              )}

              {/* Löschen-Button (nur wenn nicht gelöscht) */}
              {!selectedPost.deleteAt && (
                <>
                  <button
                    className={styles.dangerButton}
                    disabled={actionLoading}
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    Löschen
                  </button>
                  {showDeleteConfirm && (
                    <div style={{
                      position: 'fixed',
                      left: 0,
                      top: 0,
                      width: '100vw',
                      height: '100vh',
                      background: 'rgba(0,0,0,0.35)',
                      zIndex: 11000,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <div style={{ background: '#fff', borderRadius: 10, padding: 32, minWidth: 320, boxShadow: '0 4px 24px rgba(0,0,0,0.18)' }}>
                        <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 18 }}>Beitrag wirklich löschen?</div>
                        <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end' }}>
                          <button
                            className={styles.primaryButton}
                            disabled={actionLoading}
                            onClick={() => setShowDeleteConfirm(false)}
                          >Abbrechen</button>
                          <button
                            className={styles.dangerButton}
                            disabled={actionLoading}
                            onClick={handleDeletePost}
                          >Ja, löschen</button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Wiederherstellen-Button (nur wenn gelöscht) */}
              {selectedPost.deleteAt && (
                <button
                  className={styles.primaryButton}
                  disabled={actionLoading}
                  onClick={handleRestorePost}
                >
                  Wiederherstellen
                </button>
              )}

              {/* Freigeben-Button (nur wenn nicht veröffentlicht und nicht gelöscht) */}
              {selectedPost.status !== 'VEROEFFENTLICHT' && !selectedPost.deleteAt && (
                <button
                  className={styles.successButton}
                  disabled={actionLoading}
                  onClick={handlePublishPost}
                >
                  Freigeben
                </button>
              )}
            </div>
          </div>
        </div>,
        modalRoot
      )}
    </>
  );
}
