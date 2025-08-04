
import React from 'react';
import styles from '../BlockEditor.module.css';

const NOTICE_TYPES = [
  { value: 'info', label: 'Information', color: '#1976d2', bg: '#e3f2fd' },
  { value: 'warning', label: 'Warnung', color: '#b71c1c', bg: '#ffebee' },
  { value: 'success', label: 'Erfolg', color: '#388e3c', bg: '#e8f5e9' },
  { value: 'error', label: 'Fehler', color: '#d32f2f', bg: '#ffebee' },
  { value: 'tip', label: 'Tipp', color: '#0288d1', bg: '#e1f5fe' },
  { value: 'important', label: 'Wichtig', color: '#f57c00', bg: '#fff3e0' },
  { value: 'question', label: 'Frage', color: '#512da8', bg: '#ede7f6' },
  { value: 'hint', label: 'Hinweis', color: '#ad8b00', bg: '#fffbe6' },
  { value: 'spoiler', label: 'Spoiler', color: '#333', bg: '#f3f3f3' }
];

export default function NoticeBlockEdit({ block, onChange }: any) {
  const { data = '', noticeType = 'info' } = block || {};
  return (
    <div style={{ background: NOTICE_TYPES.find(t => t.value === noticeType)?.bg, border: '1.5px solid #e2e4e7', borderRadius: 8, padding: 16, margin: '8px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <select
          value={noticeType}
          onChange={e => onChange({ ...block, noticeType: e.target.value })}
          style={{ fontWeight: 600, fontSize: 14, borderRadius: 4, border: '1px solid #e2e4e7', padding: '4px 8px', background: '#fff', color: NOTICE_TYPES.find(t => t.value === noticeType)?.color }}
        >
          {NOTICE_TYPES.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
        <span style={{ color: NOTICE_TYPES.find(t => t.value === noticeType)?.color, fontWeight: 600, fontSize: 14 }}>{NOTICE_TYPES.find(t => t.value === noticeType)?.label}</span>
      </div>
      <textarea
        id={`block-input-${block.idx}`}
        value={data}
        onChange={e => onChange({ ...block, data: e.target.value })}
        className={styles.blockInput}
        rows={2}
        placeholder="Notiztext..."
        style={{ background: 'transparent', border: 'none', fontWeight: 500, color: NOTICE_TYPES.find(t => t.value === noticeType)?.color, minHeight: 32, fontSize: 15, padding: '4px 8px' }}
      />
    </div>
  );
}
