import React, { useState, useEffect } from 'react';
import styles from './admin.module.css';
import HtmlEditor from '../components/HtmlEditor';
import { passwordResetTemplate, emailVerificationTemplate } from '@/lib/mailTemplates';

const AdminEmailTemplates: React.FC = () => {
  // Initiale Templates aus den Funktionen laden
  const [passwordResetHtml, setPasswordResetHtml] = useState('');
  const [emailVerificationHtml, setEmailVerificationHtml] = useState('');
  const [passwordResetSubject, setPasswordResetSubject] = useState('');
  const [passwordResetText, setPasswordResetText] = useState('');
  const [emailVerificationSubject, setEmailVerificationSubject] = useState('');
  const [emailVerificationText, setEmailVerificationText] = useState('');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [passwordResetEditor, setPasswordResetEditor] = useState<'html' | 'text'>('html');
  const [emailVerificationEditor, setEmailVerificationEditor] = useState<'html' | 'text'>('html');

  // Vorlagen beim Laden aus der Datenbank holen
  useEffect(() => {
    async function fetchTemplates() {
      try {
        const res1 = await fetch('/api/admin/email-templates?type=passwordReset');
        const res2 = await fetch('/api/admin/email-templates?type=emailVerification');
        const data1 = await res1.json();
        const data2 = await res2.json();
        setPasswordResetHtml(data1.html || passwordResetTemplate({ resetCode: '{resetCode}' }).html);
        setEmailVerificationHtml(data2.html || emailVerificationTemplate({ verificationCode: '{verificationCode}' }).html);
        setPasswordResetSubject(data1.subject || passwordResetTemplate({ resetCode: '{resetCode}' }).subject);
        setPasswordResetText(data1.text || passwordResetTemplate({ resetCode: '{resetCode}' }).text);
        setEmailVerificationSubject(data2.subject || emailVerificationTemplate({ verificationCode: '{verificationCode}' }).subject);
        setEmailVerificationText(data2.text || emailVerificationTemplate({ verificationCode: '{verificationCode}' }).text);
      } catch (err) {
        setErrorMsg('Fehler beim Laden der Vorlagen.');
      }
    }
    (async () => { await fetchTemplates(); })();
  }, []);

  // Speichern-Funktion
  async function saveTemplate(type: string, subject: string, text: string, html: string) {
    // Validierung: Platzhalter muss enthalten sein
    if (type === 'passwordReset' && !html.includes('{resetCode}') && !text.includes('{resetCode}')) {
      setErrorMsg('Bitte verwenden Sie den Platzhalter {resetCode} im HTML- oder Text-Feld.');
      return;
    }
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const res = await fetch('/api/admin/email-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, subject, text, html })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg('Vorlage gespeichert!');
      } else {
        setErrorMsg(data.error || 'Fehler beim Speichern.');
      }
    } catch (err) {
      setErrorMsg('Fehler beim Speichern.');
    }
    setSaving(false);
  }

  // Vorschau und Bearbeitung
  return (
    <div className={styles.adminSection} style={{ maxWidth: 900, margin: '0 auto' }}>
      <h2>E-Mail-Vorlagen bearbeiten</h2>
      <div style={{ marginBottom: 40 }}>
        <h3>Passwort vergessen</h3>
        <div style={{marginBottom:12, color:'#555', fontSize:14}}>
          Hinweis: Verwenden Sie <b>{'{resetCode}'}</b> als Platzhalter für den Code, der dem Nutzer angezeigt werden soll.
        </div>
        <h4 className={styles.adminHeading}>E-Mail-Vorlage</h4>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: '#333' }}>Betreff:</label>
          <input
            type="text"
            value={passwordResetSubject}
            onChange={e => setPasswordResetSubject(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '10px 12px', 
              borderRadius: '6px', 
              border: '1px solid #ddd',
              fontSize: '14px',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05) inset'
            }}
          />
        </div>
        <div className={styles.editorButtonGroup}>
          <button 
            type="button" 
            onClick={() => setPasswordResetEditor('html')} 
            className={`${styles.modernButton} ${passwordResetEditor === 'html' ? styles.activeButton : ''}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '6px'}}>
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
            HTML-Editor
          </button>
        </div>
        {passwordResetEditor === 'html' ? (
          <HtmlEditor
            value={passwordResetHtml}
            onChange={setPasswordResetHtml}
            style={{ minHeight: 250, marginBottom: 16 }}
            mode="html"
            label="HTML-Version:"
          />
        ) : (
          <HtmlEditor
            value={passwordResetText}
            onChange={setPasswordResetText}
            style={{ minHeight: 120, marginBottom: 16 }}
            mode="text"
            label="Text-Version:"
          />
        )}
        <button 
          type="button" 
          className={styles.editorButton}
          style={{ marginTop: 16 }} 
          onClick={() => {
            setPasswordResetSubject('');
            setPasswordResetText('');
            setPasswordResetHtml('');
          }}
        >
          Vorlage zurücksetzen
        </button>
        <div style={{ marginTop: 16, border: '1px solid #eee', borderRadius: 8, background: '#fafcff', padding: 16 }}>
          <div dangerouslySetInnerHTML={{ __html: passwordResetHtml }} />
        </div>
        <button 
          type="button" 
          className={styles.editorButton}
          style={{ 
            marginTop: 16, 
            background: '#e0f2e0', 
            borderColor: '#c5e5c5',
            color: '#2c7c2c' 
          }} 
          onClick={() => saveTemplate('passwordReset', passwordResetSubject, passwordResetText, passwordResetHtml)} 
          disabled={saving}
        >
          {saving ? 'Wird gespeichert...' : 'Speichern'}
        </button>
      </div>
      <div>
        <h3>E-Mail-Verifizierung</h3>
        <h4 className={styles.adminHeading}>E-Mail-Vorlage</h4>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: '#333' }}>Betreff:</label>
          <input
            type="text"
            value={emailVerificationSubject}
            onChange={e => setEmailVerificationSubject(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '10px 12px', 
              borderRadius: '6px', 
              border: '1px solid #ddd',
              fontSize: '14px',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05) inset'
            }}
          />
        </div>
        <div className={styles.editorButtonGroup}>
          <button 
            type="button" 
            onClick={() => setEmailVerificationEditor('html')} 
            className={`${styles.modernButton} ${emailVerificationEditor === 'html' ? styles.activeButton : ''}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '6px'}}>
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
            HTML-Editor
          </button>
        </div>
        {emailVerificationEditor === 'html' ? (
          <HtmlEditor
            value={emailVerificationHtml}
            onChange={setEmailVerificationHtml}
            style={{ minHeight: 250, marginBottom: 16 }}
            mode="html"
            label="HTML-Version:"
          />
        ) : (
          <HtmlEditor
            value={emailVerificationText}
            onChange={setEmailVerificationText}
            style={{ minHeight: 120, marginBottom: 16 }}
            mode="text"
            label="Text-Version:"
          />
        )}
        <button 
          type="button" 
          className={styles.editorButton}
          style={{ marginTop: 16 }} 
          onClick={() => {
            setEmailVerificationSubject('');
            setEmailVerificationText('');
            setEmailVerificationHtml('');
          }}
        >
          Vorlage zurücksetzen
        </button>
        <div style={{ marginTop: 16, border: '1px solid #eee', borderRadius: 8, background: '#fafcff', padding: 16 }}>
          {emailVerificationEditor === 'html'
            ? <div dangerouslySetInnerHTML={{ __html: emailVerificationHtml }} />
            : <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>{emailVerificationText}</pre>
          }
        </div>
        <button 
          type="button" 
          className={styles.editorButton}
          style={{ 
            marginTop: 16, 
            background: '#e0f2e0', 
            borderColor: '#c5e5c5',
            color: '#2c7c2c' 
          }} 
          onClick={() => saveTemplate('emailVerification', emailVerificationSubject, emailVerificationText, emailVerificationHtml)} 
          disabled={saving}
        >
          {saving ? 'Wird gespeichert...' : 'Speichern'}
        </button>
      </div>
      {successMsg && <div style={{ color: 'green', marginTop: 16 }}>{successMsg}</div>}
      {errorMsg && <div style={{ color: 'red', marginTop: 16 }}>{errorMsg}</div>}
    </div>
  );
};

export default AdminEmailTemplates;
