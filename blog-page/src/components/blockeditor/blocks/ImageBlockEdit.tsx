import React from 'react';
import styles from '../BlockEditor.module.css';

const alignOptions = [
  { value: 'left', label: 'Links' },
  { value: 'center', label: 'Zentriert' },
  { value: 'right', label: 'Rechts' },
];
const aspectOptions = [
  { value: 'original', label: 'Original' },
  { value: 'square', label: 'Quadrat (1:1)' },
  { value: '16:9', label: '16:9' },
  { value: '4:3', label: '4:3' },
];

function getAspectRatio(aspect) {
  switch (aspect) {
    case 'square': return '1 / 1';
    case '16:9': return '16 / 9';
    case '4:3': return '4 / 3';
    default: return undefined;
  }
}

export default function ImageBlockEdit({ block, onChange }: any) {

  const value = typeof block.data === 'string'
    ? { url: block.data, aspect: 'original', align: 'center', width: '', height: '' }
    : { url: '', aspect: 'original', align: 'center', width: '', height: '', ...block.data };

  const handleUrlChange = (url: string) => {
    onChange({ ...value, url });
  };
  const handleAspectChange = (aspect: string) => {
    onChange({ ...value, aspect });
  };
  const handleAlignChange = (align: string) => {
    onChange({ ...value, align });
  };
  const handleWidthChange = (width: string) => {
    onChange({ ...value, width });
  };
  const handleHeightChange = (height: string) => {
    onChange({ ...value, height });
  };

  let justifyContent: 'flex-start' | 'center' | 'flex-end' = 'center';
  if (value.align === 'left') justifyContent = 'flex-start';
  if (value.align === 'right') justifyContent = 'flex-end';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <input
        id={`block-input-${block.idx}`}
        type="text"
        value={value.url}
        onChange={e => handleUrlChange(e.target.value)}
        className={styles.blockInput}
        placeholder="Bild-URL..."
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <label style={{ fontSize: 14 }}>Größe:</label>
        <select value={value.aspect} onChange={e => handleAspectChange(e.target.value)} className={styles.blockInput} style={{ width: 120 }}>
          {aspectOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <label style={{ fontSize: 14, marginLeft: 16 }}>Ausrichtung:</label>
        <select value={value.align} onChange={e => handleAlignChange(e.target.value)} className={styles.blockInput} style={{ width: 120 }}>
          {alignOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
        <label style={{ fontSize: 14 }}>Breite:</label>
        <input
          type="number"
          min={0}
          value={value.width}
          onChange={e => handleWidthChange(e.target.value)}
          className={styles.blockInput}
          style={{ width: 80 }}
          placeholder="px"
        />
        <label style={{ fontSize: 14, marginLeft: 8 }}>Höhe:</label>
        <input
          type="number"
          min={0}
          value={value.height}
          onChange={e => handleHeightChange(e.target.value)}
          className={styles.blockInput}
          style={{ width: 80 }}
          placeholder="px"
        />
      </div>
      {value.url && (
        <div style={{ marginTop: 8, maxWidth: 400, borderRadius: 8, overflow: 'hidden', background: '#f7fafd', boxShadow: '0 1px 8px #0001', padding: 8, display: 'flex', justifyContent }}>
          <img
            src={value.url}
            alt="Bildvorschau"
            style={{
              width: value.width ? value.width + 'px' : '100%',
              height: value.height ? value.height + 'px' : 'auto',
              maxWidth: 380,
              aspectRatio: getAspectRatio(value.aspect),
              objectFit: 'cover',
              borderRadius: 8,
              background: '#eee',
            }}
          />
        </div>
      )}
    </div>
  );
}
