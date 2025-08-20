import { useState } from 'react';
import Head from 'next/head';
import Navbar from '@/components/Navbar';
import styles from '@/components/login.module.css';
import { useRouter } from 'next/router';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    const res = await fetch('/api/auth/request-password-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (res.ok) {
      setSuccess('Wenn die E-Mail existiert, wurde ein Reset-Code versendet. Bitte prüfe dein Postfach.');
      setTimeout(() => {
        router.push(`/reset-password?email=${encodeURIComponent(email)}`);
      }, 2000);
    } else {
      setError(data.error || 'Fehler beim Anfordern des Reset-Codes.');
    }
    setLoading(false);
  };

  return (
    <>
      <Head>
        <title>Passwort vergessen | DaonWare</title>
      </Head>
      <div className={styles.loginPageWrapper}>
        <Navbar />
        <div className={styles.loginContainer}>
          <div className={styles.loginBox}>
            <h1 className={styles.heading}>Passwort vergessen?</h1>
            <div className={styles.subtitle}>Gib deine E-Mail-Adresse ein, um einen Reset-Code zu erhalten.</div>
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
              <button type="submit" className={styles.loginButton} disabled={loading}>
                {loading ? 'Wird gesendet...' : 'Reset-Code anfordern'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
