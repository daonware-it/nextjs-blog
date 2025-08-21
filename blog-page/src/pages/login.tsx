import * as React from "react";
import Head from "next/head";
import styles from "../components/login.module.css";
import { signIn } from "next-auth/react";
import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [verifySuccess, setVerifySuccess] = useState("");
  const [requestingCode, setRequestingCode] = useState(false);
  const [requestCodeMsg, setRequestCodeMsg] = useState("");
  const { data: session } = useSession();
  
  // Beim Laden der Seite überprüfen, ob es einen Fehlerparameter in der URL gibt
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    
    if (errorParam === 'banned') {
      setError('Ihr Konto wurde gesperrt. Bitte kontaktieren Sie den Support.');
    }
  }, []);
  
  useEffect(() => {
    if (session) {
      window.location.href = "/";
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setShowVerifyDialog(false);
    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });
    setLoading(false);
    if (res?.error) {
      if (res.error === "not_verified") {
        setShowVerifyDialog(true);
      } else {
        setError(res.error);
      }
    } else {
      window.location.reload();
    }
  };

  const handleVerify = async () => {
    setVerifyError("");
    setVerifySuccess("");
    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: verificationCode }),
      });
      const data = await response.json();
      if (response.ok) {
        setVerifySuccess("Verifizierung erfolgreich! Bitte logge dich erneut ein.");
        setShowVerifyDialog(false);
      } else {
        setVerifyError(data.error || "Verifizierung fehlgeschlagen.");
      }
    } catch (err) {
      setVerifyError("Netzwerkfehler.");
    }
  };

  const handleRequestNewCode = async () => {
    setRequestingCode(true);
    setRequestCodeMsg("");
    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (response.ok) {
        setRequestCodeMsg("Neuer Code wurde verschickt!");
      } else {
        setRequestCodeMsg(data.error || "Fehler beim Versenden des Codes.");
      }
    } catch (err) {
      setRequestCodeMsg("Netzwerkfehler.");
    }
    setRequestingCode(false);
  };

  return (
    <>
      <Head>
        <title>Login | DaonWare</title>
      </Head>
      <div className={styles.loginPageWrapper}>
        <Navbar />
        <div className={styles.loginContainer}>
          <div className={styles.loginBox}>
            <h1 className={styles.heading}>DaonWare</h1>
            <div className={styles.subtitle}>Security & Malware Analyse</div>
            {error && (
              <div className={styles.errorMessage}>
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className={styles.inputGroup}>
                <label htmlFor="email" className={styles.inputLabel}>E-Mail-Adresse</label>
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
              <div className={styles.inputGroup}>
                <label htmlFor="password" className={styles.inputLabel}>Passwort</label>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Passwort"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className={styles.inputField}
                />
                <button
                  type="button"
                  className={styles.passwordToggleButton}
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
                >
                  {showPassword ? (
                    <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.383 5 12 5s8.268 2.943 9.542 7c-1.28 4.057-4.931 7-9.542 7S3.732 16.057 2.458 12z"/>
                    </svg>
                  ) : (
                    <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.94 17.94A10.05 10.05 0 012.46 12c1.28-4.06 4.93-7 9.54-7a9.96 9.96 0 018.48 4.78"/>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1l22 22"/>
                    </svg>
                  )}
                </button>
              </div>
              <div className={styles.formOptions}>
                <div className={styles.rememberMe}>
                  <input type="checkbox" id="remember" className={styles.rememberCheckbox} />
                  <label htmlFor="remember" className={styles.rememberLabel}>Angemeldet bleiben</label>
                </div>
                <a href="/forgot-password" className={styles.forgotPassword}>Passwort vergessen?</a>
              </div>
              <button
                type="submit"
                className={styles.loginButton}
                disabled={loading}
              >
                {loading ? (
                  <span>Wird verarbeitet...</span>
                ) : (
                  "Anmelden"
                )}
              </button>
            </form>
            {showVerifyDialog && (
              <div className={styles.verifyModalOverlay}>
                <div className={styles.verifyModal}>
                  <div className={styles.verifyModalTitle}>Konto verifizieren</div>
                  <div className={styles.verifyModalDesc}>
                    Bitte gib den Verifizierungscode ein, den du per E-Mail erhalten hast.
                  </div>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={e => setVerificationCode(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleVerify();
                      }
                    }}
                    placeholder="Verifizierungscode"
                    className={styles.verifyModalInput}
                  />
                  <button type="button" onClick={handleVerify} className={styles.verifyModalButton}>Verifizieren</button>
                  <button
                    type="button"
                    onClick={handleRequestNewCode}
                    className={styles.verifyModalButton}
                    style={{ background: '#fff', color: '#1976d2', border: '1px solid #1976d2', marginLeft: 10 }}
                    disabled={requestingCode}
                  >
                    {requestingCode ? "Wird versendet..." : "Neuen Code anfordern"}
                  </button>
                  {requestCodeMsg && <div style={{ marginTop: 8, color: requestCodeMsg.includes('verschickt') ? '#388e3c' : '#d32f2f', fontSize: 15 }}>{requestCodeMsg}</div>}
                  {verifyError && <div className={styles.verifyModalError}>{verifyError}</div>}
                  {verifySuccess && <div className={styles.verifyModalSuccess}>{verifySuccess}</div>}
                </div>
              </div>
            )}
            <div className={styles.signupLink}>
              Noch kein Konto? <a href="/register" className={styles.signupAnchor}>Registrieren</a>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
}