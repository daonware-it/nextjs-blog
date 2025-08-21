import React, { useEffect, useState } from 'react';

const TEMPLATE_TYPES = [
  { value: 'verification', label: 'Verifizierungs-E-Mail' },
  { value: 'password-reset', label: 'Passwort-Reset-E-Mail' },
];

export default function AdminEmailTemplateEditor() {
  const [type, setType] = useState(TEMPLATE_TYPES[0].value);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Baukasten-Felder
  const [subject, setSubject] = useState('');
  const [greeting, setGreeting] = useState('');
  const [maintext, setMaintext] = useState('');
  const [buttontext, setButtontext] = useState('');
  const [design, setDesign] = useState('modern');

  // KI-Template
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiTemplate, setAiTemplate] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');

  // State für eigenen Prompt
  const [customPrompt, setCustomPrompt] = useState('');

  // Fragenkatalog (Wizard)
  const wizardQuestions = [
    { key: 'subject', question: 'Wie soll die E-Mail heißen?' },
    { key: 'greeting', question: 'Wie lautet die Begrüßung?' },
    { key: 'maintext', question: 'Was ist die Hauptbotschaft?' },
    { key: 'buttontext', question: 'Welcher Button-Text?' },
    { key: 'design', question: 'Welches Design?', type: 'select', options: ['modern', 'klassisch', 'minimal', 'business'] }
  ];
  const [wizardStep, setWizardStep] = useState(0);
  const [wizardAnswers, setWizardAnswers] = useState({ subject: '', greeting: '', maintext: '', buttontext: '', design: 'modern' });
  const [wizardActive, setWizardActive] = useState(false);
  const [wizardAiLoading, setWizardAiLoading] = useState(false);
  const [wizardAiError, setWizardAiError] = useState('');
  const [wizardAiTemplate, setWizardAiTemplate] = useState('');
  const [wizardAiPrompt, setWizardAiPrompt] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/email-template?type=${type}`)
      .then(res => res.json())
      .then(data => {
        setContent(data.content || '');
        setLoading(false);
      })
      .catch(() => {
        setError('Fehler beim Laden des Templates');
        setLoading(false);
      });
  }, [type]);

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);
    const res = await fetch(`/api/admin/email-template?type=${type}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (res.ok) {
      setSuccess(true);
    } else {
      setError('Fehler beim Speichern');
    }
    setLoading(false);
  };

  // Baukasten-Template generieren
  const getBaukastenTemplate = () => {
    if (design === 'modern') {
      return `<!DOCTYPE html><html lang=\"de\"><head><meta charset=\"UTF-8\"><title>${subject}</title><style>body{background:#f7f7f7;} .container{background:#fff;padding:32px;border-radius:12px;max-width:500px;margin:40px auto;box-shadow:0 2px 12px rgba(0,0,0,0.07);} .button{font-size:18px;font-weight:700;color:#fff;background:#1976d2;padding:14px 32px;border-radius:6px;text-decoration:none;display:inline-block;} .footer{margin-top:32px;font-size:0.9em;color:#888;}</style></head><body><div class=\"container\"><h2 style=\"color:#1976d2\">${subject}</h2><p>${greeting}<br>${maintext.replace(/\n/g, '<br>')}</p><a href=\"{{resetLink}}\" class=\"button\">${buttontext}</a><div class=\"footer\">Dein Support-Team</div></div></body></html>`;
    }
    if (design === 'klassisch') {
      return `<!DOCTYPE html><html lang=\"de\"><head><meta charset=\"UTF-8\"><title>${subject}</title><style>body{background:#fff;} .container{border:1px solid #eaeaea;padding:32px;max-width:500px;margin:40px auto;font-family:Times New Roman,serif;} .button{font-size:16px;font-weight:700;color:#fff;background:#333;padding:10px 24px;border-radius:4px;text-decoration:none;display:inline-block;} .footer{margin-top:32px;font-size:0.9em;color:#888;}</style></head><body><div class=\"container\"><h2 style=\"color:#333\">${subject}</h2><p>${greeting}<br>${maintext.replace(/\n/g, '<br>')}</p><a href=\"{{resetLink}}\" class=\"button\">${buttontext}</a><div class=\"footer\">Mit freundlichen Grüßen<br>Ihr Team</div></div></body></html>`;
    }
    if (design === 'minimal') {
      return `<!DOCTYPE html><html lang=\"de\"><head><meta charset=\"UTF-8\"><title>${subject}</title><style>body{background:#fafafa;} .container{padding:24px;max-width:400px;margin:40px auto;border-radius:8px;border:1px solid #eee;} .button{font-size:15px;color:#fff;background:#444;padding:10px 20px;border-radius:4px;text-decoration:none;display:inline-block;} .footer{margin-top:24px;font-size:0.85em;color:#aaa;}</style></head><body><div class=\"container\"><h3>${subject}</h3><p>${greeting}<br>${maintext.replace(/\n/g, '<br>')}</p><a href=\"{{resetLink}}\" class=\"button\">${buttontext}</a><div class=\"footer\">Support</div></div></body></html>`;
    }
    if (design === 'business') {
      return `<!DOCTYPE html><html lang=\"de\"><head><meta charset=\"UTF-8\"><title>${subject}</title><style>body{background:#f4f6f8;} .container{background:#fff;padding:40px;max-width:600px;margin:40px auto;border-radius:10px;border:1px solid #d1d5db;font-family:Arial,sans-serif;} .button{font-size:17px;font-weight:700;color:#fff;background:#0056b3;padding:12px 28px;border-radius:5px;text-decoration:none;display:inline-block;} .footer{margin-top:32px;font-size:0.95em;color:#666;}</style></head><body><div class=\"container\"><h2 style=\"color:#0056b3\">${subject}</h2><p>${greeting}<br>${maintext.replace(/\n/g, '<br>')}</p><a href=\"{{resetLink}}\" class=\"button\">${buttontext}</a><div class=\"footer\">Business Support</div></div></body></html>`;
    }
    return '';
  };

  // KI-API-Call
  const handleAIGenerate = async () => {
    setAiLoading(true);
    setAiError('');
    setAiTemplate('');
    setAiPrompt('');
    try {
      const res = await fetch('/api/admin/generate-email-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          greeting,
          maintext,
          buttontext,
          design,
          prompt: customPrompt.trim() ? customPrompt : undefined
        }),
      });
      if (!res.ok) throw new Error('Fehler bei der KI-Generierung');
      const data = await res.json();
      setAiTemplate(data.template || '');
      setAiPrompt(data.prompt || '');
      if (data.error) setAiError(data.error);
    } catch (e) {
      setAiError('Fehler bei der KI-Generierung');
    }
    setAiLoading(false);
  };

  // Fragenkatalog (Wizard)
  const handleWizardNext = () => {
    if (wizardStep < wizardQuestions.length - 1) {
      setWizardStep(wizardStep + 1);
    }
  };
  const handleWizardBack = () => {
    if (wizardStep > 0) {
      setWizardStep(wizardStep - 1);
    }
  };
  const handleWizardAnswer = (value: string) => {
    setWizardAnswers(prev => ({ ...prev, [wizardQuestions[wizardStep].key]: value }));
  };
  const handleWizardStart = () => {
    setWizardActive(true);
    setWizardStep(0);
    setWizardAnswers({ subject: '', greeting: '', maintext: '', buttontext: '', design: 'modern' });
    setWizardAiLoading(false);
    setWizardAiError('');
    setWizardAiTemplate('');
    setWizardAiPrompt('');
  };
  const handleWizardAIGenerate = async () => {
    setWizardAiLoading(true);
    setWizardAiError('');
    setWizardAiTemplate('');
    setWizardAiPrompt('');
    try {
      const res = await fetch('/api/admin/generate-email-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: wizardAnswers.subject,
          greeting: wizardAnswers.greeting,
          maintext: wizardAnswers.maintext,
          buttontext: wizardAnswers.buttontext,
          design: wizardAnswers.design
        }),
      });
      if (!res.ok) throw new Error('Fehler bei der KI-Generierung');
      const data = await res.json();
      setWizardAiTemplate(data.template || '');
      setWizardAiPrompt(data.prompt || '');
      if (data.error) setWizardAiError(data.error);
    } catch (e) {
      setWizardAiError('Fehler bei der KI-Generierung');
    }
    setWizardAiLoading(false);
  };

  return (
    <div style={{
      maxWidth: 900,
      margin: '0 auto',
      background: '#fff',
      border: '1px solid #eaeaea',
      borderRadius: 12,
      boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
      padding: 32,
      marginBottom: 40
    }}>
      <h2 style={{fontSize: 28, fontWeight: 700, color: '#1976d2', marginBottom: 24}}>E-Mail Template bearbeiten</h2>
      <div style={{marginBottom: 24}}>
        <label style={{fontWeight: 600, fontSize: 16, marginRight: 12}}>Typ:</label>
        <select value={type} onChange={e => setType(e.target.value)} style={{fontSize: 16, padding: '6px 12px', borderRadius: 6, border: '1px solid #ccc'}}>
          {TEMPLATE_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>
      <div style={{marginBottom: 24}}>
        <label style={{fontWeight: 600, fontSize: 16, display: 'block', marginBottom: 8}}>HTML-Inhalt:</label>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={18}
          cols={90}
          style={{ fontFamily: 'monospace', fontSize: 15, width: '100%', padding: 16, borderRadius: 8, border: '1px solid #ccc', background: '#f9f9f9', resize: 'vertical' }}
        />
      </div>
      <button onClick={handleSave} disabled={loading} style={{fontSize: 16, padding: '10px 28px', borderRadius: 6, background: '#1976d2', color: '#fff', border: 'none', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', marginBottom: 16}}>
        Speichern
      </button>
      {success && <span style={{ color: 'green', fontWeight: 600, marginLeft: 16 }}>Erfolgreich gespeichert!</span>}
      {error && <span style={{ color: 'red', fontWeight: 600, marginLeft: 16 }}>{error}</span>}
      <hr style={{margin: '32px 0'}} />
      <h3 style={{fontSize: 22, fontWeight: 700, color: '#1976d2', marginBottom: 18}}>Vorschau</h3>
      <div style={{background: '#f7f7f7', border: '1px solid #ddd', borderRadius: '12px', padding: '32px', marginBottom: '32px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)'}}>
        <div dangerouslySetInnerHTML={{ __html: content }} />
      </div>
      <div style={{
        background: '#f2f8ff',
        border: '1px solid #cce3ff',
        borderRadius: 8,
        padding: '18px 24px',
        marginBottom: 28,
        color: '#1976d2',
        fontSize: 15
      }}>
        <b>Tipp für Einsteiger:</b> <br />
        Sie können Platzhalter verwenden, die beim Versand automatisch ersetzt werden. <br />
        <ul style={{margin: '8px 0 0 18px', color: '#1976d2'}}>
          <li><b>{'{{displayName}}'}</b> – Name des Empfängers</li>
          <li><b>{'{{resetLink}}'}</b> – Link zum Zurücksetzen des Passworts</li>
          <li><b>{'{{code}}'}</b> – Verifizierungscode</li>
        </ul>
        <div style={{marginTop: 12}}>
          <span style={{fontWeight: 600}}>Platzhalter einfügen:</span>
          <button type="button" style={{marginLeft: 8, marginRight: 4, padding: '4px 10px', borderRadius: 4, border: '1px solid #1976d2', background: '#fff', color: '#1976d2', cursor: 'pointer', fontSize: 14}}
            onClick={() => setContent(content + '{{displayName}}')}>{'{{displayName}}'}</button>
          <button type="button" style={{marginRight: 4, padding: '4px 10px', borderRadius: 4, border: '1px solid #1976d2', background: '#fff', color: '#1976d2', cursor: 'pointer', fontSize: 14}}
            onClick={() => setContent(content + '{{resetLink}}')}>{'{{resetLink}}'}</button>
          <button type="button" style={{padding: '4px 10px', borderRadius: 4, border: '1px solid #1976d2', background: '#fff', color: '#1976d2', cursor: 'pointer', fontSize: 14}}
            onClick={() => setContent(content + '{{code}}')}>{'{{code}}'}</button>
        </div>
      </div>
      <hr style={{margin: '32px 0'}} />
      <h3 style={{fontSize: 22, fontWeight: 700, color: '#1976d2', marginBottom: 18}}>Baukasten: E-Mail zusammenstellen</h3>
      <div style={{background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 8, padding: '18px 24px', marginBottom: 28, color: '#ad8b00', fontSize: 15}}>
        <div style={{marginBottom: 12}}>
          <label style={{marginRight: 8}}>Betreff:</label>
          <input type="text" style={{padding: '4px 10px', borderRadius: 4, border: '1px solid #ffe58f', fontSize: 15, width: 260}} value={subject} onChange={e => setSubject(e.target.value)} />
        </div>
        <div style={{marginBottom: 12}}>
          <label style={{marginRight: 8}}>Begrüßung:</label>
          <input type="text" style={{padding: '4px 10px', borderRadius: 4, border: '1px solid #ffe58f', fontSize: 15, width: 260}} value={greeting} onChange={e => setGreeting(e.target.value)} />
        </div>
        <div style={{marginBottom: 12}}>
          <label style={{marginRight: 8}}>Haupttext:</label>
          <textarea style={{padding: '4px 10px', borderRadius: 4, border: '1px solid #ffe58f', fontSize: 15, width: 260, minHeight: 60, resize: 'vertical'}} value={maintext} onChange={e => setMaintext(e.target.value)} />
        </div>
        <div style={{marginBottom: 12}}>
          <label style={{marginRight: 8}}>Button-Text:</label>
          <input type="text" style={{padding: '4px 10px', borderRadius: 4, border: '1px solid #ffe58f', fontSize: 15, width: 260}} value={buttontext} onChange={e => setButtontext(e.target.value)} />
        </div>
        <div style={{marginBottom: 12}}>
          <label style={{marginRight: 8}}>Design:</label>
          <select value={design} onChange={e => setDesign(e.target.value)} style={{fontSize: 15, padding: '4px 10px', borderRadius: 6, border: '1px solid #ffe58f'}}>
            <option value="modern">Modern</option>
            <option value="klassisch">Klassisch</option>
            <option value="minimal">Minimal</option>
            <option value="business">Business</option>
          </select>
        </div>
        <button type="button" style={{fontSize: 15, padding: '8px 22px', borderRadius: 6, background: '#ffe58f', color: '#ad8b00', border: 'none', fontWeight: 600, cursor: 'pointer', marginTop: 8}}
          onClick={() => setContent(getBaukastenTemplate())}>
          Template übernehmen
        </button>
        <div style={{marginTop: 24}}>
          <h4 style={{fontSize: 17, fontWeight: 700, color: '#ad8b00', marginBottom: 10}}>Vorschau des Baukasten-Templates</h4>
          <div style={{background: '#fff', border: '1px solid #ffe58f', borderRadius: '8px', padding: '24px', marginBottom: '12px'}}>
            <div dangerouslySetInnerHTML={{ __html: getBaukastenTemplate() }} />
          </div>
        </div>
      </div>
      <div style={{background: '#e3f6ff', border: '1px solid #90caf9', borderRadius: 8, padding: '18px 24px', marginBottom: 28, color: '#1976d2', fontSize: 15}}>
        <b>KI-Template-Generator:</b> <br />
        <button type="button" style={{fontSize: 15, padding: '8px 22px', borderRadius: 6, background: '#90caf9', color: '#1976d2', border: 'none', fontWeight: 600, cursor: 'pointer', marginTop: 8, marginRight: 12}} onClick={handleWizardStart}>
          Fragenkatalog starten
        </button>
        {/* ...Prompt-Eingabe und KI-Button wie gehabt... */}
        {/* Wizard UI */}
        {wizardActive && (
          <div style={{marginTop: 24, background: '#fff', border: '1px solid #90caf9', borderRadius: 8, padding: 24}}>
            <h4 style={{fontSize: 17, fontWeight: 700, color: '#1976d2', marginBottom: 10}}>Fragenkatalog</h4>
            <div style={{marginBottom: 18}}>
              <b>{wizardQuestions[wizardStep].question}</b><br />
              {wizardQuestions[wizardStep].type === 'select' ? (
                <select value={wizardAnswers.design} onChange={e => handleWizardAnswer(e.target.value)} style={{fontSize: 15, padding: '4px 10px', borderRadius: 6, border: '1px solid #90caf9', marginTop: 8}}>
                  {wizardQuestions[wizardStep].options.map(opt => (
                    <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
                  ))}
                </select>
              ) : (
                <input type="text" value={wizardAnswers[wizardQuestions[wizardStep].key]} onChange={e => handleWizardAnswer(e.target.value)} style={{padding: '4px 10px', borderRadius: 4, border: '1px solid #90caf9', fontSize: 15, width: 320, marginTop: 8}} />
              )}
            </div>
            <div style={{marginBottom: 18}}>
              {wizardStep > 0 && <button type="button" style={{marginRight: 8, padding: '6px 18px', borderRadius: 6, background: '#fff', color: '#1976d2', border: '1px solid #90caf9', fontWeight: 600, cursor: 'pointer'}} onClick={handleWizardBack}>Zurück</button>}
              {wizardStep < wizardQuestions.length - 1 && <button type="button" style={{padding: '6px 18px', borderRadius: 6, background: '#90caf9', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer'}} onClick={handleWizardNext}>Weiter</button>}
              {wizardStep === wizardQuestions.length - 1 && <button type="button" style={{padding: '6px 18px', borderRadius: 6, background: '#90caf9', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer'}} onClick={handleWizardAIGenerate} disabled={wizardAiLoading}>KI generieren</button>}
            </div>
            {wizardAiLoading && <span style={{marginLeft: 12}}>KI generiert ...</span>}
            {wizardAiError && <span style={{ color: 'red', fontWeight: 600, marginLeft: 16 }}>{wizardAiError}</span>}
            {wizardAiTemplate && (
              <div style={{marginTop: 24, display: 'flex', gap: 32}}>
                <div style={{flex: 1}}>
                  <h4 style={{fontSize: 17, fontWeight: 700, color: '#1976d2', marginBottom: 10}}>KI-Anfrage (Prompt)</h4>
                  <pre style={{background: '#f4f6f8', border: '1px solid #90caf9', borderRadius: 8, padding: 16, fontSize: 14, whiteSpace: 'pre-wrap'}}>{wizardAiPrompt}</pre>
                </div>
                <div style={{flex: 1}}>
                  <h4 style={{fontSize: 17, fontWeight: 700, color: '#1976d2', marginBottom: 10}}>Vorschau des KI-Templates</h4>
                  <div style={{background: '#fff', border: '1px solid #90caf9', borderRadius: '8px', padding: '24px', marginBottom: '12px'}}>
                    <div dangerouslySetInnerHTML={{ __html: wizardAiTemplate }} />
                  </div>
                  <button type="button" style={{fontSize: 15, padding: '8px 22px', borderRadius: 6, background: '#90caf9', color: '#1976d2', border: 'none', fontWeight: 600, cursor: 'pointer', marginTop: 8}}
                    onClick={() => setContent(wizardAiTemplate)}>
                    KI-Template übernehmen
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <div style={{marginTop: 24, background: '#fff', border: '1px solid #90caf9', borderRadius: 8, padding: 24}}>
        <h4 style={{fontSize: 17, fontWeight: 700, color: '#1976d2', marginBottom: 10}}>KI-Template Generator</h4>
        <div style={{margin: '12px 0 18px 0'}}>
          <label style={{marginRight: 8}}>Eigenen Prompt verwenden (optional):</label>
          <textarea
            value={customPrompt}
            onChange={e => setCustomPrompt(e.target.value)}
            placeholder="Hier eigenen Prompt eingeben oder Felder oben nutzen..."
            style={{padding: '4px 10px', borderRadius: 4, border: '1px solid #90caf9', fontSize: 15, width: 420, minHeight: 60, resize: 'vertical'}}
          />
        </div>
        <button type="button" style={{fontSize: 15, padding: '8px 22px', borderRadius: 6, background: '#90caf9', color: '#1976d2', border: 'none', fontWeight: 600, cursor: 'pointer', marginTop: 8}}
          onClick={handleAIGenerate} disabled={aiLoading}>
          Mit KI generieren
        </button>
        {aiLoading && <span style={{marginLeft: 12}}>KI generiert ...</span>}
        {aiError && <span style={{ color: 'red', fontWeight: 600, marginLeft: 16 }}>{aiError}</span>}
        {aiTemplate && (
          <div style={{marginTop: 24, display: 'flex', gap: 32}}>
            <div style={{flex: 1}}>
              <h4 style={{fontSize: 17, fontWeight: 700, color: '#1976d2', marginBottom: 10}}>KI-Anfrage (Prompt)</h4>
              <pre style={{background: '#f4f6f8', border: '1px solid #90caf9', borderRadius: 8, padding: 16, fontSize: 14, whiteSpace: 'pre-wrap'}}>{aiPrompt}</pre>
            </div>
            <div style={{flex: 1}}>
              <h4 style={{fontSize: 17, fontWeight: 700, color: '#1976d2', marginBottom: 10}}>Vorschau des KI-Templates</h4>
              <div style={{background: '#fff', border: '1px solid #90caf9', borderRadius: '8px', padding: '24px', marginBottom: '12px'}}>
                <div dangerouslySetInnerHTML={{ __html: aiTemplate }} />
              </div>
              <button type="button" style={{fontSize: 15, padding: '8px 22px', borderRadius: 6, background: '#90caf9', color: '#1976d2', border: 'none', fontWeight: 600, cursor: 'pointer', marginTop: 8}}
                onClick={() => setContent(aiTemplate)}>
                KI-Template übernehmen
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
