import React, { useRef, useState } from 'react';
import styles from '../admin/admin.module.css';

interface HtmlEditorProps {
  value: string;
  onChange: (html: string) => void;
  style?: React.CSSProperties;
  mode?: 'visual' | 'html' | 'text';
  label?: string;
}

const HtmlEditor: React.FC<HtmlEditorProps> = ({ value, onChange, style, mode = 'visual' }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [localMode, setLocalMode] = useState(mode);

  // Set initial HTML or text
  React.useEffect(() => {
    if (localMode === 'visual' && editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
    if ((localMode === 'html' || localMode === 'text') && textareaRef.current && textareaRef.current.value !== value) {
      textareaRef.current.value = value;
    }
  }, [value, localMode]);

  // Handle input changes for visual editor
  const handleVisualInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  // Handle input changes for textarea
  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  // Toolbar actions
  const format = (command: string) => {
    if (!editorRef.current) return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (!editorRef.current.contains(range.commonAncestorContainer)) return;
    let tag : string;
    if (command === 'bold') tag = 'b';
    else if (command === 'italic') tag = 'i';
    else if (command === 'underline') tag = 'u';
    if (!tag) return;
    const selectedText = range.toString();
    if (!selectedText) return;
    const el = document.createElement(tag);
    el.textContent = selectedText;
    range.deleteContents();
    range.insertNode(el);
    // Nach dem Einfügen die Selektion auf das neue Element setzen
    selection.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(el);
    selection.addRange(newRange);
    handleVisualInput();
  };

  // Mode switching
  const handleModeChange = (newMode: 'visual' | 'html' | 'text') => {
    if (newMode !== localMode) {
      setLocalMode(newMode);
    }
  };

  // Set initial mode from props
  React.useEffect(() => {
    setLocalMode(mode);
  }, [mode]);

  // Only show mode buttons if we're not in text mode
  const showModeSwitcher = mode !== 'text';

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        {localMode === 'visual' && (
          <>
            <button type="button" className={"" + (typeof styles !== 'undefined' ? styles.editorButton : '')} onClick={() => format('bold')}><b>B</b></button>
            <button type="button" className={"" + (typeof styles !== 'undefined' ? styles.editorButton : '')} onClick={() => format('italic')}><i>I</i></button>
            <button type="button" className={"" + (typeof styles !== 'undefined' ? styles.editorButton : '')} onClick={() => format('underline')}><u>U</u></button>
            {/* Nicht unterstützte Kommandos entfernt, da die Funktion format nur ein Argument erwartet */}
          </>
        )}

        {showModeSwitcher && (
          <div style={{ float: 'right' }}>
            <button 
              type="button" 
              onClick={() => handleModeChange('visual')} 
              style={{ background: localMode === 'visual' ? '#e0eaff' : '#fff', marginRight: 4 }}
            >
              Visuell
            </button>
            <button 
              type="button" 
              onClick={() => handleModeChange('html')} 
              style={{ background: localMode === 'html' ? '#e0eaff' : '#fff' }}
            >
              HTML
            </button>
          </div>
        )}
      </div>

      {localMode === 'visual' && (
        <div
          ref={editorRef}
          contentEditable
          style={{ border: '1px solid #ccc', borderRadius: 6, minHeight: 120, padding: 8, background: '#fff', ...style }}
          onInput={handleVisualInput}
          suppressContentEditableWarning
        />
      )}

      {(localMode === 'html' || localMode === 'text') && (
        <textarea
          ref={textareaRef}
          defaultValue={value}
          onChange={handleTextareaInput}
          style={{ 
            width: '100%', 
            minHeight: localMode === 'text' ? 120 : 250, 
            border: '1px solid #ccc', 
            borderRadius: 6, 
            padding: 8, 
            fontFamily: 'monospace', 
            fontSize: 14,
            ...style 
          }}
        />
      )}
    </div>
  );
};

export default HtmlEditor;
