import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";

interface TwoFactorSetupProps {
  secret: string;
  otpauthUrl: string;
  onVerify: () => void;
  userId: string | number;
}

export default function TwoFactorSetup({ secret, otpauthUrl, onVerify, userId }: TwoFactorSetupProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [codeInput, setCodeInput] = useState("");

  // Timer für TOTP-Code (30 Sekunden)
  useEffect(() => {
    const timer = setInterval(() => {
      const secondsLeft = 30 - (Math.floor(Date.now() / 1000) % 30);
      setTimeLeft(secondsLeft);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code || code.length < 6) {
      setError("Bitte geben Sie einen 6-stelligen Code ein");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          code, 
          userId,
          secret  // Sende das Secret zur Verifizierung mit
        }),
      });

      const data = await res.json();

      if (res.ok) {
        onVerify();
      } else {
        setError(data.error || "Ungültiger Code");
        setCode("");
      }
    } catch (err) {
      console.error("2FA Verification Error:", err);
      setError("Fehler bei der Verifizierung. Bitte versuchen Sie es erneut.");
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.replace(/\D/g, '').substring(0, 6);
    setCode(newValue);

    // Automatisch absenden, wenn 6 Ziffern eingegeben wurden
    if (newValue.length === 6 && !loading) {
      setCodeInput(newValue);
    }
  };

  // Automatisch absenden, wenn 6 Ziffern eingegeben wurden
  useEffect(() => {
    if (codeInput.length === 6 && !loading) {
      const form = document.getElementById('twoFactorForm');
      if (form) {
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    }
  }, [codeInput, loading]);

  return (
    <div style={{ maxWidth: 400, margin: "0 auto", textAlign: "center" }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '16px', color: '#2a3a4a' }}>
        2FA mit Authenticator-App aktivieren
      </h2>

      <div style={{ 
        background: '#f0f8ff', 
        padding: '12px', 
        borderRadius: '8px', 
        marginBottom: '20px',
        fontSize: '0.9rem'
      }}>
        <p style={{ margin: '0 0 8px 0' }}>
          <strong>Anleitung:</strong>
        </p>
        <ol style={{ textAlign: 'left', paddingLeft: '20px', margin: '0' }}>
          <li>Öffne deine Authenticator-App (Google Authenticator, Authy, etc.)</li>
          <li>Tippe auf "Neues Konto" oder "+" Symbol</li>
          <li>Scanne den QR-Code oder gib den Code manuell ein</li>
          <li>Gib den 6-stelligen Code aus der App ein</li>
        </ol>
      </div>

      <div style={{ 
        margin: "20px 0",
        background: "#fff",
        padding: "12px",
        borderRadius: "8px",
        boxShadow: "0 2px 6px rgba(0,0,0,0.08)"
      }}>
        <QRCodeSVG value={otpauthUrl} size={180} />
        <div style={{ 
          fontSize: "12px", 
          marginTop: "8px", 
          color: "#666",
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "4px" }}>
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          Nächster Code in {timeLeft} Sekunden
        </div>
      </div>

      <div style={{ 
        marginBottom: "16px", 
        background: "#f5f5f5", 
        padding: "12px", 
        borderRadius: "8px" 
      }}>
        <p style={{ margin: "0 0 8px 0", fontSize: "0.9rem", color: "#666" }}>
          Manueller Eingabe-Code (falls QR-Code nicht funktioniert):
        </p>
        <div style={{ 
          fontFamily: "monospace", 
          background: "#fff", 
          padding: "8px", 
          borderRadius: "4px", 
          wordBreak: "break-all",
          fontSize: "16px",
          letterSpacing: "1px",
          border: "1px dashed #ccc"
        }}>
          <b>{secret}</b>
        </div>
      </div>

      <form id="twoFactorForm" onSubmit={handleVerify} style={{ margin: "24px 0" }}>
        <div style={{ marginBottom: "16px" }}>
          <label htmlFor="twoFactorCode" style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>
            Gib den 6-stelligen Code aus deiner App ein:
          </label>
          <input
            id="twoFactorCode"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="000000"
            value={code}
            onChange={handleCodeChange}
            style={{ 
              fontSize: 18, 
              letterSpacing: 8, 
              textAlign: "center", 
              padding: "12px", 
              width: "160px",
              borderRadius: "8px",
              border: error ? "1px solid #d32f2f" : "1px solid #ccc",
              outline: "none",
              boxShadow: error ? "0 0 0 2px rgba(211, 47, 47, 0.2)" : "none"
            }}
            required
            disabled={loading}
            autoFocus
          />
        </div>

        <button 
          type="submit" 
          disabled={loading || code.length !== 6}
          style={{
            padding: "10px 24px",
            background: "#4f8cff",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            cursor: loading ? "wait" : "pointer",
            opacity: loading || code.length !== 6 ? 0.7 : 1,
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            transition: "all 0.2s ease"
          }}
        >
          {loading ? (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "8px", animation: "spin 1s linear infinite" }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
              </svg>
              Wird verifiziert...
            </span>
          ) : (
            "Code bestätigen"
          )}
        </button>
      </form>

      {error && (
        <div style={{ 
          color: "white", 
          background: "#d32f2f", 
          padding: "10px", 
          borderRadius: "6px",
          marginTop: "16px",
          animation: "shake 0.5s"
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "8px" }}>
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          {error}
        </div>
      )}

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
