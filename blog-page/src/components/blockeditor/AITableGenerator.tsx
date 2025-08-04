import React, { useState } from 'react';
import styles from './BlockEditor.module.css';

interface AITableGeneratorProps {
  userId: string | undefined;
  onGenerate: (tableData: any) => void;
  onCancel: () => void;
}

const AITableGenerator: React.FC<AITableGeneratorProps> = ({ userId, onGenerate, onCancel }) => {
  const [headerText, setHeaderText] = useState('');
  const [description, setDescription] = useState('');
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [autoSize, setAutoSize] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);

  const handleGenerate = async () => {
    if (!userId) {
      setError('Bitte loggen Sie sich ein, um diese Funktion zu nutzen.');
      setShowErrorModal(true);
      return;
    }

    if (!headerText.trim()) {
      setError('Bitte geben Sie ein Thema für die Tabelle ein.');
      setShowErrorModal(true);
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // 1. KI-Quota überprüfen
      const authRes = await fetch('/api/ai-auth');
      const authData = await authRes.json();
      
      if (!authRes.ok || (authData.includedRequests !== null && authData.includedRequests <= 0)) {
        setError(authData?.reason || 'KI-Kontingent aufgebraucht');
        setShowErrorModal(true);
        setIsGenerating(false);
        return;
      }
      
      // 2. KI-Anfrage stellen
      const res = await fetch('/api/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          mode: 'table',
          headerText,
          description,
          rows,
          cols,
          autoSize,
          text: headerText // Fallback für die AI-Generate API
        }),
      });
      
      const data = await res.json();
      
      if (res.ok && data.result) {
        try {
          // Versuchen, das Ergebnis als JSON zu parsen
          let tableData;
          
          // Wenn das Ergebnis als String zurückkommt, versuchen wir es zu parsen
          if (typeof data.result === 'string') {
            const resultText = data.result.trim();
            // Extrahiere den JSON-Teil aus der Antwort (falls die KI zusätzlichen Text zurückgibt)
            const jsonMatch = resultText.match(/({[\s\S]*})/);
            const jsonStr = jsonMatch ? jsonMatch[0] : resultText;
            tableData = JSON.parse(jsonStr);
          } else {
            tableData = data.result;
          }
          
          // Struktur überprüfen und korrigieren
          if (!tableData.rows) tableData.rows = rows;
          if (!tableData.cols) tableData.cols = cols;
          if (!Array.isArray(tableData.data) || tableData.data.length === 0) {
            tableData.data = Array(rows).fill(0).map(() => 
              Array(cols).fill(0).map(() => ({ text: '', align: 'left' }))
            );
          }
          
          // Übergeben der erzeugten Tabellendaten
          onGenerate(tableData);
        } catch (parseError) {
          console.error('Fehler beim Parsen der Tabellendaten:', parseError);
          setError('Die KI-Antwort konnte nicht verarbeitet werden. Bitte versuchen Sie es erneut.');
        }
      } else {
        setError(data.error || 'Fehler bei der KI-Anfrage');
        setShowErrorModal(true);
      }
    } catch (err) {
      console.error('Fehler bei der KI-Anfrage:', err);
      setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
      setShowErrorModal(true);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={styles.aiTableGenerator}>
      <h3 style={{ margin: '0 0 16px 0', color: '#1976d2', fontSize: 18 }}>KI-Tabellengenerator</h3>
      
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Thema der Tabelle</label>
        <input
          type="text"
          value={headerText}
          onChange={(e) => setHeaderText(e.target.value)}
          placeholder="z.B. Vergleich von Programmiersprachen"
          style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc' }}
        />
      </div>
      
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Zusätzliche Anforderungen (optional)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="z.B. Bitte inkl. Typisierung, Syntax und Anwendungsbereiche"
          style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc', minHeight: 80 }}
        />
      </div>
      
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
          <input
            type="checkbox"
            checked={autoSize}
            onChange={(e) => setAutoSize(e.target.checked)}
            style={{ marginRight: 8 }}
          />
          Anzahl der Zeilen und Spalten automatisch bestimmen
        </label>
        <div style={{ fontSize: 13, color: '#666', marginTop: 2, marginLeft: 24 }}>
          Die KI wählt die optimale Größe basierend auf dem Thema
        </div>
      </div>
      
      {!autoSize && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Anzahl Zeilen</label>
            <input
              type="number"
              min={2}
              max={10}
              value={rows}
              onChange={(e) => setRows(Math.max(2, Math.min(10, parseInt(e.target.value) || 3)))}
              style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Anzahl Spalten</label>
            <input
              type="number"
              min={2}
              max={8}
              value={cols}
              onChange={(e) => setCols(Math.max(2, Math.min(8, parseInt(e.target.value) || 3)))}
              style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc' }}
            />
          </div>
        </div>
      )}
      
      {error && (
        <div style={{ color: '#d32f2f', marginBottom: 16, padding: 8, background: '#ffebee', borderRadius: 6 }}>
          {error}
        </div>
      )}
      
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{ 
            padding: '8px 16px', 
            background: '#e0e0e0', 
            border: 'none', 
            borderRadius: 6, 
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          Abbrechen
        </button>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating || !headerText.trim()}
          style={{ 
            padding: '8px 16px', 
            background: '#1976d2', 
            color: '#fff', 
            border: 'none', 
            borderRadius: 6, 
            cursor: isGenerating || !headerText.trim() ? 'not-allowed' : 'pointer',
            fontWeight: 500,
            opacity: isGenerating || !headerText.trim() ? 0.7 : 1
          }}
        >
          {isGenerating ? 'Generiere...' : 'Tabelle erstellen'}
        </button>
      </div>
      
      {/* Fehler-Modal für KI-Quota */}
      {showErrorModal && (
        <div className={styles.aiLimitErrorModal}>
          <div className={styles.aiLimitErrorContent}>
            <button 
              className={styles.aiLimitErrorCloseBtn}
              onClick={() => setShowErrorModal(false)}
            >
              ×
            </button>
            <div className={styles.aiLimitErrorTitle}>
              KI-Anfrage nicht möglich
            </div>
            <div className={styles.aiLimitErrorMsg}>
              {error || 'Die KI-Anfrage konnte nicht verarbeitet werden.'}<br />
              Bei Fragen kontaktiere bitte den Support.
            </div>
            <button
              className={styles.aiLimitErrorActionBtn}
              onClick={() => setShowErrorModal(false)}
            >
              Schließen
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AITableGenerator;
