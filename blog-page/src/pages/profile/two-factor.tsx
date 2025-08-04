import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";

export default function TwoFactorSetup({ secret, otpauthUrl, onVerify }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/auth/verify-2fa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    if (res.ok) {
      onVerify();
    } else {
      setError(data.error || "Ungültiger Code");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "0 auto", textAlign: "center" }}>
      <h2>2FA mit Authenticator-App aktivieren</h2>
      <p>Scanne den QR-Code mit deiner Authenticator-App (z.B. Google Authenticator).</p>
      <QRCodeSVG value={otpauthUrl} size={180} />
      <p>Geheimer Schlüssel: <b>{secret}</b></p>
      <form onSubmit={handleVerify}>
        <input
          type="text"
          placeholder="6-stelliger Code"
          value={code}
          onChange={e => setCode(e.target.value)}
          style={{ fontSize: 18, letterSpacing: 4, textAlign: "center", margin: "16px 0" }}
          required
        />
        <button type="submit">Code bestätigen</button>
      </form>
      {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}
    </div>
  );
}
