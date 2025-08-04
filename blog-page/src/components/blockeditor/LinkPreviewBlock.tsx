import React, { useState, useEffect } from "react";
import styles from "./BlockEditor.module.css";

export interface LinkPreviewBlockProps {
  url: string;
  onChange: (url: string) => void;
}

interface PreviewData {
  title: string;
  description: string;
  image: string;
  url: string;
}

const LinkPreviewBlock: React.FC<LinkPreviewBlockProps> = ({ url, onChange }) => {
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url || !/^https?:\/\//.test(url)) {
      setPreview(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    fetch(`/api/link-preview?url=${encodeURIComponent(url)}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) setError(data.error);
        else setPreview(data);
      })
      .catch(() => setError("Fehler beim Laden der Vorschau"))
      .finally(() => setLoading(false));
  }, [url]);

  return (
    <div className={styles.blockInputWrapper}>
      {typeof onChange === 'function' && (
        <input
          type="url"
          className={styles.blockInput}
          value={url}
          onChange={e => onChange(e.target.value)}
          placeholder="https://beispiel.de"
          style={{ marginBottom: 8 }}
        />
      )}
      {loading && <div style={{ color: '#1976d2', fontSize: 14 }}>Lade Vorschau...</div>}
      {error && <div style={{ color: '#cf0808', fontSize: 13 }}>{error}</div>}
      {preview && !error && (
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', background: '#f5f7fa', border: '1px solid #e2e4e7', borderRadius: 8, padding: 12, marginTop: 8 }}>
          {preview.image && (
            <img src={preview.image} alt={preview.title} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6, background: '#eee' }} />
          )}
          <div style={{ flex: 1 }}>
            <a href={preview.url} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600, color: '#1976d2', fontSize: 16, marginBottom: 4, display: 'inline-block', textDecoration: 'underline' }}>{preview.title || preview.url}</a>
            <div style={{ color: '#333', fontSize: 14, marginBottom: 4 }}>{preview.description}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LinkPreviewBlock;
