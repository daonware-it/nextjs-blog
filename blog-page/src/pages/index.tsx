import React from "react";
import Head from "next/head";
import styles from "../components/login.module.css";
import navbarStyles from "./navbar.module.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function HomePage() {
  return (
    <>
      <Head>
        <title>Startseite | DaonWare</title>
      </Head>
      <div className={styles.loginPageWrapper}>
        <Navbar />
        <div className={styles.loginContainer} style={{ marginTop: 80 }}>
          <div className={styles.loginBox} style={{
            width: "100vw",
            margin: "0 -8vw",
            background: "#fff",
            borderRadius: 18,
            boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
            padding: "56px 6vw 48px 6vw",
            display: "flex",
            flexDirection: "column",
            alignItems: "center"
          }}>
            <h1 className={styles.heading}>Willkommen bei DaonWare</h1>
            <div className={styles.subtitle}>Deine Plattform für Security & Malware Analyse</div>
            <p style={{ fontSize: 18, margin: "30px 0", color: "#444", lineHeight: 1.6 }}>
              <b>Starte jetzt mit deinem eigenen Account!</b><br /><br />
              • Melde dich an, um Beiträge zu lesen, zu verfassen und zu verwalten.<br />
              • Tausche dich mit anderen Experten aus.<br />
              • Nutze moderne Tools für IT-Sicherheit und Malware-Analyse.<br /><br />
              <span style={{ color: '#007bff', fontWeight: 500 }}>Sicherheit und Wissen für alle!</span>
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 24, justifyContent: "center", margin: "40px 0 0 0" }}>
              <div style={{ background: "#e3f2fd", borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", padding: "24px 28px", minWidth: 220, maxWidth: 320, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                <span style={{ fontSize: 32, color: "#1976d2", marginBottom: 12 }}>🔒</span>
                <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>Sichere Anmeldung</div>
                <div style={{ fontSize: 15, color: "#444" }}>2-Faktor-Authentifizierung und moderne Sicherheitsstandards schützen deinen Account.</div>
              </div>
              <div style={{ background: "#f1f8e9", borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", padding: "24px 28px", minWidth: 220, maxWidth: 320, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                <span style={{ fontSize: 32, color: "#388e3c", marginBottom: 12 }}>💡</span>
                <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>Wissensaustausch</div>
                <div style={{ fontSize: 15, color: "#444" }}>Diskutiere mit Experten, teile dein Know-how und lerne von anderen.</div>
              </div>
              <div style={{ background: "#fff3e0", borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", padding: "24px 28px", minWidth: 220, maxWidth: 320, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                <span style={{ fontSize: 32, color: "#f57c00", marginBottom: 12 }}>🛠️</span>
                <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>Tools & Analysen</div>
                <div style={{ fontSize: 15, color: "#444" }}>Nutze praktische Werkzeuge für Malware-Analyse und IT-Sicherheit direkt im Browser.</div>
              </div>
              <div style={{ background: "#fce4ec", borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", padding: "24px 28px", minWidth: 220, maxWidth: 320, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                <span style={{ fontSize: 32, color: "#d81b60", marginBottom: 12 }}>👥</span>
                <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>Community</div>
                <div style={{ fontSize: 15, color: "#444" }}>Finde Gleichgesinnte, vernetze dich und tausche dich in Foren und Gruppen aus.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
