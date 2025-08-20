import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import styles from "../blogs.module.css";
import BlockPreview from "../../components/blockeditor/BlockPreview";
import type { Session } from "next-auth";

// Flaggen-Icon als Komponente (YouTube-Stil)
const FlagIcon = ({ size = 20, color = '#888', style = {} }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} style={style} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 4v16" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M4 4h15l-2 5 2 5H4" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
  </svg>
);

export default function BlogDetailPage() {
  // Antwort-Logik
  const [replyTo, setReplyTo] = useState<number|null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const [replyError, setReplyError] = useState("");
  // Like-Logik für Kommentare
  const [commentLikes, setCommentLikes] = useState<{[key:number]: boolean}>({});
  const [commentLikeLoading, setCommentLikeLoading] = useState<{[key:number]: boolean}>({});
  const [commentLikeCounts, setCommentLikeCounts] = useState<{[key:number]: number}>({});
  // Gründe für Melden (wie YouTube)
  const reportReasons = [
    "Spam oder irreführend",
    "Hassrede oder Gewalt",
    "Belästigung oder Mobbing",
    "Sexueller Inhalt",
    "Anderer Grund"
  ];
  
  // Kommentar melden
  const [reportCommentId, setReportCommentId] = useState<number|null>(null);
  const [reportCommentReason, setReportCommentReason] = useState("");
  const [reportCommentLoading, setReportCommentLoading] = useState(false);
  const [reportCommentSuccess, setReportCommentSuccess] = useState("");
  const [reportCommentError, setReportCommentError] = useState("");
  
  // Beitrag melden
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [reportSuccess, setReportSuccess] = useState("");
  const [reportError, setReportError] = useState("");
  
  const router = useRouter();
  const { id } = router.query;
  const { data: session } = useSession() as { data: Session | null };
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<any[]>([]);
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentError, setCommentError] = useState("");
  const [likeLoading, setLikeLoading] = useState(false);
  const [liked, setLiked] = useState(false);

  // Blog-Post laden
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/published-blocks?id=${id}`)
      .then(r => r.json())
      .then(data => {
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          setPost(data);
        } else {
          setPost(null);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Kommentare laden
  useEffect(() => {
    if (!id) return;
    fetch(`/api/block-draft-comments?blockDraftId=${id}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setComments(data);
          // Like-Zähler initialisieren
          const likeCounts: {[key:number]: number} = {};
          data.forEach((c: any) => {
            likeCounts[c.id] = c._count && c._count.likes ? c._count.likes : (Array.isArray(c.likes) ? c.likes.length : 0);
            if (Array.isArray(c.replies)) {
              c.replies.forEach((r: any) => {
                likeCounts[r.id] = r._count && r._count.likes ? r._count.likes : (Array.isArray(r.likes) ? r.likes.length : 0);
              });
            }
          });
          setCommentLikeCounts(likeCounts);
        }
      });
    // Likes aus localStorage laden
    if (typeof window !== 'undefined') {
      const likes: {[key:number]: boolean} = {};
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith('liked_comment_')) {
          const cid = Number(k.replace('liked_comment_', ''));
          if (!isNaN(cid)) likes[cid] = true;
        }
      });
      setCommentLikes(likes);
    }
  }, [id]);

  return (
    <>
      <Navbar />
      <main className={styles.blogsPageWrapper}>
        <div className={styles.blogsContainer}>
          {loading && <div className={styles.blogsEmpty}>Lade Beitrag...</div>}
          {!loading && !post && <div className={styles.blogsEmpty}>Beitrag nicht gefunden.</div>}
          {!loading && post && (
            <>
              <div style={{
                border: '2.5px solid #e3e7ee',
                borderRadius: 18,
                boxShadow: '0 4px 24px rgba(25,118,210,0.07)',
                background: '#fafdff',
                padding: '36px 28px',
                maxWidth: 820,
                margin: '0 auto',
                marginBottom: 32,
                marginTop: 100
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                  <div>
                    <h1 className={styles.blogCardTitle} style={{ fontWeight: 700, fontSize: 28, margin: 0 }}>{post.title || '(Kein Titel)'}</h1>
                    <div className={styles.blogCardDesc} style={{ color: '#444', margin: '12px 0 18px 0', fontSize: 18 }}>{post.description || ''}</div>
                    <div style={{ fontSize: 14, color: '#888', marginBottom: 8 }}>Veröffentlicht am: {post.updatedAt ? new Date(post.updatedAt).toLocaleString() : ''}</div>
                  </div>
                  <button
                    onClick={() => setReportOpen(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      opacity: 0.7,
                      transition: 'opacity 0.2s',
                      marginTop: 8
                    }}
                    title="Beitrag melden"
                    onMouseOver={e => (e.currentTarget.style.opacity = '1')}
                    onMouseOut={e => (e.currentTarget.style.opacity = '0.7')}
                  >
                    <FlagIcon size={22} color="#888" />
                  </button>
                </div>

                {post.coAuthor && (
                  <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={styles.coAuthorBadge}>Co-Author</span>
                    <span style={{ color: '#1976d2', fontWeight: 600, fontSize: 15 }}>
                      {post.coAuthor.name ? post.coAuthor.name : post.coAuthor.username}
                    </span>
                    {post.coAuthor.username && post.coAuthor.name && (
                      <span style={{ color: '#888', fontWeight: 400, fontSize: 13, marginLeft: 4 }}>({post.coAuthor.username})</span>
                    )}
                  </div>
                )}

                {/* Blog-Inhalt (Blocks) */}
                <div style={{ marginTop: 64 }}>
                  <div style={{
                    border: '2.5px solid #e3e7ee',
                    borderRadius: 18,
                    boxShadow: '0 4px 24px rgba(25,118,210,0.07)',
                    background: '#fafdff',
                    padding: '36px 28px',
                    maxWidth: 820,
                    margin: '0 auto',
                    marginBottom: 24
                  }}>
                    {Array.isArray(post.blocks) && post.blocks.length > 0 ? (
                      post.blocks.map((block: any, idx: number) => (
                        <BlockPreview key={idx} block={block} blocks={post.blocks} />
                      ))
                    ) : (
                      <div style={{ color: "#888" }}>Kein Inhalt vorhanden.</div>
                    )}
                  </div>
                </div>

                {/* Like-Zähler und Button */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  marginTop: 36,
                  marginBottom: -12
                }}>
                  <span style={{
                    fontSize: 18,
                    color: liked ? '#388e3c' : '#1976d2',
                    fontWeight: 700,
                    marginRight: 10,
                    transition: 'color 0.2s'
                  }}>{post.likeCount ?? 0}</span>
                  <button
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: liked ? 'not-allowed' : 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'transform 0.1s',
                      opacity: likeLoading ? 0.6 : 1
                    }}
                    title={liked ? "Du hast bereits geliked" : "Beitrag liken"}
                    disabled={liked || likeLoading}
                    onClick={async () => {
                      if (liked || likeLoading) return;
                      setLikeLoading(true);
                      try {
                        const userId = session?.user?.id;
                        if (!userId) {
                          alert("Du musst eingeloggt sein, um zu liken.");
                          setLikeLoading(false);
                          return;
                        }
                        const res = await fetch(`/api/block-draft-like`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ blockDraftId: post.id, userId })
                        });
                        if (res.ok) {
                          setPost((p: any) => ({ ...p, likeCount: (p.likeCount ?? 0) + 1 }));
                          setLiked(true);
                          if (typeof window !== 'undefined') {
                            localStorage.setItem(`liked_blog_${id}`, '1');
                          }
                        }
                      } finally {
                        setLikeLoading(false);
                      }
                    }}
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill={liked ? '#388e3c' : 'none'} stroke={liked ? '#388e3c' : '#1976d2'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 21h12a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-5.28a1 1 0 0 1-.95-.68l-1.34-4A2 2 0 0 0 8 3H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Kommentare (YouTube-Style) */}
              <div style={{ marginTop: 48, maxWidth: 700, marginLeft: 'auto', marginRight: 'auto' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                  <div style={{ fontSize: 18, fontWeight: 600 }}>{comments.length} Kommentare</div>
                  <div style={{ fontSize: 14, color: '#1976d2', cursor: 'pointer', fontWeight: 500 }}>Sortieren</div>
                </div>
                
                {/* Kommentar-Formular */}
                {session?.user?.id ? (
                  <form onSubmit={async e => {
                    e.preventDefault();
                    setCommentError("");
                    if (!commentText.trim()) {
                      setCommentError("Kommentar darf nicht leer sein.");
                      return;
                    }
                    setCommentLoading(true);
                    try {
                      const res = await fetch(`/api/block-draft-comments?blockDraftId=${id}`,
                        {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ content: commentText })
                        });
                      if (res.ok) {
                        const newComment = await res.json();
                        setComments((prev) => [...prev, newComment]);
                        setCommentText("");
                      } else {
                        const err = await res.json();
                        setCommentError(err.error || "Fehler beim Absenden");
                      }
                    } finally {
                      setCommentLoading(false);
                    }
                  }} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 32 }}>
                    {/* Avatar */}
                    {session.user?.image ? (
                      <img src={session.user.image} alt="avatar" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', marginTop: 2 }} />
                    ) : (
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#e3e7ee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginTop: 2 }}>👤</div>
                    )}
                    <div style={{ flex: 1 }}>
                      <textarea
                        value={commentText}
                        onChange={e => setCommentText(e.target.value)}
                        rows={2}
                        style={{ width: '100%', borderRadius: 18, border: '1.5px solid #b6d4f7', padding: 12, fontSize: 15, resize: 'vertical', background: '#fafdff' }}
                        placeholder="Kommentiere öffentlich..."
                        disabled={commentLoading}
                      />
                      {commentError && <div style={{ color: 'red', marginTop: 4 }}>{commentError}</div>}
                      <button type="submit" disabled={commentLoading || !commentText.trim()} style={{
                        marginTop: 8,
                        background: '#1976d2',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 18,
                        padding: '8px 22px',
                        fontWeight: 600,
                        fontSize: 15,
                        float: 'right',
                        cursor: commentLoading ? 'not-allowed' : 'pointer',
                        opacity: commentLoading ? 0.7 : 1
                      }}>Kommentieren</button>
                    </div>
                  </form>
                ) : (
                  <div style={{ color: '#888', marginTop: 8, marginBottom: 32 }}>Nur angemeldete Nutzer können kommentieren.</div>
                )}
                
                {/* Kommentar-Liste */}
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {comments.map((c) => (
                    <li key={c.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 28 }}>
                      {/* Avatar */}
                      {(() => {
                        const img = c.user?.image;
                        if (typeof img === 'string' && /^https?:\/\//.test(img)) {
                          return <img src={img} alt="avatar" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', marginTop: 2 }} />;
                        }
                        return <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#e3e7ee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginTop: 2 }}>👤</div>;
                      })()}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 600, color: '#222', fontSize: 15 }}>{c.user?.name || c.user?.username || 'Unbekannt'}</span>
                          <span style={{ color: '#888', fontWeight: 400, fontSize: 13 }}>{new Date(c.createdAt).toLocaleString()}</span>
                          <button
                            onClick={() => { setReportCommentId(c.id); setReportCommentReason(""); setReportCommentSuccess(""); setReportCommentError(""); }}
                            style={{
                              marginLeft: 'auto',
                              background: 'none',
                              border: 'none',
                              padding: 0,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              opacity: 0.7,
                              transition: 'opacity 0.2s',
                            }}
                            title="Kommentar melden"
                            onMouseOver={e => (e.currentTarget.style.opacity = '1')}
                            onMouseOut={e => (e.currentTarget.style.opacity = '0.7')}
                          >
                            <FlagIcon size={18} color="#888" />
                          </button>
                        </div>
                        <div style={{ margin: '6px 0 8px 0', fontSize: 15, color: '#222' }}>{c.content}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                          <button
                            style={{ background: 'none', border: 'none', color: commentLikes[c.id] ? '#388e3c' : '#888', cursor: commentLikes[c.id] ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', padding: 0, fontSize: 15, opacity: commentLikeLoading[c.id] ? 0.6 : 1 }}
                            title={commentLikes[c.id] ? 'Du hast diesen Kommentar bereits geliked' : 'Gefällt mir'}
                            disabled={commentLikes[c.id] || commentLikeLoading[c.id]}
                            onClick={async () => {
                              if (commentLikes[c.id] || commentLikeLoading[c.id]) return;
                              if (!session?.user?.id) {
                                alert('Du musst eingeloggt sein, um zu liken.');
                                return;
                              }
                              setCommentLikeLoading(l => ({ ...l, [c.id]: true }));
                              try {
                                const res = await fetch('/api/block-draft-comment-like', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ commentId: c.id, userId: session.user.id })
                                });
                                if (res.ok) {
                                  setCommentLikes(l => ({ ...l, [c.id]: true }));
                                  setCommentLikeCounts(cnt => ({ ...cnt, [c.id]: (cnt[c.id] || 0) + 1 }));
                                  if (typeof window !== 'undefined') localStorage.setItem(`liked_comment_${c.id}`, '1');
                                }
                              } finally {
                                setCommentLikeLoading(l => ({ ...l, [c.id]: false }));
                              }
                            }}
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill={commentLikes[c.id] ? '#388e3c' : 'none'} stroke={commentLikes[c.id] ? '#388e3c' : '#888'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 21h12a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-5.28a1 1 0 0 1-.95-.68l-1.34-4A2 2 0 0 0 8 3H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" /></svg>
                            <span style={{ marginLeft: 4, fontSize: 14 }}>{commentLikeCounts[c.id] || 0}</span>
                          </button>
                          <span
                            style={{ color: '#1976d2', fontSize: 14, cursor: 'pointer', fontWeight: 500 }}
                            onClick={() => setReplyTo(c.id)}
                          >Antworten</span>
                        </div>
                        {/* Antwort-Formular */}
                        {replyTo === c.id && session?.user?.id && (
                          <form onSubmit={async e => {
                            e.preventDefault();
                            setReplyError("");
                            if (!replyText.trim()) {
                              setReplyError("Antwort darf nicht leer sein.");
                              return;
                            }
                            setReplyLoading(true);
                            try {
                              const res = await fetch(`/api/block-draft-comments?blockDraftId=${id}`,
                                {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ content: replyText, parentCommentId: c.id })
                                });
                              if (res.ok) {
                                const newReply = await res.json();
                                setComments(prev => prev.map(com => com.id === c.id ? { ...com, replies: [...(com.replies || []), newReply] } : com));
                                setReplyText("");
                                setReplyTo(null);
                              } else {
                                const err = await res.json();
                                setReplyError(err.error || "Fehler beim Absenden");
                              }
                            } finally {
                              setReplyLoading(false);
                            }
                          }} style={{ marginTop: 12, marginBottom: 8 }}>
                            <textarea
                              value={replyText}
                              onChange={e => setReplyText(e.target.value)}
                              rows={2}
                              style={{ width: '100%', borderRadius: 12, border: '1.5px solid #b6d4f7', padding: 10, fontSize: 15, resize: 'vertical', background: '#fafdff' }}
                              placeholder="Antwort verfassen..."
                              disabled={replyLoading}
                            />
                            {replyError && <div style={{ color: 'red', marginTop: 4 }}>{replyError}</div>}
                            <button type="submit" disabled={replyLoading || !replyText.trim()} style={{
                              marginTop: 6,
                              background: '#1976d2',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 12,
                              padding: '6px 18px',
                              fontWeight: 600,
                              fontSize: 14,
                              float: 'right',
                              cursor: replyLoading ? 'not-allowed' : 'pointer',
                              opacity: replyLoading ? 0.7 : 1
                            }}>Antworten</button>
                          </form>
                        )}
                        {/* Antworten anzeigen */}
                        {Array.isArray(c.replies) && c.replies.length > 0 && (
                          <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0 0 24px' }}>
                            {c.replies.map((r: any) => (
                              <li key={r.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 18 }}>
                                {(() => {
                                  const img = r.user?.image;
                                  if (typeof img === 'string' && /^https?:\/\//.test(img)) {
                                    return <img src={img} alt="avatar" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', marginTop: 2 }} />;
                                  }
                                  return <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#e3e7ee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, marginTop: 2 }}>👤</div>;
                                })()}
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontWeight: 600, color: '#222', fontSize: 14 }}>{r.user?.name || r.user?.username || 'Unbekannt'}</span>
                                    <span style={{ color: '#888', fontWeight: 400, fontSize: 12 }}>{new Date(r.createdAt).toLocaleString()}</span>
                                    <button
                                      onClick={() => { setReportCommentId(r.id); setReportCommentReason(""); setReportCommentSuccess(""); setReportCommentError(""); }}
                                      style={{
                                        marginLeft: 'auto',
                                        background: 'none',
                                        border: 'none',
                                        padding: 0,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        opacity: 0.7,
                                        transition: 'opacity 0.2s',
                                      }}
                                      title="Antwort melden"
                                      onMouseOver={e => (e.currentTarget.style.opacity = '1')}
                                      onMouseOut={e => (e.currentTarget.style.opacity = '0.7')}
                                    >
                                      <FlagIcon size={16} color="#888" />
                                    </button>
                                  </div>
                                  <div style={{ margin: '4px 0 6px 0', fontSize: 14, color: '#222' }}>{r.content}</div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />

      {/* Beitrag-Melde-Modal */}
      {reportOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.25)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 4px 24px rgba(0,0,0,0.13)', padding: 32, minWidth: 340, maxWidth: '90vw', position: 'relative' }}>
            <button onClick={() => setReportOpen(false)} style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 22, color: '#888', cursor: 'pointer' }} title="Schließen">×</button>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 18, color: '#e53935' }}>Beitrag melden</h2>
            <div style={{ marginBottom: 12, color: '#444', fontSize: 15 }}>Bitte wähle einen Grund aus:</div>
            <div style={{ marginBottom: 14 }}>
              {reportReasons.map((reason) => (
                <label key={reason} style={{ display: 'flex', alignItems: 'center', marginBottom: 7, fontSize: 15, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="report-reason"
                    value={reason}
                    checked={reportReason === reason || reportReason.startsWith(reason)}
                    onChange={() => setReportReason(reason)}
                    disabled={reportLoading}
                    style={{ marginRight: 8 }}
                  />
                  {reason}
                </label>
              ))}
            </div>
            {reportReason === 'Anderer Grund' || reportReason.startsWith('Anderer Grund') ? (
              <textarea
                value={reportReason.startsWith('Anderer Grund') ? reportReason.replace('Anderer Grund: ', '') : ''}
                onChange={e => setReportReason('Anderer Grund: ' + e.target.value)}
                rows={2}
                style={{ width: '100%', borderRadius: 8, border: '1.5px solid #e57373', padding: 10, fontSize: 15, resize: 'vertical', marginBottom: 10 }}
                placeholder="Bitte beschreibe den Grund..."
                disabled={reportLoading}
              />
            ) : null}
            {reportError && <div style={{ color: '#e53935', marginBottom: 8 }}>{reportError}</div>}
            {reportSuccess && <div style={{ color: '#388e3c', marginBottom: 8 }}>{reportSuccess}</div>}
            <button
              onClick={async () => {
                setReportError("");
                setReportSuccess("");
                let reasonToSend = reportReason;
                if (!reportReason || (reportReason === 'Anderer Grund' || reportReason.startsWith('Anderer Grund')) && !reportReason.replace('Anderer Grund: ', '')) {
                  setReportError("Bitte wähle einen Grund aus oder gib einen an.");
                  return;
                }
                setReportLoading(true);
                try {
                  const res = await fetch('/api/report-block-draft', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ blockDraftId: post.id, reason: reasonToSend })
                  });
                  if (res.ok) {
                    setReportSuccess("Danke, deine Meldung wurde übermittelt.");
                    setReportReason("");
                    setTimeout(() => setReportOpen(false), 1200);
                  } else {
                    const err = await res.json();
                    setReportError(err.error || "Fehler beim Melden");
                  }
                } finally {
                  setReportLoading(false);
                }
              }}
              disabled={reportLoading || !reportReason || (reportReason === 'Anderer Grund' && !reportReason.replace('Anderer Grund: ', ''))}
              style={{ background: '#e53935', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 22px', fontWeight: 600, fontSize: 15, cursor: reportLoading ? 'not-allowed' : 'pointer', opacity: reportLoading ? 0.7 : 1 }}
            >
              Meldung absenden
            </button>
          </div>
        </div>
      )}

      {/* Kommentar-Melde-Modal */}
      {reportCommentId && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.25)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 4px 24px rgba(0,0,0,0.13)', padding: 32, minWidth: 340, maxWidth: '90vw', position: 'relative' }}>
            <button onClick={() => setReportCommentId(null)} style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 22, color: '#888', cursor: 'pointer' }} title="Schließen">×</button>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 18, color: '#e53935' }}>Kommentar melden</h2>
            <div style={{ marginBottom: 12, color: '#444', fontSize: 15 }}>Bitte wähle einen Grund aus:</div>
            <div style={{ marginBottom: 14 }}>
              {reportReasons.map((reason) => (
                <label key={reason} style={{ display: 'flex', alignItems: 'center', marginBottom: 7, fontSize: 15, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="report-comment-reason"
                    value={reason}
                    checked={reportCommentReason === reason || reportCommentReason.startsWith(reason)}
                    onChange={() => setReportCommentReason(reason)}
                    disabled={reportCommentLoading}
                    style={{ marginRight: 8 }}
                  />
                  {reason}
                </label>
              ))}
            </div>
            {reportCommentReason === 'Anderer Grund' || reportCommentReason.startsWith('Anderer Grund') ? (
              <textarea
                value={reportCommentReason.startsWith('Anderer Grund') ? reportCommentReason.replace('Anderer Grund: ', '') : ''}
                onChange={e => setReportCommentReason('Anderer Grund: ' + e.target.value)}
                rows={2}
                style={{ width: '100%', borderRadius: 8, border: '1.5px solid #e57373', padding: 10, fontSize: 15, resize: 'vertical', marginBottom: 10 }}
                placeholder="Bitte beschreibe den Grund..."
                disabled={reportCommentLoading}
              />
            ) : null}
            {reportCommentError && <div style={{ color: '#e53935', marginBottom: 8 }}>{reportCommentError}</div>}
            {reportCommentSuccess && <div style={{ color: '#388e3c', marginBottom: 8 }}>{reportCommentSuccess}</div>}
            <button
              onClick={async () => {
                setReportCommentError("");
                setReportCommentSuccess("");
                let reasonToSend = reportCommentReason;
                if (!reportCommentReason || (reportCommentReason === 'Anderer Grund' || reportCommentReason.startsWith('Anderer Grund')) && !reportCommentReason.replace('Anderer Grund: ', '')) {
                  setReportCommentError("Bitte wähle einen Grund aus oder gib einen an.");
                  return;
                }
                setReportCommentLoading(true);
                try {
                  const res = await fetch('/api/report-block-draft-comment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ commentId: reportCommentId, reason: reasonToSend })
                  });
                  if (res.ok) {
                    setReportCommentSuccess("Danke, deine Meldung wurde übermittelt.");
                    setReportCommentReason("");
                    setTimeout(() => setReportCommentId(null), 1200);
                  } else {
                    const err = await res.json();
                    setReportCommentError(err.error || "Fehler beim Melden");
                  }
                } finally {
                  setReportCommentLoading(false);
                }
              }}
              disabled={reportCommentLoading || !reportCommentReason || (reportCommentReason === 'Anderer Grund' && !reportCommentReason.replace('Anderer Grund: ', ''))}
              style={{ background: '#e53935', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 22px', fontWeight: 600, fontSize: 15, cursor: reportCommentLoading ? 'not-allowed' : 'pointer', opacity: reportCommentLoading ? 0.7 : 1 }}
            >
              Meldung absenden
            </button>
          </div>
        </div>
      )}
    </>
  );
}
