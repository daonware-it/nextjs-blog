import React, { useState } from "react";
import TwoFactorSetup from "./two-factor";
import Navbar from "../../components/Navbar";

export default function Profile2FAActivate({ userId }) {
  const [secret, setSecret] = useState("");
  const [otpauthUrl, setOtpauthUrl] = useState("");
  const [step, setStep] = useState(0);

  const handleStart = async () => {
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
    }
  };

  const handleVerify = () => {
    setStep(2);
  };

  return (
    <div style={{ maxWidth: 500, margin: "0 auto" }}>
      {step === 0 && (
        <button onClick={handleStart} style={{ margin: "32px auto", display: "block" }}>
          2FA mit Authenticator-App aktivieren
        </button>
      )}
      {step === 1 && (
        <TwoFactorSetup secret={secret} otpauthUrl={otpauthUrl} onVerify={handleVerify} />
      )}
      {step === 2 && (
        <div style={{ color: "#28a745", fontWeight: 600, marginTop: 32 }}>
          2FA wurde erfolgreich aktiviert!
        </div>
      )}
    </div>
  );
}
