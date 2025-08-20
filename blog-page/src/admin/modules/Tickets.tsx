"use client";
// ...existing code...
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import styles from '../admin.module.css';

interface TicketStats {
  isLoading: boolean;
  openTickets: number;
  inProgressTickets?: number;
  closedTickets?: number;
}

interface TicketsProps {
  ticketStats: TicketStats;
}

interface BlockReport {
  id: number;
  blockDraftId: number;
  reason: string;
  createdAt: string;
  blockDraft?: { id: number; title: string };
}
interface CommentReport {
  id: number;
  commentId: number;
  reason: string;
  createdAt: string;
  comment?: { id: number; content: string; blockDraftId: number };
}

const Tickets: React.FC<TicketsProps> = ({ ticketStats }) => {
  // State für Kommentar-Löschung
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [selectedReport, setSelectedReport] = useState<null | { type: 'block' | 'comment', report: any }>(null);
  // Aktions-Modal für Report
  const renderReportActions = () => {
    if (!selectedReport || typeof window === 'undefined') return null;
    const { type, report } = selectedReport;
    const handleDeleteComment = async () => {
      setDeleteLoading(true);
      setDeleteError("");
      try {
        const blockDraftId = report.comment?.blockDraftId || report.blockDraftId;
        const res = await fetch(`/api/block-draft-comments?blockDraftId=${blockDraftId}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ commentId: report.commentId })
        });
        if (!res.ok) {
          setDeleteError("Fehler beim Löschen des Kommentars");
          setDeleteLoading(false);
          return;
        }
        setDeleteSuccess(true);
        setTimeout(() => {
          setSelectedReport(null);
          setDeleteSuccess(false);
          if (typeof window !== 'undefined') window.location.reload();
        }, 1200);
      } catch (e) {
        setDeleteError("Fehler beim Löschen des Kommentars");
      } finally {
        setDeleteLoading(false);
      }
    };
  return ReactDOM.createPortal(
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.25)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 4px 24px rgba(0,0,0,0.13)', padding: 32, minWidth: 320, maxWidth: '90vw', maxHeight: '80vh', overflowY: 'auto', position: 'relative' }}>
          <button onClick={() => setSelectedReport(null)} style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 22, color: '#888', cursor: 'pointer' }} title="Schließen">×</button>
          <h3 style={{ marginTop: 0, marginBottom: 18 }}>Aktionen für Meldung</h3>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{type === 'block' ? 'Beitrag:' : 'Kommentar:'} <span style={{ fontWeight: 400 }}>{type === 'block' ? (report.blockDraft?.title || report.blockDraftId) : (report.comment?.content || report.commentId)}</span></div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Grund: <span style={{ fontWeight: 400 }}>{report.reason}</span></div>
            <div style={{ color: '#888', fontSize: 13 }}>gemeldet am {new Date(report.createdAt).toLocaleString()}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 0', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>Als erledigt markieren</button>
            {type === 'comment' && (
              <button
                style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 0', fontWeight: 600, fontSize: 16, cursor: deleteLoading ? 'not-allowed' : 'pointer', opacity: deleteLoading ? 0.7 : 1 }}
                onClick={handleDeleteComment}
                disabled={deleteLoading || deleteSuccess}
              >
                {deleteLoading ? 'Lösche...' : deleteSuccess ? 'Gelöscht!' : 'Kommentar löschen'}
              </button>
            )}
            <button style={{ background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 8, padding: '12px 0', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>Ignorieren</button>
            {deleteError && <div style={{ color: 'red', marginTop: 8 }}>{deleteError}</div>}
          </div>
        </div>
      </div>,
      document.body
    );
  };
  const [reports, setReports] = useState<{ blockReports: BlockReport[]; commentReports: CommentReport[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showReports, setShowReports] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch('/api/admin/tickets-reports')
      .then(r => r.json())
      .then(data => {
        if (data && (Array.isArray(data.blockReports) || Array.isArray(data.commentReports))) setReports(data);
        else setError("Fehler beim Laden der Reports");
      })
      .catch(() => setError("Fehler beim Laden der Reports"))
      .finally(() => setLoading(false));
  }, []);

  const reportCount = (reports?.blockReports?.length || 0) + (reports?.commentReports?.length || 0);

  return (
    <div className={styles.adminSection}>
      <h2 className={styles.adminSectionTitle}>Ticketsystem</h2>
      <p>Hier können Sie Support-Tickets und gemeldete Inhalte verwalten.</p>
      {ticketStats.isLoading ? (
        <div className={styles.loadingState}>
          <p>Ticket-Statistiken werden geladen...</p>
        </div>
      ) : (
        <div className={styles.ticketStatusSection}>
          <div className={styles.ticketStatus}>
            <h3>Offene Tickets</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, minHeight: 56, justifyContent: 'center' }}>
              {ticketStats.openTickets > 0 && (
                <div style={{
                  width: 56,
                  height: 56,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 32,
                  fontWeight: 700,
                  color: '#1f2937',
                  background: '#fff',
                  borderRadius: 12,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  border: '1.5px solid #e5e7eb',
                }}>{ticketStats.openTickets}</div>
              )}
              {reportCount > 0 && (
                <button
                  style={{
                    width: 56,
                    height: 56,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 32,
                    fontWeight: 700,
                    background: '#e57373',
                    color: '#fff',
                    borderRadius: 12,
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    transition: 'background 0.2s',
                  }}
                  onClick={() => setShowReports(true)}
                  title="Gemeldete Inhalte anzeigen"
                >
                  {reportCount}
                </button>
              )}
            </div>
          </div>
          <div className={styles.ticketStatus}>
            <h3>In Bearbeitung</h3>
            {ticketStats.inProgressTickets > 0 && (
              <div style={{
                width: 56,
                height: 56,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 32,
                fontWeight: 700,
                color: '#1f2937',
                background: '#fff',
                borderRadius: 12,
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                border: '1.5px solid #e5e7eb',
              }}>{ticketStats.inProgressTickets}</div>
            )}
          </div>
          <div className={styles.ticketStatus}>
            <h3>Abgeschlossen</h3>
            {ticketStats.closedTickets > 0 && (
              <div style={{
                width: 56,
                height: 56,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 32,
                fontWeight: 700,
                color: '#1f2937',
                background: '#fff',
                borderRadius: 12,
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                border: '1.5px solid #e5e7eb',
              }}>{ticketStats.closedTickets}</div>
            )}
          </div>
        </div>
      )}

      {/* Modal für Reports */}
      {showReports && typeof window !== 'undefined' && ReactDOM.createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.35)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 4px 24px rgba(0,0,0,0.13)', padding: 32, minWidth: 340, maxWidth: '90vw', maxHeight: '80vh', overflowY: 'auto', position: 'relative', zIndex: 10000 }}>
            <button onClick={() => setShowReports(false)} style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 22, color: '#888', cursor: 'pointer', zIndex: 10001 }} title="Schließen">×</button>
            <h3 style={{ marginTop: 0 }}>Gemeldete Beiträge</h3>
            {loading ? <div>Lade Reports...</div> : error ? <div style={{ color: 'red' }}>{error}</div> : reports && (
              <>
                <div style={{ marginBottom: 24 }}>
                  <b>Gemeldete Blog-Beiträge:</b>
                  {reports.blockReports.length === 0 && <div style={{ color: '#888', marginTop: 12 }}>Keine Meldungen vorhanden.</div>}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12 }}>
                    {reports.blockReports.map(r => (
                      <div
                        key={r.id}
                        style={{
                          background: '#f9f9fb',
                          borderRadius: 10,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                          padding: 18,
                          border: '1px solid #e3e7ee',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6,
                          cursor: 'pointer',
                          transition: 'box-shadow 0.2s',
                        }}
                        onClick={() => setSelectedReport({ type: 'block', report: r })}
                        onMouseOver={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(25,118,210,0.13)'}
                        onMouseOut={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.07)'}
                      >
                        <div style={{ fontWeight: 600, marginBottom: 2 }}>Beitrag: <span style={{ fontWeight: 400 }}>{r.blockDraft?.title || r.blockDraftId}</span></div>
                        <div style={{ fontWeight: 600, marginBottom: 2 }}>Grund: <span style={{ fontWeight: 400 }}>{r.reason}</span></div>
                        <div style={{ color: '#888', fontSize: 13 }}>gemeldet am {new Date(r.createdAt).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <b>Gemeldete Kommentare:</b>
                  {reports.commentReports.length === 0 && <div style={{ color: '#888', marginTop: 12 }}>Keine Meldungen vorhanden.</div>}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12 }}>
                    {reports.commentReports.map(r => (
                      <div
                        key={r.id}
                        style={{
                          background: '#f9f9fb',
                          borderRadius: 10,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                          padding: 18,
                          border: '1px solid #e3e7ee',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6,
                          cursor: 'pointer',
                          transition: 'box-shadow 0.2s',
                        }}
                        onClick={() => setSelectedReport({ type: 'comment', report: r })}
                        onMouseOver={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(25,118,210,0.13)'}
                        onMouseOut={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.07)'}
                      >
                        <div style={{ fontWeight: 600, marginBottom: 2 }}>Kommentar: <span style={{ fontWeight: 400 }}>{r.comment?.content || r.commentId}</span></div>
                        <div style={{ fontWeight: 600, marginBottom: 2 }}>Grund: <span style={{ fontWeight: 400 }}>{r.reason}</span></div>
                        <div style={{ color: '#888', fontSize: 13 }}>gemeldet am {new Date(r.createdAt).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              {renderReportActions()}
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Tickets;
