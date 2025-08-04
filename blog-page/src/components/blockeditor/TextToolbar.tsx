import React, { useRef, useEffect } from "react";

interface TextToolbarProps {
  blockData: string;
  onFormat: (newValue: string) => void;
  contentEditableId: string;
}

export const TextToolbar: React.FC<TextToolbarProps> = ({ blockData, onFormat, contentEditableId }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const colorMenuRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && blockData !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = blockData;
    }
  }, [blockData]);

  const format = (command: string, value?: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand(command, false, value);
    }
  };

  const [fontSize, setFontSize] = React.useState<number>(16);
  const [fontColor, setFontColor] = React.useState<string>("#222222");
  const [showColorMenu, setShowColorMenu] = React.useState<boolean>(false);

  // Schließt das Farbauswahl-Menü bei Klick außerhalb
  React.useEffect(() => {
    if (!showColorMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (colorMenuRef.current && !colorMenuRef.current.contains(e.target as Node)) {
        setShowColorMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showColorMenu]);
  // State für die Sperre des Vorschau-Textfelds
  const [previewLocked, setPreviewLocked] = React.useState<boolean>(true);

  return (
    <>
      <div style={{ display: "flex", gap: 12, marginBottom: 8, alignItems: "center", background: "#f5f7fa", borderRadius: 6, padding: "6px 12px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        <button type="button" title="Fett" style={{ fontWeight: "bold", padding: "6px 12px", borderRadius: 4, border: "none", background: "#e3e7ee", cursor: "pointer", transition: "background 0.2s" }}
          onClick={() => format("bold")}
        ><b>F</b></button>
        <button type="button" title="Kursiv" style={{ fontStyle: "italic", padding: "6px 12px", borderRadius: 4, border: "none", background: "#e3e7ee", cursor: "pointer", transition: "background 0.2s" }}
          onClick={() => format("italic")}
        ><i>I</i></button>
        <button type="button" title="Unterstrichen" style={{ textDecoration: "underline", padding: "6px 12px", borderRadius: 4, border: "none", background: "#e3e7ee", cursor: "pointer", transition: "background 0.2s" }}
          onClick={() => format("underline")}
        >U</button>
        <button type="button" title="Hauptüberschrift (H2)" style={{ padding: "6px 12px", borderRadius: 4, border: "none", background: "#e3e7ee", cursor: "pointer", transition: "background 0.2s", fontWeight: "bold" }}
          onClick={() => format("formatBlock", "h2")}
        >H2</button>
        <button type="button" title="Unterüberschrift (H3)" style={{ padding: "6px 12px", borderRadius: 4, border: "none", background: "#e3e7ee", cursor: "pointer", transition: "background 0.2s", fontWeight: "bold", fontSize: "0.9em" }}
          onClick={() => format("formatBlock", "h3")}
        >H3</button>
        <label htmlFor="fontSizeDropdown" style={{ marginLeft: 12, fontSize: 14, color: "#555" }}>Schriftgröße:</label>
        {/* Aufzählung und nummerierte Liste */}
        <button type="button" title="Aufzählung (Punkte)" style={{ padding: "6px 10px", borderRadius: 4, border: "none", background: "#e3e7ee", cursor: "pointer" }}
          onClick={() => format("insertUnorderedList")}
        >
          <svg width="18" height="18" viewBox="0 0 18 18"><circle cx="5" cy="5" r="2" fill="#555"/><rect x="9" y="4" width="6" height="2" fill="#555"/><circle cx="5" cy="9" r="2" fill="#555"/><rect x="9" y="8" width="6" height="2" fill="#555"/><circle cx="5" cy="13" r="2" fill="#555"/><rect x="9" y="12" width="6" height="2" fill="#555"/></svg>
        </button>
        <button type="button" title="Nummerierte Liste" style={{ padding: "6px 10px", borderRadius: 4, border: "none", background: "#e3e7ee", cursor: "pointer" }}
          onClick={() => format("insertOrderedList")}
        >
          <svg width="18" height="18" viewBox="0 0 18 18"><text x="2" y="7" fontSize="6" fill="#555">1.</text><rect x="9" y="4" width="7" height="2" fill="#555"/><text x="2" y="13" fontSize="6" fill="#555">2.</text><rect x="9" y="10" width="7" height="2" fill="#555"/></svg>
        </button>
        <select
          id="fontSizeDropdown"
          value={fontSize}
          onChange={e => {
            const size = Number(e.target.value);
            setFontSize(size);
            format("fontSize", String(size));
          }}
          style={{ padding: "6px 12px", borderRadius: 4, border: "none", background: "#e3e7ee", fontSize: 14, cursor: "pointer" }}
        >
          {[10,12,14,16,18,20,24,28,32,36,40,48,56,64,72].map(size => (
            <option key={size} value={size}>{size}px</option>
          ))}
        </select>
        {/* Ausrichtung Buttons mit typischen Icons */}
        <button type="button" title="Links ausrichten" style={{ padding: "6px 10px", borderRadius: 4, border: "none", background: "#e3e7ee", cursor: "pointer" }}
          onClick={() => format("justifyLeft")}
        >
          <svg width="18" height="18" viewBox="0 0 18 18"><rect x="2" y="4" width="14" height="2" fill="#555"/><rect x="2" y="8" width="10" height="2" fill="#555"/><rect x="2" y="12" width="8" height="2" fill="#555"/></svg>
        </button>
        <button type="button" title="Zentriert ausrichten" style={{ padding: "6px 10px", borderRadius: 4, border: "none", background: "#e3e7ee", cursor: "pointer" }}
          onClick={() => format("justifyCenter")}
        >
          <svg width="18" height="18" viewBox="0 0 18 18"><rect x="3" y="4" width="12" height="2" fill="#555"/><rect x="5" y="8" width="8" height="2" fill="#555"/><rect x="4" y="12" width="10" height="2" fill="#555"/></svg>
        </button>
        <button type="button" title="Rechts ausrichten" style={{ padding: "6px 10px", borderRadius: 4, border: "none", background: "#e3e7ee", cursor: "pointer" }}
          onClick={() => format("justifyRight")}
        >
          <svg width="18" height="18" viewBox="0 0 18 18"><rect x="2" y="4" width="14" height="2" fill="#555"/><rect x="6" y="8" width="10" height="2" fill="#555"/><rect x="8" y="12" width="8" height="2" fill="#555"/></svg>
        </button>
        <button type="button" title="Blocksatz" style={{ padding: "6px 10px", borderRadius: 4, border: "none", background: "#e3e7ee", cursor: "pointer" }}
          onClick={() => format("justifyFull")}
        >
          <svg width="18" height="18" viewBox="0 0 18 18"><rect x="2" y="4" width="14" height="2" fill="#555"/><rect x="2" y="8" width="14" height="2" fill="#555"/><rect x="2" y="12" width="14" height="2" fill="#555"/></svg>
        </button>
        <span style={{ marginLeft: 12, fontSize: 14, color: "#555" }}>Farbe:</span>
        <div style={{ position: "relative", display: "inline-block" }}>
          <button
            type="button"
            title="Farbpalette öffnen"
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: "2px solid #333",
              background: fontColor,
              cursor: "pointer",
              marginRight: 2,
              outline: "none"
              }}
            onClick={() => setShowColorMenu(v => !v)}
          />
          {showColorMenu && (
            <div
              ref={colorMenuRef}
              style={{
                position: "absolute",
                top: 40,
                left: 0,
                zIndex: 10,
                background: "#fff",
                border: "1px solid #ccc",
                borderRadius: 8,
                boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                padding: 8,
                display: "grid",
                gridTemplateColumns: "repeat(6, 1fr)",
                gap: 6,
                minWidth: 220
              }}
            >
              {/* Schließen-Button oben rechts */}
              <button
                type="button"
                onClick={() => setShowColorMenu(false)}
                title="Farbauswahl schließen"
                style={{
                  position: "absolute",
                  top: 6,
                  right: 8,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 18,
                  color: "#888"
                }}
              >×</button>
              {/* Standardfarben */}
              {[
                "#222222", "#e53935", "#fb8c00", "#fdd835", "#43a047", "#1e88e5", "#3949ab", "#8e24aa", "#d81b60", "#795548", "#607d8b", "#ffffff", "#f5f5f5", "#cfd8dc", "#bdbdbd", "#757575"
              ].map((color) => (
                <button
                  key={color}
                  type="button"
                  title={color}
                  onClick={() => {
                    setFontColor(color);
                    format("foreColor", color);
                  }}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    border: fontColor === color ? "2px solid #333" : "1px solid #ccc",
                    background: color,
                    cursor: "pointer",
                    outline: "none"
                  }}
                />
              ))}
              {/* Eigene Farbe wählen */}
              <div style={{ gridColumn: 'span 6', marginTop: 8, textAlign: 'center' }}>
                <label style={{ fontSize: 13, color: '#555', marginRight: 8 }}>Eigene Farbe:</label>
                <input
                  type="color"
                  value={fontColor}
                  onChange={e => {
                    setFontColor(e.target.value);
                    format("foreColor", e.target.value);
                  }}
                  style={{ width: 32, height: 32, border: 'none', background: 'none', cursor: 'pointer', verticalAlign: 'middle' }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        ref={editorRef}
        id={contentEditableId}
        contentEditable
        dir="ltr"
        style={{
          minHeight: 48,
          fontSize: fontSize,
          fontFamily: 'Inter, Arial, sans-serif',
          border: '1px solid #e2e4e7',
          padding: 10,
          textAlign: 'left',
          outline: 'none',
          borderRadius: 6,
          background: '#fff',
          marginTop: 8,
          cursor: 'text'
        }}
        onInput={e => {
          onFormat((e.currentTarget as HTMLDivElement).innerHTML);
        }}
        onKeyDown={e => {
          if (e.key === 'Tab') {
            e.preventDefault();
            if (e.shiftKey) {
              format('outdent');
            } else {
              format('indent');
            }
          }
        }}
        suppressContentEditableWarning
        spellCheck={true}
      />

      {/* Vorschau-Textarea mit Sperre und Umschalt-Button */}
      <div style={{ position: 'relative', marginTop: 12 }}>
        <textarea
          value={blockData}
          readOnly={previewLocked}
          rows={1}
          onChange={e => {
            if (!previewLocked) {
              onFormat(e.target.value);
            }
          }}
          style={{
            width: '100%',
            resize: 'none',
            background: previewLocked ? '#f5f7fa' : '#fff',
            border: previewLocked ? 'none' : '1px solid #e2e4e7',
            borderRadius: 6,
            padding: '4px 8px',
            fontSize: 14,
            fontFamily: 'Inter, Arial, sans-serif',
            color: '#222',
            outline: 'none',
            cursor: previewLocked ? 'not-allowed' : 'text',
            opacity: previewLocked ? 0.85 : 1,
            minHeight: 28,
            maxHeight: 32
          }}
        />
        {/* Umschalt-Button für die Sperre */}
        <button
          type="button"
          onClick={() => setPreviewLocked(v => !v)}
          title={previewLocked ? "Sperre aufheben" : "Sperren"}
          style={{
            position: 'absolute',
            top: 10,
            right: 14,
            background: previewLocked ? 'rgba(255,255,255,0.7)' : '#43a047',
            borderRadius: '50%',
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            border: 'none',
            cursor: 'pointer',
            zIndex: 2
          }}
        >
          {previewLocked ? (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="8" stroke="#888" strokeWidth="2" fill="#fff" />
              <rect x="5" y="8" width="8" height="2" rx="1" fill="#888" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="8" stroke="#43a047" strokeWidth="2" fill="#fff" />
              <rect x="5" y="8" width="8" height="2" rx="1" fill="#43a047" />
              <rect x="8" y="5" width="2" height="8" rx="1" fill="#43a047" />
            </svg>
          )}
        </button>
      </div>
    </>
  );
}
