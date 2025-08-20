import React from "react";

interface ImageToolbarProps {
  onFormat: (newValue: string) => void;
  inputId: string;
}

export const ImageToolbar: React.FC<ImageToolbarProps> = ({ onFormat, inputId }) => {
  // Beispiel: Bild-URL validieren oder manipulieren
  const handlePasteDemo = () => {
    onFormat("https://via.placeholder.com/400x200.png?text=Demo+Bild");
    setTimeout(() => {
      const input = document.getElementById(inputId) as HTMLInputElement;
      if (input) input.focus();
    }, 0);
  };

  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
      <button type="button" title="Demo-Bild einfügen" style={{ padding: "2px 8px", borderRadius: 4, border: "1px solid #eee", background: "#fafafa", cursor: "pointer" }}
        onClick={handlePasteDemo}
      >Demo-Bild</button>
    </div>
  );
}
