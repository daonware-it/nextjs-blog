import React, { useState } from "react";
import styles from "./BlockEditor.module.css";

export interface ShortcodeBlockProps {
  shortcode: string;
  onChange: (shortcode: string) => void;
}

function validateShortcode(input: string): string | null {
  // Einfache Validierung: Muss mit [ beginnen und mit ] enden, keine verbotenen Zeichen
  if (!input.trim()) return "Shortcode darf nicht leer sein.";
  if (!/^\[.+\]$/.test(input.trim())) return "Shortcodes müssen mit [ beginnen und mit ] enden.";
  // Erlaube alle typischen URL- und Attributzeichen (inkl. : / . ? & = - _ " ' , Leerzeichen)
  if (/[^\[\]\w\s\-="'_:,\.\/\?&]/.test(input)) return "Ungültige Zeichen im Shortcode.";
  return null;
}

const ShortcodeBlock: React.FC<ShortcodeBlockProps> = ({ shortcode, onChange }) => {
  const [touched, setTouched] = useState(false);
  const error = validateShortcode(shortcode);

  return (
    <div className={styles.blockInputWrapper}>
      <input
        type="text"
        className={styles.blockInput}
        value={shortcode || ""}
        onChange={e => onChange(e.target.value)}
        onBlur={() => setTouched(true)}
        placeholder={'[shortcode param="value"]'}
        aria-invalid={error ? "true" : undefined}
        aria-describedby="shortcode-error"
        style={{ fontFamily: 'monospace', fontSize: '16px' } as React.CSSProperties}
      />
      {((touched || !!shortcode) && error) && (
        <div id="shortcode-error" style={{ color: '#cf0808', marginTop: 4, fontSize: 13 }}>
          {error}
        </div>
      )}
      {(!error && !!shortcode) && (
        <div style={{ marginTop: 8, background: '#f5f7fa', border: '1px solid #e2e4e7', borderRadius: 4, padding: 8, fontFamily: 'monospace', color: '#1976d2', fontSize: 15 }}>
          Vorschau: <span>{shortcode}</span>
        </div>
      )}
    </div>
  );
};

export default ShortcodeBlock;
