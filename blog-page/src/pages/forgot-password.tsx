import React, { useState } from "react";
import Head from "next/head";
import styles from "../components/login.module.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("Falls die E-Mail existiert, wurde ein Link zum Zurücksetzen verschickt.");
      } else {
        setError(data.error || "Fehler beim Versand der E-Mail.");
      }
    } catch {
      setError("Serverfehler. Bitte versuche es später erneut.");
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
            <h1 className={styles.heading}>Passwort vergessen</h1>
            <div className={styles.subtitle}>Gib deine E-Mail-Adresse ein</div>
            {error && <div className={styles.errorMessage}>{error}</div>}
            {success && <div style={{ color: '#28a745', background: '#eafaf1', border: '1px solid #c3e6cb', borderRadius: 4, padding: '10px 15px', marginBottom: 20, fontSize: 15, textAlign: 'left', fontWeight: 500 }}>{success}</div>}
            <form onSubmit={handleSubmit}>
              <div className={styles.inputGroup}>
                <label htmlFor="email" className={styles.inputLabel}>E-Mail</label>
                <input
                  id="email"
                  type="email"
                  placeholder="E-Mail-Adresse"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className={styles.inputField}
                />
              </div>
              <button type="submit" className={styles.loginButton} disabled={loading}>
                {loading ? "Lädt..." : "Link anfordern"}
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

