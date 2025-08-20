import { useState } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import styles from '../components/login.module.css';
import { useRouter } from 'next/router';

export default function VerifyEmail() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    const res = await fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });
    const data = await res.json();
    if (res.ok) {
      setSuccess('E-Mail erfolgreich verifiziert! Du wirst zur Login-Seite weitergeleitet.');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } else {
      setError(data.error || 'Fehler bei der Verifizierung.');
    }
    setLoading(false);
  };

  return (
    <>
      <Head>
        <title>E-Mail verifizieren | DaonWare</title>
      </Head>
      <div className={styles.loginPageWrapper}>
        <Navbar />
        <div className={styles.loginContainer}>
          <div className={styles.loginBox}>
            <h1 className={styles.heading}>E-Mail Verifizierung</h1>
            <div className={styles.subtitle}>Gib den Code aus deiner E-Mail ein</div>
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
                <label htmlFor="code" className={styles.inputLabel}>Verifizierungscode</label>
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
              <button type="submit" className={styles.loginButton} disabled={loading}>
                {loading ? 'Wird geprüft...' : 'Verifizieren'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
