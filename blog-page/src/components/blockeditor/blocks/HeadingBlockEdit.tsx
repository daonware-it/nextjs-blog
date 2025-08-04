import React from 'react';
import styles from '../BlockEditor.module.css';

export default function HeadingBlockEdit({ block, onChange }: any) {
  return (
    <textarea
      id={`block-input-${block.idx}`}
      value={block.data}
      onChange={e => onChange(e.target.value)}
      className={styles.blockInput}
      rows={1}
      placeholder="Überschrift..."
    />
  );
}
