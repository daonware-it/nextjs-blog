import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import ReactDOM from 'react-dom';
import { FaPlus, FaMinus } from 'react-icons/fa';
import styles from './TableBlock.module.css'; // Stelle sicher, dass der Pfad zu deiner CSS-Datei korrekt ist

// Typdefinitionen für bessere Lesbarkeit und Sicherheit
interface TableCell {
  text: string;
  bold?: boolean;
  italic?: boolean;
  align?: 'left' | 'center' | 'right';
  color?: string;
}

interface TableData {
  rows: number;
  cols: number;
  data: TableCell[][];
}

interface TableBlockProps {
  table: TableData;
  onUpdate: (newTable: TableData) => void;
}

interface PopoverProps {
  cell: TableCell;
  rowIdx: number;
  colIdx: number;
  handleCellChange: (row: number, col: number, newProps: Partial<TableCell>) => void;
  colorOptions: { name: string; value: string }[];
}

// Default-Werte für das Table-Prop
const DEFAULT_TABLE: TableData = {
  rows: 2,
  cols: 2,
  data: [
    [ { text: '', align: 'left' }, { text: '', align: 'left' } ],
    [ { text: '', align: 'left' }, { text: '', align: 'left' } ]
  ]
};


// Die Hauptkomponente
const TableBlock: React.FC<TableBlockProps> = ({ table, onUpdate }) => {
  // Handler-Funktion für Zelländerungen – muss vor allen useEffect/useState/useRef-Hooks stehen!
  const handleCellChange = (rowIdx: number, colIdx: number, newProps: Partial<TableCell>) => {
    const newTableData: TableCell[][] = safeTable.data.map((row, r) =>
      row.map((cell, c) => {
        if (r === rowIdx && c === colIdx) {
          let props = { ...cell, ...newProps };
          // Wenn NUR die Ausrichtung geändert wird, Text aus dem aktuellen contentEditable-Div holen
          if (
            Object.keys(newProps).length === 1 &&
            typeof newProps.align === 'string'
          ) {
            const ref = richInputRefs.current?.[rowIdx]?.[colIdx];
            if (ref && ref.current) {
              props.text = ref.current.innerHTML;
            }
          }
          if (props.align && typeof props.align === 'string') {
            if (['left', 'center', 'right'].includes(props.align)) {
              props.align = props.align as 'left' | 'center' | 'right';
            } else {
              props.align = 'left';
            }
          }
          return props;
        }
        return cell;
      })
    );
    safeOnUpdate({ ...safeTable, data: newTableData });
  };
  const safeTable = table || DEFAULT_TABLE;
  if (typeof onUpdate !== 'function') {
    throw new Error('TableBlock: Das onUpdate-Prop ist erforderlich und muss eine Funktion sein!');
  }
  const safeOnUpdate = onUpdate;

  // Handler-Funktion für Zelländerungen – muss vor allen useEffect/useState/useRef-Hooks stehen!


  // State, um zu verfolgen, welche Zelle gerade bearbeitet wird
  const [editing, setEditing] = useState<{ row: number; col: number } | null>(null);

  // 2D-Array von Refs für die contentEditable-Divs
  const richInputRefs = useRef<Array<Array<React.RefObject<HTMLDivElement>>>>([]);
  if (!richInputRefs.current || richInputRefs.current.length !== safeTable.rows || richInputRefs.current[0]?.length !== safeTable.cols) {
    // Initialisiere oder passe die Größe an
    richInputRefs.current = Array.from({ length: safeTable.rows }, () =>
      Array.from({ length: safeTable.cols }, () => React.createRef<HTMLDivElement>())
    );
  }

  // Refs für DOM-Elemente (Popover und die aktive Zelle)
  const editingRef = useRef<HTMLTableCellElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Hilfsfunktion für Farbauswahl
  const colorOptions = [
    { name: 'Standard', value: '' },
    { name: 'Rot', value: '#e53935' },
    { name: 'Orange', value: '#fb8c00' },
    { name: 'Gelb', value: '#fbc02d' },
    { name: 'Grün', value: '#43a047' },
    { name: 'Blau', value: '#1976d2' },
    { name: 'Lila', value: '#8e24aa' },
    { name: 'Grau', value: '#607d8b' },
  ];

  // Textausrichtung nachziehen, wenn sich align ändert
  useEffect(() => {
    if (editing) {
      const ref = richInputRefs.current?.[editing.row]?.[editing.col];
      if (ref && ref.current) {
        ref.current.style.textAlign = safeTable.data[editing.row][editing.col].align || 'left';
      }
    }
  }, [editing, safeTable]);

  // Setze initialen Wert beim Öffnen in das contentEditable-Div (nur bei editing-Änderung)
  useEffect(() => {
    if (editing) {
      const ref = richInputRefs.current?.[editing.row]?.[editing.col];
      if (ref && ref.current) {
        ref.current.innerHTML = safeTable.data[editing.row][editing.col].text || '';
        ref.current.style.textAlign = safeTable.data[editing.row][editing.col].align || 'left';
        // Fokus setzen und Cursor ans Ende
        ref.current.focus();
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(ref.current);
        range.collapse(false);
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
  }, [editing, safeTable]);

  // Effekt, um das Popover zu schließen, wenn man außerhalb klickt
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const cell = editingRef.current;
      const popover = popoverRef.current;
      const target = event.target as Node;
      if (cell && cell.contains(target)) return;
      if (popover && popover.contains(target)) return;
      // Beim Verlassen: Wert aus dem Div lesen und speichern
      const ref = richInputRefs.current?.[editing?.row ?? 0]?.[editing?.col ?? 0];
      const html = ref && ref.current ? ref.current.innerHTML : '';
      if (editing) handleCellChange(editing.row, editing.col, { text: html });
      setEditing(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [editing, handleCellChange]);

  // Effekt, um das Popover zu schließen, wenn man außerhalb klickt
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const cell = editingRef.current;
      const popover = popoverRef.current;
      const target = event.target as Node;
      if (cell && cell.contains(target)) return;
      if (popover && popover.contains(target)) return;
      // Beim Verlassen: Wert aus dem Div lesen und speichern
      const ref = richInputRefs.current?.[editing?.row ?? 0]?.[editing?.col ?? 0];
      const html = ref && ref.current ? ref.current.innerHTML : '';
      if (editing) handleCellChange(editing.row, editing.col, { text: html });
      setEditing(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [editing, handleCellChange]);

  // --- Handler-Funktionen ---


  const handleAddRow = () => {
    const newRow: TableCell[] = Array(safeTable.cols).fill(0).map(() => ({ text: '', align: 'left' as 'left' }));
    const newTable: TableData = {
      ...safeTable,
      rows: safeTable.rows + 1,
      data: [...safeTable.data, newRow],
    };
    safeOnUpdate(newTable);
  };

  const handleRemoveRow = () => {
    if (safeTable.rows <= 1) return;
    const newData = safeTable.data.slice(0, -1);
    const newTable = {
      ...safeTable,
      rows: safeTable.rows - 1,
      data: newData,
    };
    safeOnUpdate(newTable);
  };

  const handleAddCol = () => {
    const newData: TableCell[][] = safeTable.data.map(row => [...row, { text: '', align: 'left' as 'left' }]);
    const newTable: TableData = {
      ...safeTable,
      cols: safeTable.cols + 1,
      data: newData,
    };
    safeOnUpdate(newTable);
  };

  const handleRemoveCol = () => {
    if (safeTable.cols <= 1) return;
    const newData = safeTable.data.map(row => row.slice(0, -1));
    const newTable = {
      ...safeTable,
      cols: safeTable.cols - 1,
      data: newData,
    };
    safeOnUpdate(newTable);
  };

  return (
    <div>
      <div className={styles.tableToolbar}>
        <div className={styles.tableToolbarSection}>
          <h4 className={styles.tableToolbarHeading}>Zeilen</h4>
          <div className={styles.tableToolbarButtons}>
            <button type="button" className={styles.tableBlockButton} onClick={handleAddRow} title="Zeile hinzufügen">
              <FaPlus size={12} /> Hinzufügen
            </button>
            <button type="button" className={styles.tableBlockButton} onClick={handleRemoveRow} title="Letzte Zeile entfernen" disabled={safeTable.rows <= 1}>
              <FaMinus size={12} /> Entfernen
            </button>
          </div>
        </div>
        <div className={styles.tableToolbarSection}>
          <h4 className={styles.tableToolbarHeading}>Spalten</h4>
          <div className={styles.tableToolbarButtons}>
            <button type="button" className={styles.tableBlockButton} onClick={handleAddCol} title="Spalte hinzufügen">
              <FaPlus size={12} /> Hinzufügen
            </button>
            <button type="button" className={styles.tableBlockButton} onClick={handleRemoveCol} title="Letzte Spalte entfernen" disabled={safeTable.cols <= 1}>
              <FaMinus size={12} /> Entfernen
            </button>
          </div>
        </div>
      </div>
      <table className={styles.tableBlock}>
        <tbody>
          {safeTable.data.map((row, rowIdx) => (
            <tr key={rowIdx}>
              {row.map((cell, colIdx) => (
                <td
                  key={colIdx}
                  data-row={rowIdx}
                  data-col={colIdx}
                  ref={editing && editing.row === rowIdx && editing.col === colIdx ? editingRef : undefined}
                  style={{
                    verticalAlign: 'top',
                    // Keine globale Schriftstärke oder Kursivschrift mehr, nur HTML im Textfeld bestimmt das Aussehen
                    textAlign: cell.align,
                    color: cell.color || undefined,
                    position: 'relative',
                    cursor: 'text',
                  }}
                  onClick={() => {
                    setEditing({ row: rowIdx, col: colIdx });
                  }}
                >
                  {(editing && editing.row === rowIdx && editing.col === colIdx) ? (
                    <>
                      <div
                        ref={richInputRefs.current[rowIdx][colIdx]}
                        contentEditable
                        suppressContentEditableWarning
                        autoFocus
                        dir="auto"
                        style={{
                          minWidth: 60,
                          zIndex: 2,
                          position: 'relative',
                          outline: 'none',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          textAlign: cell.align || 'left',
                        }}
                        data-align={cell.align || 'left'}
                        dangerouslySetInnerHTML={{ __html: cell.text || '' }}
                        onFocus={(e) => {
                          // Cursor ans Ende des Textes setzen
                          const range = document.createRange();
                          const sel = window.getSelection();
                          range.selectNodeContents(e.target);
                          range.collapse(false);
                          sel?.removeAllRanges();
                          sel?.addRange(range);
                        }}
                        onInput={e => {
                          const html = (e.target as HTMLDivElement).innerHTML;
                          handleCellChange(rowIdx, colIdx, { text: html });
                          // Textausrichtung nach jedem Edit erzwingen
                          const ref = richInputRefs.current[rowIdx][colIdx];
                          if (ref && ref.current) {
                            ref.current.style.textAlign = cell.align || 'left';
                          }
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Escape') {
                            setEditing(null);
                          } else if (e.key === 'Tab') {
                            e.preventDefault(); // Verhindert, dass der Tab-Focus zum nächsten Element springt
                            const nextCol = colIdx + (e.shiftKey ? -1 : 1);
                            if (nextCol >= 0 && nextCol < safeTable.cols) {
                              // Zur nächsten/vorherigen Zelle in der gleichen Zeile
                              setEditing({ row: rowIdx, col: nextCol });
                            } else if (!e.shiftKey && colIdx === safeTable.cols - 1 && rowIdx < safeTable.rows - 1) {
                              // Am Ende der Zeile? Zur ersten Zelle der nächsten Zeile
                              setEditing({ row: rowIdx + 1, col: 0 });
                            } else if (e.shiftKey && colIdx === 0 && rowIdx > 0) {
                              // Am Anfang der Zeile mit Shift+Tab? Zur letzten Zelle der vorherigen Zeile
                              setEditing({ row: rowIdx - 1, col: safeTable.cols - 1 });
                            }
                          }
                        }}
                      />
                      <Popover
                        cell={cell}
                        rowIdx={rowIdx}
                        colIdx={colIdx}
                        handleCellChange={handleCellChange}
                        colorOptions={colorOptions}
                        popoverRef={popoverRef}
                        enableRichFormatting
                      />
                    </>
                  ) : (
                    <div 
                      style={{ 
                        display: 'flex',
                        alignItems: 'center', 
                        minHeight: '2em',
                        minWidth: 60,
                        width: '100%',
                        height: '100%',
                        justifyContent: cell.align === 'center' ? 'center' : cell.align === 'right' ? 'flex-end' : 'flex-start'
                      }}
                    >
                      {cell.text ? (
                        <span style={{ width: '100%', textAlign: cell.align || 'left' }} dangerouslySetInnerHTML={{ __html: cell.text }} />
                      ) : (
                        <span style={{ color: '#bbb' }}>Zelle...</span>
                      )}
                    </div>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Popover-Komponente für bessere Lesbarkeit und Scope
const Popover: React.FC<PopoverProps & { popoverRef: React.RefObject<HTMLDivElement>; enableRichFormatting?: boolean }> = ({ cell, rowIdx, colIdx, handleCellChange, colorOptions, popoverRef, enableRichFormatting }) => {
  const [portalStyle, setPortalStyle] = useState<React.CSSProperties>({});

  useLayoutEffect(() => {
    const cellElem = document.querySelector(
      `td[data-row='${rowIdx}'][data-col='${colIdx}']`
    ) as HTMLElement;
    if (cellElem) {
      const rect = cellElem.getBoundingClientRect();
      const popoverWidth = 220; // grob geschätzt
      const popoverHeight = 120; // grob geschätzt
      let top = rect.top;
      let left = rect.right + 8;
      // Wenn rechts zu wenig Platz, nach links
      if (left + popoverWidth > window.innerWidth) {
        left = rect.left - popoverWidth - 8;
      }
      // Wenn links zu wenig Platz, nach unten
      if (left < 0) {
        left = rect.left;
        top = rect.bottom + 8;
      }
      // Wenn unten zu wenig Platz, nach oben
      if (top + popoverHeight > window.innerHeight) {
        top = rect.top - popoverHeight - 8;
      }
      setPortalStyle({
        position: 'fixed',
        left,
        top,
        zIndex: 1000,
      });
    }
  }, [rowIdx, colIdx]);

  // Hilfsfunktion: Formatierung auf aktuelle Auswahl anwenden
  function exec(command: string, value?: string) {
    document.execCommand(command, false, value);
  }

  const popoverContent = (
    <div
      className={styles.tableCellPopover}
      style={portalStyle}
      ref={popoverRef}
      onClick={e => e.stopPropagation()}
    >
      {enableRichFormatting && rowIdx !== 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button type="button" title="Fett" style={{ fontWeight: 700, color: '#1976d2', border: 'none', background: 'none', cursor: 'pointer' }} onMouseDown={e => { e.preventDefault(); exec('bold'); }}>B</button>
          <button type="button" title="Kursiv" style={{ fontStyle: 'italic', color: '#1976d2', border: 'none', background: 'none', cursor: 'pointer' }} onMouseDown={e => { e.preventDefault(); exec('italic'); }}>I</button>
          <input type="color" title="Farbe" style={{ width: 24, height: 24, border: 'none', background: 'none', cursor: 'pointer', padding: 0 }} onChange={e => exec('foreColor', e.target.value)} />
        </div>
      )}
      {rowIdx !== 0 && (
        <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: cell.bold ? '#1976d2' : '#57606a', fontWeight: 600 }}>
          <input
            type="checkbox"
            checked={!!cell.bold}
            onChange={e => handleCellChange(rowIdx, colIdx, { bold: e.target.checked })}
            style={{ accentColor: '#1976d2' }}
          />
          Fett (Zelle)
        </label>
      )}
      <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: cell.italic ? '#1976d2' : '#57606a', fontWeight: 600 }}>
        <input
          type="checkbox"
          checked={!!cell.italic}
          onChange={e => handleCellChange(rowIdx, colIdx, { italic: e.target.checked })}
          style={{ accentColor: '#1976d2' }}
        />
        Kursiv (Zelle)
      </label>
      <select
        value={cell.align || 'left'}
        onChange={e => handleCellChange(rowIdx, colIdx, { align: e.target.value as 'left' | 'center' | 'right' })}
        style={{ fontSize: 13, borderRadius: 6, border: '1.5px solid #d0d7de', padding: '4px 8px', color: '#1976d2', fontWeight: 600 }}
      >
        <option value="left">Links</option>
        <option value="center">Mittig</option>
        <option value="right">Rechts</option>
      </select>
      <select
        value={cell.color || ''}
        onChange={e => handleCellChange(rowIdx, colIdx, { color: e.target.value })}
        style={{ fontSize: 13, borderRadius: 6, border: '1.5px solid #d0d7de', padding: '4px 8px', color: cell.color || '#57606a', fontWeight: 600 }}
      >
        {colorOptions.map(opt => (
          <option key={opt.value} value={opt.value} style={{ color: opt.value || '#24292f' }}>
            {opt.name}
          </option>
        ))}
      </select>
    </div>
  );

  return ReactDOM.createPortal(popoverContent, document.body);
};

export default TableBlock;
