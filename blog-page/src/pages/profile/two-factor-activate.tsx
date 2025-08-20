import React, { useState, useEffect } from "react";
import TwoFactorSetup from "./two-factor";
import styles from "./profile2fa.module.css";

interface Profile2FAActivateProps {
  userId: string | number;
}

export default function Profile2FAActivate({ userId }: Profile2FAActivateProps) {
  const [secret, setSecret] = useState("");
  const [otpauthUrl, setOtpauthUrl] = useState("");
  const [step, setStep] = useState(0);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  // Überprüfe, ob 2FA bereits aktiviert ist
  useEffect(() => {
    async function check2FAStatus() {
      try {
        const res = await fetch(`/api/auth/check-2fa-status?userId=${userId}`, {
          method: "GET",
        });
        const data = await res.json();
        setIs2FAEnabled(data.enabled || false);
      } catch (err) {
        console.error("Fehler beim Überprüfen des 2FA-Status:", err);
      }
    }
    check2FAStatus();
  }, [userId]);

  const handleStart = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/generate-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (res.ok) {
        setSecret(data.secret);
        setOtpauthUrl(data.otpauthUrl);
        setStep(1);
      } else {
        setError(data.error || "Fehler bei der 2FA-Einrichtung");
      }
    } catch (err) {
      console.error("2FA Setup Error:", err);
      setError("Fehler bei der Kommunikation mit dem Server");
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/disable-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        setIs2FAEnabled(false);
        // Erfolgreiche Deaktivierung
        return;
      } else {
        const data = await res.json();
        setError(data.error || "Fehler bei der Deaktivierung von 2FA");
      }
    } catch (err) {
      console.error("2FA Deactivation Error:", err);
      setError("Fehler bei der Kommunikation mit dem Server");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    setError(null);
    setStep(2);

    try {
      // Recovery-Codes generieren
      const res = await fetch("/api/auth/generate-recovery-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();

      if (res.ok && data.recoveryCodes) {
        setRecoveryCodes(data.recoveryCodes);
        setIs2FAEnabled(true);
      } else {
        setError(data.error || "Fehler beim Generieren der Recovery-Codes");
        console.error("Recovery Code Generation Error:", data.error);
      }
    } catch (err) {
      console.error("Recovery Code Error:", err);
      setError("Fehler bei der Kommunikation mit dem Server");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const content = `Recovery-Codes für 2FA (Bitte sicher speichern!)\n\n${recoveryCodes.join("\n")}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "recovery-codes.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.container}>
      {error && (
        <div style={{ 
          background: "#ffebee", 
          color: "#d32f2f", 
          padding: "12px", 
          borderRadius: "8px", 
          marginBottom: "16px",
          fontSize: "14px"
        }}>
          <strong>Fehler:</strong> {error}
        </div>
      )}

      {is2FAEnabled ? (
        // 2FA ist bereits aktiviert - Zeige Deaktivierungsoption
        <div>
          <div className={styles.success} style={{ marginBottom: "20px" }}>
            2FA ist aktiv und schützt dein Konto!
          </div>

          <button 
            onClick={handleDisable2FA} 
            className={styles.activateButton}
            style={{ 
              backgroundColor: "#d32f2f",
              borderColor: "#b71c1c"
            }}
            disabled={loading}
          >
            {loading ? (
              "Wird deaktiviert..."
            ) : (
              <>
                <span role="img" aria-label="Warnung">⚠️</span>
                2FA deaktivieren
              </>
            )}
          </button>

          <p style={{ fontSize: "14px", color: "#666", marginTop: "16px", textAlign: "center" }}>
            Warnung: Ohne 2FA ist dein Konto weniger geschützt!
          </p>
        </div>
      ) : (
        // 2FA-Setup-Prozess
        <>
          {step === 0 && (
            <button 
              onClick={handleStart} 
              className={styles.activateButton}
              disabled={loading}
            >
              {loading ? (
                "Wird initialisiert..."
              ) : (
                <>
                  <span role="img" aria-label="Schloss">🔒</span>
                  2FA mit Authenticator-App aktivieren
                </>
              )}
            </button>
          )}
          {step === 1 && (
            <TwoFactorSetup secret={secret} otpauthUrl={otpauthUrl} onVerify={handleVerify} userId={userId} />
          )}
          {step === 2 && (
            <>
              <div className={styles.success}>
                2FA wurde erfolgreich aktiviert!
              </div>
              {recoveryCodes.length > 0 && (
                <div style={{ marginTop: 24, textAlign: "center" }}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>
                    Deine Recovery-Codes:
                  </div>
                  <ul style={{ listStyle: "none", padding: 0, marginBottom: 16 }}>
                    {recoveryCodes.map(code => (
                      <li key={code} style={{ fontFamily: "monospace", fontSize: 18, margin: "4px 0" }}>{code}</li>
                    ))}
                  </ul>
                  <button className={styles.activateButton} onClick={handleDownload}>
                    Recovery-Codes herunterladen
                  </button>
                  <div style={{ fontSize: 13, color: "#888", marginTop: 8 }}>
                    Bewahre diese Codes sicher auf! Jeder Code ist nur einmal verwendbar.
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
