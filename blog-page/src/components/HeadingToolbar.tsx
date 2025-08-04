import React from "react";

interface HeadingToolbarProps {
  blockData: string;
  onFormat: (newValue: string) => void;
  textareaId: string;
}

export const HeadingToolbar: React.FC<HeadingToolbarProps> = ({ blockData, onFormat, textareaId }) => {
  // Beispiel: Formatierung für Überschriften (z.B. H2, H3)
  const format = (level: 2 | 3) => {
    const textarea = document.getElementById(textareaId) as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = blockData.substring(start, end);
    let newValue = blockData;
    if (level === 2) {
      newValue = `## ${selected || "Überschrift"}`;
    } else {
      newValue = `### ${selected || "Unterüberschrift"}`;
    }
    onFormat(newValue);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newValue.length, newValue.length);
    }, 0);
  };

  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
      <button type="button" title="H2" style={{ fontWeight: "bold", padding: "2px 8px", borderRadius: 4, border: "1px solid #eee", background: "#fafafa", cursor: "pointer" }}
        onClick={() => format(2)}
      >H2</button>
      <button type="button" title="H3" style={{ fontWeight: "bold", padding: "2px 8px", borderRadius: 4, border: "1px solid #eee", background: "#fafafa", cursor: "pointer" }}
        onClick={() => format(3)}
      >H3</button>
    </div>
  );
}
