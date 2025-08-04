
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import Footer from "../components/Footer";
import ClientOnly from "../components/ClientOnly";
import dynamic from "next/dynamic";
import styles from "./create-blog.module.css";

const BlockEditor = dynamic(() => import("../components/blockeditor/BlockEditor"), { ssr: false });

// Typen und Hilfskomponenten außerhalb der Hauptfunktion
type UserType = {
  id: string;
  name?: string;
  username: string;
  role?: string;
};

type CoAuthorAutocompleteProps = {
  onSelect: (user: UserType | null) => void;
  value: UserType | null;
};

function CoAuthorAutocomplete({ onSelect, value }: CoAuthorAutocompleteProps) {
  const [input, setInput] = useState("");
  const [results, setResults] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<UserType | null>(null);
  useEffect(() => {
    if (!value && selected) {
      setSelected(null);
      setInput("");
    } else if (value && (!selected || value.id !== selected.id)) {
      setSelected(value);
      setInput(value.name || "");
    }
  }, [value]);
  useEffect(() => {
    if (input.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    fetch(`/api/search-bloggers?q=${encodeURIComponent(input)}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        setResults(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setResults([]);
        setLoading(false);
      });
  }, [input]);
  return (
    <div>
      <input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="Co-Author suchen..."
        style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #ccc" }}
      />
      {loading && <div style={{ fontSize: 12, color: "#888" }}>Lade...</div>}
      {results.length > 0 && (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, background: "#fff", border: "1px solid #eee", borderRadius: 6, maxHeight: 180, overflowY: "auto" }}>
          {results.map(user => (
            <li
              key={user.id}
              style={{ padding: 8, cursor: "pointer", background: selected?.id === user.id ? "#f0f0f0" : undefined }}
              onClick={() => {
                setSelected(user);
                setInput(user.name || user.username);
                onSelect(user);
                setResults([]);
              }}
            >
              {user.name || user.username}
            </li>
          ))}
        </ul>
      )}
      {selected && (
        <div style={{ fontSize: 12, color: "#1976d2", marginTop: 4 }}>
          Ausgewählt: {selected.name || selected.username}
          <button type="button" style={{ marginLeft: 8, fontSize: 11 }} onClick={() => { setSelected(null); setInput(""); onSelect(null); }}>Entfernen</button>
        </div>
      )}
    </div>
  );
}

function AiLimitModal({ aiLimitError, setShowAiLimitModal }: { aiLimitError: string; setShowAiLimitModal: (b: boolean) => void }) {
  return (
    <div className={styles.aiModal}>
      <div className={`${styles.aiModalContent} ${styles.aiModalErrorContent}`}>
        <div className={styles.aiErrorTitle}>KI-Anfrage nicht möglich</div>
        <div className={styles.aiErrorMessage}>
          {aiLimitError || 'Die KI-Anfrage konnte nicht verarbeitet werden.'}<br />
          Bei Fragen kontaktiere bitte den Support.
        </div>
        <button
          onClick={() => setShowAiLimitModal(false)}
          className={styles.aiErrorButton}
        >
          Schließen
        </button>
      </div>
    </div>
  );
}

// Hauptkomponente
export default function CreateBlogPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const userId = session?.user?.id;

  // States
  const [currentDraftId, setCurrentDraftId] = useState<string | undefined>(undefined);
  const [isDraftIdReady, setIsDraftIdReady] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [coAuthor, setCoAuthor] = useState<UserType | null>(null);
  const [blogStatus, setBlogStatus] = useState<'ENTWURF' | 'VEROEFFENTLICHT' | 'GEPLANT' | 'NICHT_OEFFENTLICH'>('ENTWURF');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [description, setDescription] = useState("");
  const [title, setTitle] = useState("");
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [skipNextTitleSave, setSkipNextTitleSave] = useState(false);
  const [skipNextDescriptionSave, setSkipNextDescriptionSave] = useState(false);
  const [generatingTitle, setGeneratingTitle] = useState(false);
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [showAiLimitModal, setShowAiLimitModal] = useState(false);
  const [aiLimitError, setAiLimitError] = useState("");
  const [showTitlePromptModal, setShowTitlePromptModal] = useState(false);
  const [showDescriptionPromptModal, setShowDescriptionPromptModal] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");

  // Hilfsfunktion: DraftId in URL aktualisieren
  const updateUrl = useCallback(async () => {
    if (!currentDraftId) return;
    if (router.query.id !== currentDraftId) {
      await router.replace({ pathname: router.pathname, query: { ...router.query, id: currentDraftId } }, undefined, { shallow: true });
    }
  }, [currentDraftId, router]);

  // DraftId aus URL holen
  useEffect(() => {
    if (!router.isReady) return;
    const id = typeof router.query.id === "string" ? router.query.id : undefined;
    if (id && id !== currentDraftId) {
      setCurrentDraftId(id);
    }
    setIsDraftIdReady(true);
  }, [router.isReady, router.query.id]);

  // Draft laden und Sperrstatus prüfen
  useEffect(() => {
    if (!userId || !currentDraftId) return;
    const url = `/api/block-draft?id=${encodeURIComponent(currentDraftId)}`;
    (async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        if (data) {
          setCurrentDraftId(data.id?.toString());
          setIsLocked(!!data.locked);
          setTitle(typeof data.title === 'string' ? data.title : "");
          setDescription(typeof data.description === 'string' ? data.description : "");
          let parsedBlocks = [];
          try {
            if (Array.isArray(data.blocks)) parsedBlocks = data.blocks;
            else if (typeof data.blocks === 'string') parsedBlocks = JSON.parse(data.blocks);
          } catch {}
          setBlocks(Array.isArray(parsedBlocks) ? parsedBlocks : []);
          setCoAuthor(data.coAuthor || null);
          if (typeof data.status === 'string') setBlogStatus(data.status);
          if (data.categoryId) setSelectedCategory(String(data.categoryId));
        }
      } catch {}
    })();
  }, [userId, currentDraftId]);

  // Kategorien laden
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/categories");
        let data;
        if (!res.ok) {
          const text = await res.text();
          try { data = JSON.parse(text); } catch { data = []; }
        } else {
          data = await res.json();
        }
        if (!Array.isArray(data)) { setCategories([]); return; }
        setCategories(data);
        if (data.length > 0) setSelectedCategory(data[0].id);
      } catch { setCategories([]); }
    }
    fetchCategories();
  }, []);

  // Draft speichern
  async function saveDraft(partial?: Partial<{title: string, description: string, blocks: any[], coAuthor: UserType | null, status: typeof blogStatus, categoryId: string}>) {
    if (!userId || isLocked) return;
    const hasTitle = (partial?.title !== undefined ? partial.title : title)?.trim();
    const hasDescription = (partial?.description !== undefined ? partial.description : description)?.trim();
    const hasBlocks = Array.isArray(blocks) && blocks.length > 0;
    const hasCoAuthor = partial?.coAuthor !== undefined ? partial.coAuthor : coAuthor;
    const hasCategoryId = partial?.categoryId !== undefined ? partial.categoryId : selectedCategory;
    if (!currentDraftId && !hasTitle && !hasDescription && !hasBlocks && !hasCoAuthor && !hasCategoryId) return;
    let payload: any;
    if (!currentDraftId) {
      if (!hasTitle && !hasDescription && !hasBlocks && !hasCoAuthor && !hasCategoryId) return;
      payload = { userId, status: partial?.status !== undefined ? partial.status : blogStatus, categoryId: hasCategoryId };
      if (hasTitle) payload.title = hasTitle;
      if (hasDescription) payload.description = hasDescription;
      if (hasBlocks) payload.blocks = blocks;
      if (hasCoAuthor && hasCoAuthor.id) payload.coAuthorId = hasCoAuthor.id;
    } else {
      payload = { userId, title: partial?.title !== undefined ? partial.title : title, description: partial?.description !== undefined ? partial.description : description, status: partial?.status !== undefined ? partial.status : blogStatus, categoryId: hasCategoryId, id: currentDraftId };
      if (Array.isArray(blocks)) payload.blocks = blocks;
      if (partial?.coAuthor !== undefined) {
        if (partial.coAuthor && partial.coAuthor.id) payload.coAuthorId = partial.coAuthor.id;
        else payload.coAuthorId = null;
      } else if (coAuthor && coAuthor.id) {
        payload.coAuthorId = coAuthor.id;
      } else {
        payload.coAuthorId = null;
      }
    }
    const res = await fetch('/api/block-draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (!currentDraftId && result.draft && result.draft.id) {
      await handleDraftIdChange(result.draft.id.toString());
    }
    return result;
  }

  // DraftId-Wechsel
  const handleDraftIdChange = useCallback(async (id: string) => {
    setCurrentDraftId(id);
    await updateUrl();
  }, [updateUrl]);

  // Sidebar öffnen
  const handleOpenSidebar = useCallback(() => setSidebarOpen(true), []);

  // KI-Handler
  async function handleGenerateDescription(mode: 'description' | 'title' = 'description', customUserPrompt?: string) {
    if (mode === 'title') setGeneratingTitle(true);
    else setGeneratingDescription(true);
    try {
      const authRes = await fetch('/api/ai-auth');
      const authData = await authRes.json();
      if (!authRes.ok || (authData.includedRequests !== null && authData.includedRequests <= 0)) {
        setShowAiLimitModal(true);
        setAiLimitError(authData?.reason || 'KI-Kontingent aufgebraucht');
        if (mode === 'title') setGeneratingTitle(false);
        else setGeneratingDescription(false);
        return;
      }
      const textBlocks = Array.isArray(blocks)
        ? blocks.filter(block => block.type === 'text' || block.type === 'heading' || block.type === 'quote' || block.type === 'excerpt')
        : [];
      if (textBlocks.length === 0) {
        if (mode === 'title') {
          setTitle('Bitte füge zuerst Textinhalte hinzu');
          setGeneratingTitle(false);
        } else {
          setDescription('Bitte füge zuerst Textinhalte hinzu');
          setGeneratingDescription(false);
        }
        return;
      }
      const res = await fetch('/api/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocks: textBlocks, mode, text: customUserPrompt }),
      });
      const data = await res.json();
      let newTitle = title;
      let newDescription = description;
      if (res.ok && data.result) {
        if (mode === 'title') {
          let cleanTitle = data.result;
          cleanTitle = cleanTitle.replace(/^Titelvorschlag:\s*/, '');
          cleanTitle = cleanTitle.replace(/^\"|'(.*)\"|'$/, '$1');
          newTitle = cleanTitle;
          setTitle(newTitle);
          setSkipNextTitleSave(true);
        } else {
          let cleanDescription = data.result;
          cleanDescription = cleanDescription.replace(/^Beschreibungsvorschlag:\s*/, '');
          cleanDescription = cleanDescription.replace(/^\"|'(.*)\"|'$/, '$1');
          newDescription = cleanDescription;
          setDescription(newDescription);
          setSkipNextDescriptionSave(true);
        }
      } else {
        if (mode === 'title') {
          newTitle = 'Fehler bei der KI-Titelgenerierung';
          setTitle(newTitle);
        } else {
          newDescription = 'Fehler bei der KI-Beschreibung';
          setDescription(newDescription);
        }
      }
      if (userId) {
        await saveDraft({ title: mode === 'title' ? newTitle : undefined, description: mode === 'description' ? newDescription : undefined });
      }
    } catch (err) {
      if (mode === 'title') setTitle('Fehler bei der KI-Anfrage');
      else setDescription('Fehler bei der KI-Anfrage');
    } finally {
      if (mode === 'title') setGeneratingTitle(false);
      else setGeneratingDescription(false);
    }
  }

  async function handleSaveDraft() { await saveDraft(); }

  // Beitrag posten
  async function handlePostBlog(e: React.FormEvent) {
    e.preventDefault();
    if (isLocked) return;
    const result = await saveDraft({ status: "VEROEFFENTLICHT" });
    if (result && result.draft && result.draft.status === "VEROEFFENTLICHT") {
      router.push("/blogs");
    } else {
      alert("Fehler: Der Beitrag konnte nicht veröffentlicht werden.");
    }
  }

  // Zugriffsschutz
  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user || !["BLOGGER", "MODERATOR", "ADMIN"].includes(session.user.role as string)) {
      router.replace("/");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return <div style={{textAlign: 'center', marginTop: 80, fontSize: 18}}>Lade...</div>;
  }
  if (!session?.user || !["BLOGGER", "MODERATOR", "ADMIN"].includes(session.user.role as string)) {
    return null;
  }

  if (isLocked) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0,0,0,0.18)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          background: '#fff',
          borderRadius: 14,
          boxShadow: '0 4px 32px rgba(0,0,0,0.13)',
          padding: '40px 32px 32px 32px',
          minWidth: 340,
          maxWidth: '90vw',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 22, color: '#d32f2f', fontWeight: 700, marginBottom: 18 }}>
            Dieser Beitrag wurde von einem Admin gesperrt und kann nicht bearbeitet werden.
          </div>
          <button
            style={{
              marginTop: 10,
              padding: '10px 32px',
              background: '#1976d2',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 17,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(25,118,210,0.10)'
            }}
            onClick={() => { window.location.href = '/blogs'; }}
          >
            Okay
          </button>
        </div>
      </div>
    );
  }

  // Render
  return (
    <>
      <div style={{ position: 'sticky', top: 0, left: 0, zIndex: 1200, display: 'flex', justifyContent: 'flex-start', background: 'rgba(255,255,255,0.98)', padding: '10px 0 10px 24px', minHeight: 60, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(208,215,230,0.4)' }}>
        <a
          href="/dashboard"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: '#1976d2', fontWeight: 500, textDecoration: 'none', fontSize: 14, background: 'linear-gradient(to right, rgba(25,118,210,0.05), rgba(25,118,210,0.01))', borderRadius: 6, padding: '7px 12px 7px 10px', border: '1px solid rgba(25,118,210,0.15)', boxShadow: '0 1px 4px rgba(25,118,210,0.06)', outline: 'none', cursor: 'pointer', transition: 'all 0.2s ease', minHeight: 0, minWidth: 0 }}
          onMouseOver={e => {
            e.currentTarget.style.background = 'linear-gradient(to right, rgba(25,118,210,0.08), rgba(25,118,210,0.02))';
            e.currentTarget.style.borderColor = 'rgba(25,118,210,0.3)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(25,118,210,0.12)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseOut={e => {
            e.currentTarget.style.background = 'linear-gradient(to right, rgba(25,118,210,0.05), rgba(25,118,210,0.01))';
            e.currentTarget.style.borderColor = 'rgba(25,118,210,0.15)';
            e.currentTarget.style.boxShadow = '0 1px 4px rgba(25,118,210,0.06)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: 3}}>
            <path d="M10.5 13.5L6 9L10.5 4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Zurück zum Dashboard</span>
        </a>
      </div>
      <main className={styles.createBlogWrapper}>
        <div style={{ display: 'flex', gap: 32, position: 'relative' }}>
          <div className={styles.createBlogContainer} style={{ flex: 1 }}>
            <form className={styles.createBlogForm} onSubmit={handlePostBlog}>
              <div style={{ marginBottom: 20 }}>
                <label htmlFor="blog-title" style={{ fontWeight: 500, color: '#444', marginBottom: 8, display: 'block' }}>Titel</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    id="blog-title"
                    type="text"
                    placeholder="Titel des Beitrags..."
                    style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc', fontSize: 18, fontWeight: 600 }}
                    required
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    onBlur={async e => {
                      if (skipNextTitleSave) { setSkipNextTitleSave(false); return; }
                      if (currentDraftId || e.target.value.trim()) { await saveDraft({ title: e.target.value }); }
                    }}
                  />
                  <button
                    type="button"
                    style={{ padding: '8px 14px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 15, cursor: 'pointer', minWidth: 44 }}
                    onClick={() => setShowTitlePromptModal(true)}
                    disabled={generatingTitle}
                    title="Titel automatisch generieren lassen"
                  >
                    {generatingTitle ? '...' : 'KI'}
                  </button>
                </div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>Mit KI automatisch aus dem Inhalt generieren</div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label htmlFor="blog-description" style={{ fontWeight: 500, color: '#444', marginBottom: 8, display: 'block' }}>Beschreibung</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <textarea
                    id="blog-description"
                    placeholder="Kurze Beschreibung oder Einleitung..."
                    style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc', fontSize: 16, minHeight: 60, resize: 'vertical' }}
                    maxLength={300}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    onBlur={async e => {
                      if (skipNextDescriptionSave) { setSkipNextDescriptionSave(false); return; }
                      if (currentDraftId || e.target.value.trim()) { await saveDraft({ description: e.target.value }); }
                    }}
                  />
                  <button
                    type="button"
                    style={{ padding: '8px 14px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 15, cursor: 'pointer', minWidth: 44 }}
                    onClick={() => setShowDescriptionPromptModal(true)}
                    disabled={generatingDescription}
                    title="Beschreibung automatisch generieren lassen"
                  >
                    {generatingDescription ? '...' : 'KI'}
                  </button>
                </div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>Mit KI automatisch aus dem Inhalt generieren</div>
              </div>
              <ClientOnly fallback={<div className={styles.editorLoading}>Lade Editor...</div>}>
                <div className={styles.editorContainer}>
                  <BlockEditor
                    value={blocks}
                    onChange={setBlocks}
                    userId={userId}
                    draftId={currentDraftId}
                    onDraftIdChange={handleDraftIdChange}
                  />
                </div>
              </ClientOnly>
            </form>
          </div>
          {sidebarOpen && (
            <aside className={styles.sidebar} style={{ position: 'fixed', top: '100px', right: 0, zIndex: 200, marginTop: 0, maxHeight: 'calc(100vh - 80px)', overflowY: 'auto', paddingTop: 10 }}>
              <button type="button" onClick={() => setSidebarOpen(false)} className={styles.sidebarCloseBtn}>
                <svg className={styles.sidebarArrow} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="12" fill="none" />
                  <path d="M8 12h8M14 8l4 4-4 4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1976d2', marginBottom: 16 }}>Einstellungen</h2>
              <div>
                <label style={{ fontWeight: 500, color: '#444', marginBottom: 8, display: 'block' }}>Kategorie</label>
                <select
                  style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #ccc' }}
                  value={selectedCategory}
                  onChange={async e => {
                    setSelectedCategory(e.target.value);
                    await saveDraft({ categoryId: e.target.value });
                  }}
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontWeight: 500, color: '#444', marginBottom: 8, display: 'block' }}>Tags</label>
                <input type="text" placeholder="z.B. React, Next.js" style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #ccc' }} />
              </div>
              <div>
                <label style={{ fontWeight: 500, color: '#444', marginBottom: 8, display: 'block' }}>Status</label>
                <select
                  style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #ccc' }}
                  value={blogStatus}
                  onChange={async e => {
                    let val = e.target.value;
                    let mapped: typeof blogStatus = 'ENTWURF';
                    if (val === 'ENTWURF') mapped = 'ENTWURF';
                    else if (val === 'VEROEFFENTLICHT') mapped = 'VEROEFFENTLICHT';
                    else if (val === 'GEPLANT') mapped = 'GEPLANT';
                    else if (val === 'NICHT_OEFFENTLICH') mapped = 'NICHT_OEFFENTLICH';
                    setBlogStatus(mapped);
                    await saveDraft({ status: mapped });
                  }}
                >
                  <option value="ENTWURF">Entwurf</option>
                  <option value="VEROEFFENTLICHT">Veröffentlicht</option>
                  <option value="GEPLANT">Geplant</option>
                  <option value="NICHT_OEFFENTLICH">Nicht öffentlich</option>
                </select>
              </div>
              <div>
                <label style={{ fontWeight: 500, color: '#444', marginBottom: 8, display: 'block' }}>Co-Author</label>
                <CoAuthorAutocomplete
                  onSelect={async user => {
                    setCoAuthor(user);
                    await saveDraft({ coAuthor: user });
                  }}
                  value={coAuthor}
                />
              </div>
              <div>
                <label style={{ fontWeight: 500, color: '#444', marginBottom: 8, display: 'block' }}>Veröffentlichungsdatum</label>
                <input type="date" style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #ccc' }} />
              </div>
              <button type="button" onClick={handleSaveDraft} style={{ padding: '10px 24px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 16, cursor: 'pointer', marginTop: 16 }}>Speichern</button>
              <button type="submit" className={styles.createBlogBtn} style={{ width: '100%', marginTop: 12 }}>
                Beitrag posten
              </button>
            </aside>
          )}
        </div>
        {!sidebarOpen && (
          <button type="button" onClick={handleOpenSidebar} className={styles.sidebarOpenBtn}>
            <svg className={styles.sidebarArrow} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="12" fill="none" />
              <path d="M16 12H8M10 8l-4 4 4 4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
      </main>
      <Footer />
      {showAiLimitModal && <AiLimitModal aiLimitError={aiLimitError} setShowAiLimitModal={setShowAiLimitModal} />}
      {showTitlePromptModal && (
        <div className={styles.aiModal}>
          <div className={styles.aiModalContent}>
            <div className={styles.aiModalTitle}>Titel mit KI generieren</div>
            <div>
              <div className={styles.aiModalLabel}>Wähle eine Option:</div>
              <button
                onClick={async () => {
                  setShowTitlePromptModal(false);
                  await handleGenerateDescription('title');
                }}
                className={styles.aiAutoButton}
              >
                Automatisch aus Textinhalt generieren
              </button>
              <div className={styles.aiModalLabel}>Oder gib ein eigenes Prompt ein:</div>
              <textarea
                value={customPrompt}
                onChange={e => setCustomPrompt(e.target.value)}
                placeholder="z.B. Erstelle einen SEO-optimierten Titel für einen Blog über künstliche Intelligenz..."
                className={styles.aiPromptTextarea}
              />
              <div className={styles.aiButtonContainer}>
                <button
                  onClick={() => {
                    setShowTitlePromptModal(false);
                    setCustomPrompt("");
                  }}
                  className={styles.aiCancelButton}
                >
                  Abbrechen
                </button>
                <button
                  onClick={async () => {
                    if (customPrompt.trim()) {
                      setShowTitlePromptModal(false);
                      await handleGenerateDescription('title', customPrompt);
                      setCustomPrompt("");
                    }
                  }}
                  disabled={!customPrompt.trim()}
                  className={`${styles.aiSubmitButton} ${!customPrompt.trim() ? styles.aiSubmitButtonDisabled : ''}`}
                >
                  Mit eigenem Prompt generieren
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showDescriptionPromptModal && (
        <div className={styles.aiModal}>
          <div className={styles.aiModalContent}>
            <div className={styles.aiModalTitle}>Beschreibung mit KI generieren</div>
            <div>
              <div className={styles.aiModalLabel}>Wähle eine Option:</div>
              <button
                onClick={async () => {
                  setShowDescriptionPromptModal(false);
                  await handleGenerateDescription('description');
                }}
                className={styles.aiAutoButton}
              >
                Automatisch aus Textinhalt generieren
              </button>
              <div className={styles.aiModalLabel}>Oder gib ein eigenes Prompt ein:</div>
              <textarea
                value={customPrompt}
                onChange={e => setCustomPrompt(e.target.value)}
                placeholder="z.B. Erstelle eine kurze, ansprechende Beschreibung für einen Blog über künstliche Intelligenz..."
                className={styles.aiPromptTextarea}
              />
              <div className={styles.aiButtonContainer}>
                <button
                  onClick={() => {
                    setShowDescriptionPromptModal(false);
                    setCustomPrompt("");
                  }}
                  className={styles.aiCancelButton}
                >
                  Abbrechen
                </button>
                <button
                  onClick={async () => {
                    if (customPrompt.trim()) {
                      setShowDescriptionPromptModal(false);
                      await handleGenerateDescription('description', customPrompt);
                      setCustomPrompt("");
                    }
                  }}
                  disabled={!customPrompt.trim()}
                  className={`${styles.aiSubmitButton} ${!customPrompt.trim() ? styles.aiSubmitButtonDisabled : ''}`}
                >
                  Mit eigenem Prompt generieren
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
