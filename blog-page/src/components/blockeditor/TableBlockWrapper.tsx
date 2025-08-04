import React, { useState } from 'react';
import styles from './BlockEditor.module.css';

interface TableBlockWrapperProps {
  userId: string | undefined;
  block: any;
  updateBlock: (data: string) => void;
}

const TableBlockWrapper: React.FC<TableBlockWrapperProps> = ({ userId, block, updateBlock }) => {
  const [showAiGenerator, setShowAiGenerator] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  
  // Komponenten erst importieren, wenn sie wirklich benötigt werden
  const TableBlock = require("./blocks/TableBlock").default;
  const AITableGenerator = require("./AITableGenerator").default;
  
  // Tabellendaten parsen
  let tableData: any = block.data;
  if (typeof tableData === 'string') {
    try {
      const parsed = JSON.parse(tableData);
      tableData = {
        ...parsed,
        data: Array.isArray(parsed.data)
          ? parsed.data.map((row: any[]) => Array.isArray(row) ? [...row] : [])
          : []
      };
    } catch {
      tableData = {
        rows: 2,
        cols: 2,
        data: [
          [{ text: '', align: 'left' }, { text: '', align: 'left' }],
          [{ text: '', align: 'left' }, { text: '', align: 'left' }]
        ]
      };
    }
  }
  
  // KI-Quota überprüfen, bevor der Generator angezeigt wird
  const checkQuotaAndShowGenerator = async () => {
    if (!userId) {
      setError('Bitte loggen Sie sich ein, um diese Funktion zu nutzen.');
      setShowErrorModal(true);
      return;
    }
    
    setIsChecking(true);
    setError(null);
    
    try {
      // KI-Quota überprüfen
      const authRes = await fetch('/api/ai-auth');
      const authData = await authRes.json();
      
      if (!authRes.ok || (authData.includedRequests !== null && authData.includedRequests <= 0)) {
        setError(authData?.reason || 'KI-Kontingent aufgebraucht');
        setShowErrorModal(true);
        setIsChecking(false);
        return;
      }
      
      // Alles ok, Generator anzeigen
      setShowAiGenerator(true);
    } catch (err) {
      console.error('Fehler bei der KI-Quota-Überprüfung:', err);
      setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
      setShowErrorModal(true);
    } finally {
      setIsChecking(false);
    }
  };
  
  return (
    <div>
      {showAiGenerator ? (
        <AITableGenerator
          userId={userId}
          onGenerate={(generatedTable) => {
            updateBlock(JSON.stringify(generatedTable));
            setShowAiGenerator(false);
          }}
          onCancel={() => setShowAiGenerator(false)}
        />
      ) : (
        <div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            marginBottom: 8 
          }}>
            <button
              type="button"
              onClick={checkQuotaAndShowGenerator}
              disabled={isChecking}
              style={{ 
                padding: '6px 12px', 
                background: '#1976d2', 
                color: '#fff', 
                border: 'none', 
                borderRadius: 6, 
                cursor: isChecking ? 'not-allowed' : 'pointer',
                fontSize: 14,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                opacity: isChecking ? 0.7 : 1
              }}
            >
              <span style={{ fontSize: 16 }}>🤖</span>
              {isChecking ? 'Prüfe...' : 'Tabelle mit KI erstellen'}
            </button>
          </div>
          
          <TableBlock
            table={tableData}
            onUpdate={data => updateBlock(JSON.stringify(data))}
          />
        </div>
      )}
      
      {/* KI-Kontingent Fehler-Modal */}
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

export default TableBlockWrapper;
