import React, { useState } from "react";
import Head from "next/head";
import styles from "../components/login.module.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useRouter } from "next/router";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { token } = router.query;
  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (password.length < 12) {
      setError("Das Passwort muss mindestens 12 Zeichen lang sein.");
      return;
    }
    if (password !== passwordRepeat) {
      setError("Die Passwörter stimmen nicht überein.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("Passwort erfolgreich geändert. Du kannst dich jetzt anmelden.");
      } else {
        setError(data.error || "Fehler beim Zurücksetzen des Passworts.");
      }
    } catch {
      setError("Serverfehler. Bitte versuche es später erneut.");
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
            <div className={styles.subtitle}>Gib dein neues Passwort ein</div>
            {error && <div className={styles.errorMessage}>{error}</div>}
            {success && <div style={{ color: '#28a745', background: '#eafaf1', border: '1px solid #c3e6cb', borderRadius: 4, padding: '10px 15px', marginBottom: 20, fontSize: 15, textAlign: 'left', fontWeight: 500 }}>{success}</div>}
            <form onSubmit={handleSubmit}>
              <div className={styles.inputGroup}>
                <label htmlFor="password" className={styles.inputLabel}>Neues Passwort</label>
                <input
                  id="password"
                  type="password"
                  placeholder="Neues Passwort"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className={styles.inputField}
                />
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="passwordRepeat" className={styles.inputLabel}>Passwort wiederholen</label>
                <input
                  id="passwordRepeat"
                  type="password"
                  placeholder="Passwort wiederholen"
                  value={passwordRepeat}
                  onChange={e => setPasswordRepeat(e.target.value)}
                  required
                  className={styles.inputField}
                />
              </div>
              <button type="submit" className={styles.loginButton} disabled={loading}>
                {loading ? "Lädt..." : "Passwort ändern"}
              </button>
            </form>
            <button
              type="button"
              className={styles.loginButton}
              style={{ marginTop: 16, background: '#f5f5f5', color: '#007bff', border: '1px solid #007bff' }}
              onClick={() => window.location.href = '/login'}
            >
              Zurück zur Login-Seite
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

