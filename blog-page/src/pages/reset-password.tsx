import { useState, useEffect } from 'react';
import Head from 'next/head';
import Navbar from '@/components/Navbar';
import styles from '@/components/login.module.css';
import { useRouter } from 'next/router';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordRepeat, setNewPasswordRepeat] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (router.query.email && typeof router.query.email === 'string') {
      setEmail(router.query.email);
    }
  }, [router.query.email]);

  // Passwortstärke wie bei Registrierung prüfen
  function checkPasswordStrength(pw: string) {
    if (pw.length < 12) return "Zu kurz";
    if (/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(pw)) return "Sehr stark";
    if (/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(pw)) return "Stark";
    if (/^(?=.*[a-z])(?=.*\d).{8,}$/.test(pw)) return "Mittel";
    return "Schwach";
  }
  const passwordStrength = checkPasswordStrength(newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    if (newPassword !== newPasswordRepeat) {
      setError('Die Passwörter stimmen nicht überein.');
      setLoading(false);
      return;
    }
    if (passwordStrength === "Zu kurz" || passwordStrength === "Schwach") {
      setError("Das Passwort muss mindestens den Status 'Mittel' erreichen und mindestens 12 Zeichen lang sein.");
      setLoading(false);
      return;
    }
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, newPassword }),
    });
    const data = await res.json();
    if (res.ok) {
      setSuccess('Passwort erfolgreich zurückgesetzt! Du wirst zur Login-Seite weitergeleitet.');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } else {
      setError(data.error || 'Fehler beim Zurücksetzen des Passworts.');
    }
    setLoading(false);
  };

  return (
    <>
      <Head>
        <title>Passwort zurücksetzen | DaonWare</title>
      </Head>
      <div className={styles.loginPageWrapper}>
        <Navbar />
        <div className={styles.loginContainer}>
          <div className={styles.loginBox}>
            <h1 className={styles.heading}>Passwort zurücksetzen</h1>
            <div className={styles.subtitle}>Gib deine E-Mail, den Reset-Code und ein neues Passwort ein.</div>
            {error && (
              <div className={styles.errorMessage}>{error}</div>
            )}
            {success && (
              <div style={{ color: '#28a745', background: '#eafaf1', border: '1px solid #c3e6cb', borderRadius: 4, padding: '10px 15px', marginBottom: 20, fontSize: 15, textAlign: 'left', fontWeight: 500 }}>{success}</div>
            )}
            <form onSubmit={handleSubmit}>
              <div className={styles.inputGroup}>
                <label htmlFor="email" className={styles.inputLabel}>E-Mail</label>
                <input
                  id="email"
                  type="email"
                  placeholder="Deine E-Mail-Adresse"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className={styles.inputField}
                />
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="code" className={styles.inputLabel}>Reset-Code</label>
                <input
                  id="code"
                  type="text"
                  placeholder="Code aus der E-Mail"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  required
                  className={styles.inputField}
                />
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="newPassword" className={styles.inputLabel}>Neues Passwort</label>
                <input
                  id="newPassword"
                  type="password"
                  placeholder="Neues Passwort"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  className={styles.inputField}
                />
                <div style={{ marginTop: 6, fontSize: 14, color: passwordStrength === "Sehr stark" ? "#28a745" : passwordStrength === "Stark" ? "#007bff" : passwordStrength === "Mittel" ? "#ffc107" : "#dc3545" }}>
                  Passwortstärke: {passwordStrength}
                </div>
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="newPasswordRepeat" className={styles.inputLabel}>Neues Passwort wiederholen</label>
                <input
                  id="newPasswordRepeat"
                  type="password"
                  placeholder="Neues Passwort wiederholen"
                  value={newPasswordRepeat}
                  onChange={e => setNewPasswordRepeat(e.target.value)}
                  required
                  className={styles.inputField}
                />
              </div>
              <button type="submit" className={styles.loginButton} disabled={loading}>
                {loading ? 'Wird geändert...' : 'Passwort zurücksetzen'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
