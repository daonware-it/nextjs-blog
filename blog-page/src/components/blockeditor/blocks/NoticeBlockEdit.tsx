import React from 'react';
import { NOTICE_TYPES } from '../noticeTypes';
import styles from '../BlockEditor.module.css';

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
