import React from 'react';
import styles from '../BlockEditor.module.css';

export default function QuoteBlockEdit({ block, onChange }: any) {
  return (
    <textarea
      id={`block-input-${block.idx}`}
      value={block.data}
      onChange={e => onChange(e.target.value)}
      className={styles.blockInput}
      rows={4}
      placeholder="Zitat eingeben..."
      style={{ minHeight: 64, maxHeight: 180, fontSize: 16, padding: '10px 14px', resize: 'vertical', lineHeight: 1.5 }}
    />
  );
}
