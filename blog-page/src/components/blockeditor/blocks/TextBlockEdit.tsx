// Robuste HTML-Sanitize-Funktion zur XSS-Prävention
function sanitizeHtml(html: string): string {
  // Nutzung des DOM-Parsers für zuverlässigere Sanitization
  const doc = new DOMParser().parseFromString('<div>' + html + '</div>', 'text/html');
  const container = doc.body.firstChild as HTMLElement;
  
  // Liste erlaubter Tags
  const allowedTags = ['P', 'B', 'STRONG', 'I', 'EM', 'UL', 'OL', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'A', 'BR', 'BLOCKQUOTE', 'PRE', 'SPAN', 'DIV'];
  // Liste erlaubter Attribute (globale und tag-spezifische)
  const allowedAttributes = {
    'ALL': ['style', 'class', 'id', 'title'],
    'A': ['href', 'target', 'rel']
  };
  
  // Rekursive Funktion zum Bereinigen von DOM-Elementen
  function cleanNode(node: Node): Node | null {
    // Text-Knoten sind sicher
    if (node.nodeType === Node.TEXT_NODE) {
      return node;
    }
    
    // Kommentare entfernen
    if (node.nodeType === Node.COMMENT_NODE) {
      return null;
    }
    
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      const tagName = element.tagName;
      
      // Nicht erlaubte Tags entfernen
      if (!allowedTags.includes(tagName)) {
        // Nur den Textinhalt behalten
        const text = document.createTextNode(element.textContent || '');
        return text;
      }
      
      // Alle Attribute entfernen, die nicht erlaubt sind
      for (let i = element.attributes.length - 1; i >= 0; i--) {
        const attr = element.attributes[i];
        const attrName = attr.name.toLowerCase();
        
        // Prüfen, ob das Attribut global oder tag-spezifisch erlaubt ist
        const isAllowed = 
          (allowedAttributes['ALL'] && allowedAttributes['ALL'].includes(attrName)) ||
          (allowedAttributes[tagName] && allowedAttributes[tagName].includes(attrName));
        
        if (!isAllowed) {
          element.removeAttribute(attrName);
        }
        
        // Spezielle Behandlung für href-Attribut bei Links
        if (tagName === 'A' && attrName === 'href') {
          const href = attr.value.trim().toLowerCase();
          
          // Prüfen, ob es sich um eine sichere URL handelt
          if (!href.startsWith('http://') && !href.startsWith('https://')) {
            element.removeAttribute('href');
          }
          
          // rel="noopener noreferrer" für externe Links hinzufügen
          if (element.hasAttribute('target') && element.getAttribute('target') === '_blank') {
            element.setAttribute('rel', 'noopener noreferrer');
          }
        }
        
        // Entfernung von Javascript in style-Attributen
        if (attrName === 'style') {
          const style = attr.value;
          if (style.includes('javascript:') || style.includes('expression(') || style.includes('url(')) {
            element.removeAttribute('style');
          }
        }
      }
      
      // Rekursiv alle Kindelemente bereinigen
      for (let i = element.childNodes.length - 1; i >= 0; i--) {
        const child = element.childNodes[i];
        const cleanedChild = cleanNode(child);
        
        if (!cleanedChild) {
          element.removeChild(child);
        } else if (cleanedChild !== child) {
          element.replaceChild(cleanedChild, child);
        }
      }
      
      return element;
    }
    
    return null;
  }
  
  // Alle Knoten bereinigen
  for (let i = container.childNodes.length - 1; i >= 0; i--) {
    const child = container.childNodes[i];
    const cleanedChild = cleanNode(child);
    
    if (!cleanedChild) {
      container.removeChild(child);
    } else if (cleanedChild !== child) {
      container.replaceChild(cleanedChild, child);
    }
  }
  
  return container.innerHTML;
}
import React, { useRef, useEffect, useState } from 'react';
import styles from '../BlockEditor.module.css';

const colorOptions = [
  { name: 'Standard', value: '' },
  { name: 'Rot', value: '#e53935' },
  { name: 'Orange', value: '#fb8c00' },
  { name: 'Gelb', value: '#fbc02d' },
  { name: 'Grün', value: '#43a047' },
  { name: 'Blau', value: '#1976d2' },
  { name: 'Lila', value: '#8e24aa' },
  { name: 'Grau', value: '#607d8b' },
];

function promptForLink(): string | null {
  // eslint-disable-next-line no-alert
  return window.prompt('Link-URL eingeben:', 'https://');
}

// Funktion zum Umwandeln von Markdown zu HTML
function convertMarkdownToHtml(markdown: string): string {
  // Einfache Markdown-zu-HTML-Konvertierung
  let html = markdown;
  
  // Überschriften
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  
  // Fett und kursiv
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  
  // Listen
  // Ungeordnete Listen
  html = html.replace(/^\s*[-*] (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.+<\/li>\n)+/g, '<ul>$&</ul>');
  
  // Geordnete Listen
  html = html.replace(/^\s*(\d+)\. (.+)$/gm, '<li>$2</li>');
  html = html.replace(/(<li>.+<\/li>\n)+/g, '<ol>$&</ol>');
  
  // Absätze
  html = html.replace(/^(?!<[uo]l>|<li>|<h[1-6]>)(.+)$/gm, '<p>$1</p>');
  
  return html;
}

export default function TextBlockEdit({ block, onChange }: any) {
  // KI-Limit-Prüfung und Modal-Logik
  // ...States und Refs werden weiter unten deklariert (nur einmal pro Komponente!)

  // Öffnet das Modal nur, wenn das Limit nicht erreicht ist (Datenbankprüfung)
  async function handleOpenAiModal() {
    setAiError(null);
    setShowAiModal(false);
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai-auth');
      const data = await res.json();
      if (data.includedRequests === null || data.includedRequests === 0) {
        setAiError('KI-Kontingent aufgebraucht\nDu hast dein monatliches KI-Kontingent verbraucht.\nFür mehr Anfragen kontaktiere bitte den Support oder buche ein Upgrade.');
        setAiLoading(false);
        return;
      }
      setShowAiModal(true);
    } catch {
      setAiError('Fehler beim Prüfen des Limits');
    }
    setAiLoading(false);
  }
  // Fehler-Popup für KI-Limit
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [promptType, setPromptType] = useState<'text' | 'title' | 'description'>('text');
  const [useFormatting, setUseFormatting] = useState(true);
  const [aiResult, setAiResult] = useState("");
  const [showAiResult, setShowAiResult] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [showColor, setShowColor] = useState(false);

  // Funktion zum Scannen aller verfügbaren Textblöcke im Dokument
  async function scanBlocksForContent() {
    try {
      // Holen aller Textblöcke aus dem DOM
      const blockElements = document.querySelectorAll('.blockInput');
      const textContents: string[] = [];
      
      // Extrahiere Text aus allen gefundenen Blöcken
      blockElements.forEach(element => {
        const text = element.textContent?.trim();
        if (text) {
          textContents.push(text);
        }
      });
      
      if (textContents.length === 0) {
        // Wenn keine Textblöcke gefunden wurden, den aktuellen Block verwenden
        const currentText = ref.current?.textContent?.trim() || '';
        if (currentText) {
          textContents.push(currentText);
        }
      }
      
      return textContents.join('\n\n');
    } catch (err) {
      console.error('Fehler beim Scannen der Blöcke:', err);
      return '';
    }
  }
  
  // Vorschläge basierend auf dem Prompt-Typ
  function getPromptSuggestions(type: 'text' | 'title' | 'description'): string[] {
    switch (type) {
      case 'title':
        return [
          'Erstelle einen prägnanten Titel basierend auf dem Inhalt',
          'Automatisch (Analysiere alle Textblöcke)',
          'Erstelle einen SEO-optimierten Titel für den Blog',
          'Formuliere einen kreativen Titel für den Inhalt',
          'Generiere einen Titel, der neugierig macht'
        ];
      case 'description':
        return [
          'Fasse den Inhalt in 2-3 Sätzen zusammen',
          'Automatisch (Analysiere alle Textblöcke)',
          'Erstelle eine SEO-freundliche Beschreibung',
          'Schreibe eine Einleitung für den Blog',
          'Formuliere eine kurze, ansprechende Zusammenfassung'
        ];
      case 'text':
      default:
        return useFormatting ? [
          'Schreibe einen strukturierten Text mit Überschriften und Listen',
          'Erstelle einen Abschnitt mit Aufzählungspunkten zu den Vorteilen',
          'Verfasse ein Fazit mit wichtigen Punkten in Fettschrift',
          'Erkläre das Thema mit Hervorhebungen und Aufzählungen',
          'Erstelle eine Schritt-für-Schritt-Anleitung mit nummerierten Listen'
        ] : [
          'Schreibe einen Einleitungstext über dieses Thema',
          'Erstelle einen Abschnitt über die Vorteile',
          'Verfasse ein Fazit zum Thema',
          'Schreibe einen informativen Absatz zum Thema',
          'Erstelle einen erklärenden Text für Anfänger'
        ];
    }
  }

  // Setze initialen Wert beim Öffnen
  useEffect(() => {
    if (ref.current && block.data !== ref.current.innerHTML) {
      // snyk:disable:SNYK-JS-DOMXSS-531382
      ref.current.innerHTML = sanitizeHtml(block.data || '');
      // snyk:enable:SNYK-JS-DOMXSS-531382
    }
  }, [block.data]);

  // Toolbar-Handler
  function exec(command: string, value?: string) {
    document.execCommand(command, false, value);
    // Nach Formatierung neuen Wert speichern
    if (ref.current) {
      onChange(ref.current.innerHTML);
    }
  }

  function handleLink() {
    const url = promptForLink();
    if (url) exec('createLink', url);
  }

  function handleUnlink() {
    exec('unlink');
  }


  function handleColor(value: string, close = true) {
    exec('foreColor', value);
    if (close) setShowColor(false);
  }

  function handleHeading(level: number) {
    exec('formatBlock', 'H' + level);
  }

  function handleBlockquote() {
    exec('formatBlock', 'BLOCKQUOTE');
  }

  function handleCode() {
    exec('formatBlock', 'PRE');
  }

  function handleAlign(align: string) {
    exec('justify' + align);
  }

  function handleList(type: 'ordered' | 'unordered') {
    exec(type === 'ordered' ? 'insertOrderedList' : 'insertUnorderedList');
  }

  function handleUndo() {
    exec('undo');
  }

  function handleRedo() {
    exec('redo');
  }

  return (
    <div>
      {/* Fehler-Overlay, wenn nicht berechtigt */}
      {aiError && !showAiModal && (
        <div style={{ position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', background: 'rgba(30,40,60,0.25)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 4px 24px rgba(30,40,60,0.18)', padding: 28, minWidth: 340, maxWidth: 420 }}>
            <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 10, color: 'rgb(25, 118, 210)' }}>KI-Text generieren</div>
            <div style={{ color: '#e53935', fontWeight: 500, fontSize: 16, marginBottom: 12, whiteSpace: 'pre-line' }}>{aiError}</div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setAiError(null)}
                style={{ background: '#1976d2', color: '#fff', fontWeight: 600, fontSize: 15, borderRadius: 8, padding: '8px 22px', border: 'none', cursor: 'pointer' }}
              >Schließen</button>
            </div>
          </div>
        </div>
      )}
      <div style={{ marginBottom: 16 }}>
        <button
          type="button"
          disabled={aiLoading}
          onClick={handleOpenAiModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'linear-gradient(90deg, #7f53ac 0%, #647dee 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            padding: '10px 22px',
            fontWeight: 700,
            fontSize: 16,
            boxShadow: '0 2px 12px 0 rgba(100,125,222,0.13)',
            cursor: aiLoading ? 'not-allowed' : 'pointer',
            marginBottom: 4,
            marginRight: 8,
            letterSpacing: 0.2,
            transition: 'box-shadow 0.2s, transform 0.2s',
            outline: 'none',
            filter: aiLoading ? 'grayscale(0.5)' : 'none',
          }}
          onMouseOver={e => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 24px 0 rgba(100,125,222,0.22)';
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px) scale(1.03)';
          }}
          onMouseOut={e => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 12px 0 rgba(100,125,222,0.13)';
            (e.currentTarget as HTMLButtonElement).style.transform = 'none';
          }}
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2.5" y="2.5" width="17" height="17" rx="6" fill="#fff" fillOpacity="0.13"/>
            <path d="M11 6.5v3m0 3v3m-3-3h6" stroke="#fff" strokeWidth="1.7" strokeLinecap="round"/>
            <circle cx="11" cy="11" r="8" stroke="#fff" strokeWidth="1.2" opacity="0.5"/>
          </svg>
          KI-Text generieren
        </button>
      </div>
      {/* Fehler-Modal wird exklusiv oben angezeigt, daher hier entfernt */}
      {showAiModal && (
        <div style={{
          position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', background: 'rgba(30,40,60,0.25)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 4px 24px rgba(30,40,60,0.18)', padding: 28, minWidth: 340, maxWidth: 420 }}>
            <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 10, color: '#1976d2' }}>KI-Text generieren</div>
            <div style={{ marginBottom: 12, color: '#444' }}>Beschreibe, was die KI schreiben soll:</div>
            <div style={{ marginBottom: 12 }}>
              <select 
                value={promptType}
                onChange={e => setPromptType(e.target.value as 'text' | 'title' | 'description')}
                style={{ 
                  width: '100%', 
                  padding: '8px 12px', 
                  borderRadius: 6, 
                  border: '1.5px solid #d0d7de', 
                  fontSize: 15, 
                  marginBottom: 10,
                  color: '#444'
                }}
              >
                <option value="text">Normaler Text</option>
                <option value="title">Titel generieren</option>
                <option value="description">Beschreibung generieren</option>
              </select>
              
              {promptType === 'text' && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#555', marginBottom: 10, cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={useFormatting}
                    onChange={e => setUseFormatting(e.target.checked)} 
                    style={{ cursor: 'pointer' }}
                  />
                  Mit Formatierung (fett, kursiv, Listen, etc.) generieren
                </label>
              )}
            </div>
            <textarea
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              rows={4}
              style={{ width: '100%', borderRadius: 6, border: '1.5px solid #d0d7de', padding: 8, fontSize: 15, marginBottom: 8, resize: 'vertical' }}
              placeholder={
                promptType === 'title' 
                  ? "z.B. Erstelle einen prägnanten Titel für meinen Blog über KI"
                  : promptType === 'description'
                    ? "z.B. Fasse den Inhalt kurz und ansprechend zusammen"
                    : useFormatting 
                      ? "z.B. Schreibe einen Einleitungstext über KI mit Überschriften, Listen und Hervorhebungen"
                      : "z.B. Schreibe einen Einleitungstext über KI"
              }
              disabled={aiLoading}
              autoFocus
            />
            
            {/* Vorschläge für Prompts */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 5 }}>Vorschläge:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {getPromptSuggestions(promptType).map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setAiPrompt(suggestion)}
                    style={{
                      fontSize: 12,
                      background: '#f5f7fa',
                      border: '1px solid #d0d7de',
                      borderRadius: 12,
                      padding: '4px 10px',
                      cursor: 'pointer',
                      color: '#444',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={e => {
                      e.currentTarget.style.background = '#e3e9f3';
                      e.currentTarget.style.borderColor = '#b6c7e6';
                    }}
                    onMouseOut={e => {
                      e.currentTarget.style.background = '#f5f7fa';
                      e.currentTarget.style.borderColor = '#d0d7de';
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
            {/* Fehleranzeige im Modal */}
            {aiError && (
              <div style={{ color: '#e53935', fontWeight: 500, fontSize: 15, marginBottom: 10 }}>{aiError}</div>
            )}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowAiModal(false);
                  setAiError(null);
                }}
                disabled={aiLoading}
                style={{ background: '#eee', color: '#444', fontWeight: 600, fontSize: 15, borderRadius: 8, padding: '8px 22px', border: 'none', cursor: aiLoading ? 'not-allowed' : 'pointer' }}
              >Abbrechen</button>
              <button
                onClick={async () => {
                  if (!aiPrompt.trim()) return;
                  setAiLoading(true);
                  setAiError(null);
                  try {
                    // Verwende den ausgewählten Prompt-Typ
                    const mode = promptType;
                    
                    // Füge den formatting-Parameter hinzu, wenn diese Option aktiviert ist
                    const payload = { 
                      text: aiPrompt,
                      mode: mode,
                      formatting: useFormatting
                    };
                    
                    // Bei Title/Description ohne speziellen Prompt scannen wir die Blöcke
                    if ((mode === 'title' || mode === 'description') && 
                        (aiPrompt.includes('aus den Blöcken') || 
                         aiPrompt.includes('aus dem Inhalt') || 
                         aiPrompt.includes('analysiere die Blöcke') ||
                         aiPrompt.toLowerCase() === 'automatisch' ||
                         aiPrompt.trim().length < 10)) {
                      
                      const blocksContent = await scanBlocksForContent();
                      if (blocksContent) {
                        // Wenn wir Inhalt gefunden haben, diesen als Kontext senden
                        payload.text = blocksContent;
                      }
                    }
                    
                    const res = await fetch('/api/ai-generate', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(payload),
                    });
                    const data = await res.json();
                    if (res.ok && data.result) {
                      // Unterschiedliche Behandlung je nach Prompt-Typ
                      if (mode === 'text') {
                        // Bei normalem Text fügen wir das Ergebnis in den aktuellen Block ein
                        if (ref.current) {
                          // Füge das Ergebnis am Ende des aktuellen Inhalts ein oder ersetze ihn
                          const currentContent = ref.current.innerHTML || '';
                          const appendContent = currentContent.trim().length > 0;
                          
                          // Überprüfe, ob der generierte Text HTML-Formatierungen enthält
                          const hasHtmlFormatting = data.result.includes('<') && data.result.includes('>');
                          
                          if (appendContent) {
                            // Füge nach einem Absatz ein
                            if (hasHtmlFormatting) {
                              // Bei HTML-formatiertem Text direkt einfügen
                              // snyk:disable:SNYK-JS-DOMXSS-531382
                              // file deepcode ignore DOMXSS: <please specify a reason of ignoring this>
                              ref.current.innerHTML = sanitizeHtml(currentContent + (currentContent.endsWith('</p>') ? '' : '<p>') + data.result); 
                              // snyk:enable:SNYK-JS-DOMXSS-531382
                            } else {
                              // Bei normalem Text in Absätze verpacken und Markdown konvertieren
                              const formattedResult = convertMarkdownToHtml(data.result);
                              // snyk:disable:SNYK-JS-DOMXSS-531382
                              ref.current.innerHTML = sanitizeHtml(currentContent + (currentContent.endsWith('</p>') ? '' : '<p>') + formattedResult);
                              // snyk:enable:SNYK-JS-DOMXSS-531382
                            }
                          } else {
                            // Ersetze den Inhalt
                            if (hasHtmlFormatting) {
                              // Bei HTML-formatiertem Text direkt übernehmen
                              // snyk:disable:SNYK-JS-DOMXSS-531382
                              ref.current.innerHTML = sanitizeHtml(data.result);
                              // snyk:enable:SNYK-JS-DOMXSS-531382
                            } else {
                              // Bei normalem Text in Absätze verpacken und Markdown konvertieren
                              const formattedResult = convertMarkdownToHtml(data.result);
                              // snyk:disable:SNYK-JS-DOMXSS-531382
                              ref.current.innerHTML = sanitizeHtml(formattedResult);
                              // snyk:enable:SNYK-JS-DOMXSS-531382
                            }
                          }
                          
                          onChange(ref.current.innerHTML);
                        }
                      } else {
                        // Bei Titel oder Beschreibung zeigen wir das Ergebnis als Vorschau an
                        // und bieten die Möglichkeit, es zu kopieren oder einzufügen
                        setAiResult(data.result);
                        setShowAiResult(true);
                        setAiLoading(false);
                        return;
                      }
                      
                      setShowAiModal(false);
                      setAiPrompt("");
                      window.dispatchEvent(new Event("reload-notifications"));
                    } else {
                      setAiError(data?.error || data?.reason || 'Unbekannter Fehler beim KI-Request');
                    }
                  } catch (e) {
                    setAiError('Netzwerkfehler beim KI-Request');
                  }
                  setAiLoading(false);
                }}
                disabled={aiLoading || !aiPrompt.trim()}
                style={{ background: '#1976d2', color: '#fff', fontWeight: 600, fontSize: 15, borderRadius: 8, padding: '8px 22px', border: 'none', cursor: aiLoading || !aiPrompt.trim() ? 'not-allowed' : 'pointer' }}
              >{aiLoading ? 'KI generiert...' : 'KI-Text einfügen'}</button>
            </div>
          </div>
        </div>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8, alignItems: 'center' }}>
        <button type="button" title="Fett" onMouseDown={e => { e.preventDefault(); exec('bold'); }} style={{ padding: 0, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 5h5a3 3 0 010 6H7zm0 6h6a3 3 0 010 6H7z" stroke="#1976d2" strokeWidth="1.7" fill="none"/>
          </svg>
        </button>
        <button type="button" title="Kursiv" onMouseDown={e => { e.preventDefault(); exec('italic'); }} style={{ padding: 0, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 5h-5l-3 12h5" stroke="#1976d2" strokeWidth="1.7" fill="none"/>
          </svg>
        </button>
        <button type="button" title="Unterstrichen" onMouseDown={e => { e.preventDefault(); exec('underline'); }} style={{ padding: 0, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 5v5a4 4 0 008 0V5" stroke="#1976d2" strokeWidth="1.7" fill="none"/>
            <line x1="6" y1="17" x2="16" y2="17" stroke="#1976d2" strokeWidth="1.7"/>
          </svg>
        </button>
        <button type="button" title="Überschrift 1" onMouseDown={e => { e.preventDefault(); handleHeading(1); }} style={{ padding: 0, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <text x="4" y="16" fontSize="13" fontFamily="Arial" fontWeight="bold" fill="#1976d2">H</text>
            <text x="13" y="16" fontSize="13" fontFamily="Arial" fontWeight="bold" fill="#1976d2">1</text>
          </svg>
        </button>
        <button type="button" title="Überschrift 2" onMouseDown={e => { e.preventDefault(); handleHeading(2); }} style={{ padding: 0, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <text x="4" y="16" fontSize="13" fontFamily="Arial" fontWeight="bold" fill="#1976d2">H</text>
            <text x="13" y="16" fontSize="13" fontFamily="Arial" fontWeight="bold" fill="#1976d2">2</text>
          </svg>
        </button>
        {/* Zitat-Button entfernt, Zitat nur noch als eigener Blocktyp */}
        {/* Codeblock-Button entfernt, Code nur noch als eigener Blocktyp */}
        <button type="button" title="Nummerierte Liste" onMouseDown={e => { e.preventDefault(); handleList('ordered'); }} style={{ padding: 0, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="7" y="5" width="11" height="2" rx="1" fill="#1976d2"/>
            <rect x="7" y="10" width="11" height="2" rx="1" fill="#1976d2"/>
            <rect x="7" y="15" width="11" height="2" rx="1" fill="#1976d2"/>
            <text x="2.5" y="7.5" fontSize="6" fill="#1976d2" fontFamily="Arial">1</text>
            <text x="2.5" y="12.5" fontSize="6" fill="#1976d2" fontFamily="Arial">2</text>
            <text x="2.5" y="17.5" fontSize="6" fill="#1976d2" fontFamily="Arial">3</text>
          </svg>
        </button>
        <button type="button" title="Aufzählung" onMouseDown={e => { e.preventDefault(); handleList('unordered'); }} style={{ padding: 0, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="4" cy="6" r="1.5" fill="#1976d2"/>
            <circle cx="4" cy="11" r="1.5" fill="#1976d2"/>
            <circle cx="4" cy="16" r="1.5" fill="#1976d2"/>
            <rect x="7" y="5" width="11" height="2" rx="1" fill="#1976d2"/>
            <rect x="7" y="10" width="11" height="2" rx="1" fill="#1976d2"/>
            <rect x="7" y="15" width="11" height="2" rx="1" fill="#1976d2"/>
          </svg>
        </button>
        <button type="button" title="Link einfügen" onMouseDown={e => { e.preventDefault(); handleLink(); }} style={{ padding: 0, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7.5 11a3.5 3.5 0 013.5-3.5h2a3.5 3.5 0 110 7h-2" stroke="#1976d2" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14.5 11a3.5 3.5 0 00-3.5-3.5h-2a3.5 3.5 0 100 7h2" stroke="#1976d2" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button type="button" title="Link entfernen" onMouseDown={e => { e.preventDefault(); handleUnlink(); }} style={{ padding: 0, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7.5 11a3.5 3.5 0 013.5-3.5h2a3.5 3.5 0 110 7h-2" stroke="#1976d2" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8.5 13.5l5-5" stroke="#e53935" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        </button>
        <div style={{ position: 'relative' }}>
          <select
            title="Ausrichtung"
            className={styles.richTextAlignSelect}
            style={{ minWidth: 36, minHeight: 36, borderRadius: 6, border: '1.5px solid #e3e7ee', background: '#f5f7fa', color: '#1976d2', fontSize: '1em', cursor: 'pointer', padding: '7px 10px', marginRight: 4 }}
            defaultValue=""
            onChange={e => {
              const val = e.target.value;
              if (val) handleAlign(val);
            }}
            onMouseDown={e => e.stopPropagation()}
          >
            <option value="" disabled>Ausrichtung</option>
            <option value="Left">🔳 Links</option>
            <option value="Center">🟦 Zentriert</option>
            <option value="Right">🟩 Rechts</option>
            <option value="Full">🟫 Blocksatz</option>
          </select>
        </div>
        <button type="button" title="Rückgängig" onMouseDown={e => { e.preventDefault(); handleUndo(); }} style={{ padding: 0, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 11H17a4 4 0 0 1 0 8H7" stroke="#1976d2" strokeWidth="1.7" fill="none"/>
            <polyline points="7,15 3,11 7,7" stroke="#1976d2" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button type="button" title="Wiederholen" onMouseDown={e => { e.preventDefault(); handleRedo(); }} style={{ padding: 0, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 11H5a4 4 0 0 0 0 8h10" stroke="#1976d2" strokeWidth="1.7" fill="none"/>
            <polyline points="15,15 19,11 15,7" stroke="#1976d2" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div style={{ position: 'relative' }}>
          <button type="button" title="Textfarbe" onMouseDown={e => { e.preventDefault(); setShowColor(v => !v); }} style={{ padding: 0, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="15" width="14" height="3" rx="1.5" fill="#1976d2"/>
              <path d="M7 15L11 5L15 15" stroke="#1976d2" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="11" cy="8" r="1.2" fill="#1976d2"/>
            </svg>
          </button>
          {showColor && (
            <div style={{ position: 'absolute', top: 28, left: 0, background: '#fff', border: '1px solid #ccc', borderRadius: 4, padding: 6, zIndex: 10, display: 'flex', gap: 4, alignItems: 'center' }}>
              {colorOptions.map(opt => (
                <button key={opt.value} title={opt.name} style={{ background: opt.value || '#fff', width: 22, height: 22, border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer' }} onMouseDown={e => { e.preventDefault(); handleColor(opt.value, true); }} />
              ))}
              <input
                type="color"
                title="Eigene Farbe wählen"
                style={{ width: 28, height: 28, border: 'none', background: 'none', cursor: 'pointer', marginLeft: 6 }}
                onChange={e => handleColor(e.target.value, false)}
              />
            </div>
          )}
        </div>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        className={styles.blockInput}
        style={{ minHeight: 40, outline: 'none', whiteSpace: 'pre-wrap', wordBreak: 'break-word', border: '1.5px solid #d0d7de', borderRadius: 6, padding: 8, background: '#fff' }}
        onInput={e => {
          const html = (e.target as HTMLDivElement).innerHTML;
          onChange(html);
        }}
        onBlur={e => {
          // Beim Verlassen Wert speichern
          const html = ref.current ? ref.current.innerHTML : '';
          onChange(html);
        }}
        onKeyDown={e => {
          if (e.key === 'Tab') {
            e.preventDefault();
            // Prüfe, ob Cursor in einer Liste steht
            const sel = window.getSelection();
            if (!sel || sel.rangeCount === 0) return;
            let node = sel.anchorNode as HTMLElement | null;
            while (node && node.nodeType !== 1) node = node.parentElement;
            let inList = false;
            let liNode = null;
            let parent = node;
            while (parent) {
              if (parent.nodeName === 'LI') liNode = parent;
              if (parent.nodeName === 'UL' || parent.nodeName === 'OL') { inList = true; break; }
              parent = parent.parentElement;
            }
            if (inList && liNode) {
              if (e.shiftKey) {
                document.execCommand('outdent');
              } else {
                document.execCommand('indent');
              }
              // Nach Indent/Outdent neuen Wert speichern
              if (ref.current) onChange(ref.current.innerHTML);
            }
          }
        }}
      />
    </div>
  );
}
