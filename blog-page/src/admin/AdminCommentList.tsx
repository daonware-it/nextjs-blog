import React, { useEffect, useState } from 'react';

const AdminCommentList: React.FC = () => {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch('/api/admin/comments')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setComments(data);
        else setError("Fehler beim Laden der Kommentare");
      })
      .catch(() => setError("Fehler beim Laden der Kommentare"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Lade Kommentare...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div style={{ maxHeight: 600, overflowY: 'auto', background: '#fafdff', borderRadius: 12, border: '1.5px solid #e3e7ee', padding: 18 }}>
      <table style={{ width: '100%', fontSize: 15, borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f0f4fa' }}>
            <th style={{ padding: 8, textAlign: 'left' }}>ID</th>
            <th style={{ padding: 8, textAlign: 'left' }}>User</th>
            <th style={{ padding: 8, textAlign: 'left' }}>Beitrag</th>
            <th style={{ padding: 8, textAlign: 'left' }}>Inhalt</th>
            <th style={{ padding: 8, textAlign: 'left' }}>Erstellt</th>
            <th style={{ padding: 8, textAlign: 'left' }}>Likes</th>
            <th style={{ padding: 8, textAlign: 'left' }}>Reports</th>
          </tr>
        </thead>
        <tbody>
          {comments.map(c => (
            <tr key={c.id} style={{ borderBottom: '1px solid #e3e7ee' }}>
              <td style={{ padding: 8 }}>{c.id}</td>
              <td style={{ padding: 8 }}>{c.user?.name || c.user?.username || c.user?.email || 'Unbekannt'}</td>
              <td style={{ padding: 8 }}>{c.blockDraft?.title || c.blockDraftId}</td>
              <td style={{ padding: 8 }}>{c.content}</td>
              <td style={{ padding: 8 }}>{new Date(c.createdAt).toLocaleString()}</td>
              <td style={{ padding: 8 }}>{Array.isArray(c.likes) ? c.likes.length : 0}</td>
              <td style={{ padding: 8 }}>{Array.isArray(c.blockDraftCommentReports) ? c.blockDraftCommentReports.length : 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminCommentList;
