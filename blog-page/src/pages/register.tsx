import React, { useState } from "react";
import Head from "next/head";
import disposableEmailDomains from "./disposableEmailDomains.json";
import styles from '@/components/login.module.css';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";

import ReCAPTCHA from "react-google-recaptcha";

export default function RegisterPage() {
  const { status } = useSession();
  const router = useRouter();
  React.useEffect(() => {
    if (status === "authenticated") {
      window.location.href = "/";
    }
  }, [status]);
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");
  const [passwordStrength, setPasswordStrength] = useState("");
  const [agb, setAgb] = useState(false);
  const [datenschutz, setDatenschutz] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [error, setError] = useState("");
  const errorRef = React.useRef<HTMLDivElement>(null);
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const checkPasswordStrength = (pw: string) => {
    if (pw.length < 12) return "Zu kurz";
    if (/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(pw)) return "Sehr stark";
    if (/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(pw)) return "Stark";
    if (/^(?=.*[a-z])(?=.*\d).{8,}$/.test(pw)) return "Mittel";
    return "Schwach";
  };

  const isDisposableEmail = (email: string) => {
    const domain = email.split('@')[1]?.toLowerCase();
    return disposableEmailDomains.includes(domain);
  };

  React.useEffect(() => {
    setPasswordStrength(checkPasswordStrength(password));
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (isDisposableEmail(email)) {
      setError("Bitte verwende keine Wegwerf-E-Mail-Adresse.");
      setTimeout(() => {
        errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
      return;
    }
    if (passwordStrength === "Zu kurz" || passwordStrength === "Schwach") {
      setError("Das Passwort muss mindestens den Status 'Mittel' erreichen und mindestens 12 Zeichen lang sein.");
      setTimeout(() => {
        errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
      return;
    }
    if (!agb || !datenschutz) {
      setError("Bitte akzeptiere die Nutzungsbedingungen und Datenschutzerklärung.");
      setTimeout(() => {
        errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
      return;
    }
    if (password !== passwordRepeat) {
      setError("Die Passwörter stimmen nicht überein.");
      setTimeout(() => {
        errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, name, fullName, email, password, captchaToken }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("Registrierung erfolgreich! Bitte prüfe deine E-Mail und gib den Code zur Verifizierung ein.");
        setUsername(""); setName(""); setFullName(""); setEmail(""); setPassword(""); setPasswordRepeat(""); setAgb(false); setDatenschutz(false); setCaptchaToken("");
        setTimeout(() => {
          router.push("/verify-email");
        }, 1500);
      } else {
        setError(data.error || "Fehler bei der Registrierung.");
        setTimeout(() => {
          errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
      }
    } catch (err) {
      setError("Serverfehler. Bitte versuche es später erneut.");
      setTimeout(() => {
        errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
    setLoading(false);
  };
  return (
    <>
      <Head>
        <title>Registrieren | DaonWare</title>
      </Head>
      <div className={styles.loginPageWrapper}>
        <Navbar />
        <div className={styles.loginContainer}>
          <div className={styles.loginBox}>
            <h1 className={styles.heading}>Registrierung</h1>
            <div className={styles.subtitle}>Erstelle deinen DaonWare Account</div>
            {error && (
              <div ref={errorRef} className={styles.errorMessage}>{error}</div>
            )}
            {success && (
              <div style={{ color: '#28a745', background: '#eafaf1', border: '1px solid #c3e6cb', borderRadius: 4, padding: '10px 15px', marginBottom: 20, fontSize: 15, textAlign: 'left', fontWeight: 500 }}>{success}</div>
            )}
            <form onSubmit={handleSubmit}>
              <div className={styles.inputGroup}>
                <label htmlFor="username" className={styles.inputLabel}>Benutzername</label>
                <input
                  id="username"
                  type="text"
                  placeholder="Benutzername"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  className={styles.inputField}
                />
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="name" className={styles.inputLabel}>Name (öffentlich)</label>
                <input
                  id="name"
                  type="text"
                  placeholder="Name (öffentlich)"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className={styles.inputField}
                />
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="fullName" className={styles.inputLabel}>Voller Name (optional)</label>
                <input
                  id="fullName"
                  type="text"
                  placeholder="Voller Name (optional)"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className={styles.inputField}
                />
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="email" className={styles.inputLabel}>Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="Email"
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
                  type="password"
                  placeholder="Passwort"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className={styles.inputField}
                />
                <div style={{ marginTop: 6, fontSize: 14, color: passwordStrength === "Sehr stark" ? "#28a745" : passwordStrength === "Stark" ? "#007bff" : passwordStrength === "Mittel" ? "#ffc107" : "#dc3545" }}>
                  Passwortstärke: {passwordStrength}
                </div>
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
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                  <input type="checkbox" checked={agb} onChange={e => setAgb(e.target.checked)} required />
                  <span style={{ marginLeft: 8, fontWeight: 500 }}>Ich akzeptiere die <a href="/agb" target="_blank" style={{ textDecoration: 'underline', color: '#007bff', fontWeight: 500 }}>Nutzungsbedingungen</a></span>
                </label>
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                  <input type="checkbox" checked={datenschutz} onChange={e => setDatenschutz(e.target.checked)} required />
                  <span style={{ marginLeft: 8, fontWeight: 500 }}>Ich habe die <a href="/datenschutz" target="_blank" style={{ textDecoration: 'underline', color: '#007bff', fontWeight: 500 }}>Datenschutzerklärung</a> gelesen</span>
                </label>
              </div>
              <div className={styles.inputGroup}>
                <ReCAPTCHA
                  sitekey="6LderpMrAAAAAJdtENFkq9cTh3tkFKlPRW8vOLOg"
                  onChange={token => setCaptchaToken(token || "")}
                />
              </div>
              <button
                type="submit"
                className={styles.loginButton}
                disabled={loading}
              >
                {loading ? "Lädt..." : "Registrieren"}
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