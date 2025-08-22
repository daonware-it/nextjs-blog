import React, { useEffect, useState } from 'react';

interface OpenAIModel {
  id: string;
  object: string;
  owned_by: string;
}

export default function AdminOpenAIBilling() {
  const [models, setModels] = useState<OpenAIModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  useEffect(() => {
    fetch('/api/admin/openai-billing')
      .then(res => res.json())
      .then(json => {
        if (json.error) setError(json.error);
        else {
          setModels(json.models || []);
          setInfo(json.info || '');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Fehler beim Laden der OpenAI-Modelle');
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', background: '#fff', border: '1px solid #eaeaea', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', padding: 32, marginBottom: 40 }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1976d2', marginBottom: 24 }}>OpenAI Statistik & Information</h2>
      <p style={{ color: 'red', marginBottom: 24 }}>{info}</p>
      <div style={{ display: 'flex', gap: '16px', marginBottom: 24 }}>
        <a href="https://platform.openai.com/account/usage" target="_blank" rel="noopener noreferrer">
          <button style={{background:'#1976d2',color:'#fff',border:'none',borderRadius:6,padding:'8px 16px',cursor:'pointer'}}>OpenAI Guthaben & Verbrauch</button>
        </a>
        <a href="https://platform.openai.com/account/usage" target="_blank" rel="noopener noreferrer">
          <button style={{background:'#1976d2',color:'#fff',border:'none',borderRadius:6,padding:'8px 16px',cursor:'pointer'}}>OpenAI Statistik</button>
        </a>
        <a href="https://openai.com/pricing" target="_blank" rel="noopener noreferrer">
          <button style={{background:'#1976d2',color:'#fff',border:'none',borderRadius:6,padding:'8px 16px',cursor:'pointer'}}>OpenAI Preisliste</button>
        </a>
      </div>
      <hr style={{ margin: '32px 0' }} />
      <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>Verfügbare KI-Modelle (API)</h3>
      {loading && <div>Modelle werden geladen ...</div>}
      {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
      {!loading && !error && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
          <thead>
            <tr style={{ background: '#f2f8ff' }}>
              <th style={{ textAlign: 'left', padding: 8 }}>Modell-ID</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Typ</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Besitzer</th>
            </tr>
          </thead>
          <tbody>
            {models.map(model => (
              <tr key={model.id}>
                <td style={{ padding: 8 }}>{model.id}</td>
                <td style={{ padding: 8 }}>{model.object}</td>
                <td style={{ padding: 8 }}>{model.owned_by}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
