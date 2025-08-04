import React, { useState } from 'react';
import styles from './Timeline.module.css';

export interface TimelineItem {
  title: string;
  date?: string;
  description?: string;
  icon?: React.ReactNode;
}

interface TimelineEditorProps {
  initialItems?: TimelineItem[];
  onChange?: (items: TimelineItem[]) => void;
}

const TimelineEditor: React.FC<TimelineEditorProps> = ({ initialItems = [], onChange }) => {
  const [items, setItems] = useState<TimelineItem[]>(initialItems);
  const [newItem, setNewItem] = useState<TimelineItem>({ title: '', date: '', description: '' });

  const handleAdd = () => {
    if (!newItem.title.trim()) return;
    const updated = [...items, newItem];
    setItems(updated);
    setNewItem({ title: '', date: '', description: '' });
    onChange?.(updated);
  };


  // Sortierfunktion: neueste oben, leere Daten zuletzt
  function sortByDate(list: TimelineItem[]) {
    return [...list].sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      // Vergleiche als YYYY-MM-DD-String (absteigend: neueste oben)
      return a.date!.localeCompare(b.date!);
    });
  }

  const sortedItems = sortByDate(items);

  return (
    <div>
      <div className={styles.timelineEditorForm}>
        <input
          type="text"
          placeholder="Titel"
          value={newItem.title}
          onChange={e => setNewItem({ ...newItem, title: e.target.value })}
          className={styles.timelineEditorInput}
          style={{ flex: 2 }}
        />
        <input
          type="date"
          placeholder="Datum (optional)"
          value={newItem.date}
          onChange={e => setNewItem({ ...newItem, date: e.target.value })}
          className={styles.timelineEditorInput}
          style={{ flex: 1 }}
        />
        <input
          type="text"
          placeholder="Beschreibung (optional)"
          value={newItem.description}
          onChange={e => setNewItem({ ...newItem, description: e.target.value })}
          className={styles.timelineEditorInput}
          style={{ flex: 3 }}
          onKeyDown={e => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
        />
        <button type="button" onClick={handleAdd} className={styles.timelineEditorButton}>
          Hinzufügen
        </button>
        <button
          type="button"
          onClick={() => {
            const sorted = sortByDate(items);
            setItems(sorted);
            onChange?.(sorted);
          }}
          className={styles.timelineEditorButton}
          style={{ background: 'linear-gradient(90deg, #43a047 60%, #a5d6a7 100%)', marginLeft: 8 }}
        >
          Nach Datum sortieren
        </button>
      </div>
      <ul className={styles.timelineList}>
        {sortedItems.map((item, idx) => (
          <li className={styles.timelineItem} key={idx}>
            <div className={styles.timelineIcon}>{item.icon}</div>
            <div className={styles.timelineContent}>
              <div className={styles.timelineTitle}>{item.title}</div>
              {item.date && <div className={styles.timelineDate}>{item.date}</div>}
              {item.description && <div className={styles.timelineDescription}>{item.description}</div>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TimelineEditor;
