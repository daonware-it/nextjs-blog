import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiX, FiCheck, FiCopy, FiDownload, FiShield, FiSmartphone, FiKey } from 'react-icons/fi';
import { signIn } from "next-auth/react";

interface StepProps {
  userId: number;
  email: string;
  password: string;
  onClose: () => void;
  onSuccess?: () => void;
  mode?: 'setup' | 'manage';
}

interface Generate2FAResponse {
  qrCode: string;
  secret: string;
  recoveryCodes?: string[];
  success?: boolean;
}

interface Verify2FAResponse {
  success: boolean;
  error?: string;
  message?: string;
}

interface RecoveryCodesResponse {
  codes: string[];
}

const TwoFactorSetupDialog: React.FC<StepProps> = ({ userId, email, password, onClose, onSuccess, mode = 'setup' }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState<string>('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // Schritt 1: QR-Code und Secret laden
  useEffect(() => {
    if (mode === 'manage') {
      // Recovery-Codes direkt laden
      fetchRecoveryCodes();
      setCurrentStep(3);
    } else if (currentStep === 1) {
      generateQRCode();
    }
  }, [currentStep, userId, mode]);

  const generateQRCode = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post<Generate2FAResponse>('/api/auth/generate-2fa', { userId });
      const { data } = response;

      if (data.success) {
        setQrCode(data.qrCode);
        setSecret(data.secret);

        if (data.recoveryCodes && data.recoveryCodes.length > 0) {
          setRecoveryCodes(data.recoveryCodes);
        }
      } else {
        setError('Fehler beim Generieren des QR-Codes.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Laden des QR-Codes.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecoveryCodes = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await axios.post<RecoveryCodesResponse>('/api/auth/generate-recovery-codes', { userId });
      setRecoveryCodes(response.data.codes || []);
    } catch (err: any) {
      setError('Fehler beim Laden der Recovery-Codes.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Bitte geben Sie einen gültigen 6-stelligen Code ein.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post<Verify2FAResponse>('/api/auth/verify-2fa', {
        userId, 
        code: verificationCode 
      });
      if (response.data.success) {
        setCurrentStep(3);
        if (onSuccess) onSuccess();

        // Falls noch keine Recovery-Codes vorhanden sind, hole sie jetzt
        if (recoveryCodes.length === 0) {
          try {
            const recResponse = await axios.post<RecoveryCodesResponse>(
              '/api/auth/generate-recovery-codes', 
              { userId }
            );
            setRecoveryCodes(recResponse.data.codes || []);
          } catch (recErr) {
            console.error('Fehler beim Abrufen der Recovery-Codes:', recErr);
            // Trotz Fehler bei Recovery-Codes fortfahren
          }
        }

        // Nach erfolgreicher Verifizierung Session-Status aktualisieren lassen
        try {
          await axios.post('/api/auth/update-session');
        } catch (sessionErr) {
          // Fehler ignorieren
        }

        // NEU: Login mit 2FA-Code an NextAuth
        try {
          const loginRes = await signIn("credentials", {
            redirect: false,
            email: email,
            password: password,
            twoFactorCode: verificationCode
          });
          if (loginRes?.error) {
            setError(loginRes.error);
          } else {
            window.location.href = "/";
          }
        } catch (loginErr) {
          setError('Fehler beim Login mit 2FA-Code.');
        }
      } else {
        setError(response.data.error || 'Fehler bei der Verifizierung des Codes.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler bei der Verifizierung des Codes.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Fehler beim Kopieren:', err);
    }
  };

  const downloadRecoveryCodes = () => {
    const content = recoveryCodes.join('\n');
    const blob = new Blob([`2FA Recovery Codes\n\n${content}\n\nBitte bewahren Sie diese Codes sicher auf!`], 
      { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'recovery-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Entferne Nicht-Ziffern und begrenze auf 6 Zeichen
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setVerificationCode(value);

    // Fehler zurücksetzen bei Änderung
    if (error) setError('');

    // Automatisch verifizieren, wenn 6 Ziffern eingegeben wurden
    if (value.length === 6 && !isLoading) {
      // Kurze Verzögerung für bessere UI-Erfahrung
      setTimeout(() => {
        handleVerifyCode();
      }, 300);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && verificationCode.length === 6 && !isLoading) {
      handleVerifyCode();
    }
  };

  return (
    <div className="dialog-overlay">
      <div className="dialog-container" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <button 
          className="close-button" 
          onClick={onClose}
          aria-label="Dialog schließen"
        >
          <FiX size={20} />
        </button>

        {/* Fortschrittsanzeige */}
        <div className="progress-steps">
          {[1, 2, 3].map((step) => (
            <div key={step} className={`step ${currentStep >= step ? 'active' : ''}`}>
              <div className="step-number">{step}</div>
              <div className="step-label">
                {step === 1 && 'Setup'}
                {step === 2 && 'Verifizierung'}
                {step === 3 && 'Fertig'}
              </div>
            </div>
          ))}
        </div>

        {/* Schritt 1: QR-Code Setup */}
        {currentStep === 1 && (
          <div className="step-content">
            <div className="step-header">
              <FiShield className="step-icon" />
              <h2 id="dialog-title">Zwei-Faktor-Authentifizierung einrichten</h2>
            </div>

            {isLoading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>QR-Code wird generiert...</p>
              </div>
            ) : (
              <>
                <div className="instruction-box">
                  <FiSmartphone size={24} />
                  <p>Installieren Sie eine Authenticator-App (z.B. Google Authenticator, Authy) und scannen Sie den QR-Code.</p>
                </div>

                {qrCode ? (
                  <div className="qr-section">
                    <div className="qr-container">
                      <img src={qrCode} alt="QR-Code für Zwei-Faktor-Authentifizierung" />
                    </div>

                    {secret && (
                      <div className="secret-section">
                        <label>Manueller Eingabe-Schlüssel:</label>
                        <div className="secret-input">
                          <code>{secret}</code>
                          <button
                            className="copy-btn"
                            onClick={() => copyToClipboard(secret, 'secret')}
                            title="Schlüssel kopieren"
                          >
                            {copied === 'secret' ? <FiCheck /> : <FiCopy />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="error-state">
                    <p>QR-Code konnte nicht geladen werden.</p>
                    <button className="retry-btn" onClick={generateQRCode}>
                      Erneut versuchen
                    </button>
                  </div>
                )}

                <div className="button-group">
                  <button 
                    className="btn-primary" 
                    onClick={() => setCurrentStep(2)}
                    disabled={!qrCode}
                  >
                    Weiter zur Verifizierung
                  </button>
                </div>
              </>
            )}

            {error && <div className="error-message" role="alert">{error}</div>}
          </div>
        )}

        {/* Schritt 2: Code-Verifizierung */}
        {currentStep === 2 && (
          <div className="step-content">
            <div className="step-header">
              <FiKey className="step-icon" />
              <h2>Verifizierungscode eingeben</h2>
            </div>

            <div className="instruction-box">
              <p>Geben Sie den 6-stelligen Code aus Ihrer Authenticator-App ein:</p>
            </div>

            <div className="code-input-section">
              <input
                type="text"
                className="code-input"
                placeholder="000000"
                value={verificationCode}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                maxLength={6}
                disabled={isLoading}
                autoFocus
                aria-label="Verifizierungscode"
              />
              <div className="input-hint">
                {verificationCode.length}/6 Zeichen
              </div>
              <div className="verification-tips">
                <p>
                  <strong>Tipps:</strong>
                </p>
                <ul>
                  <li>Geben Sie den Code direkt aus Ihrer Authenticator-App ein</li>
                  <li>Stellen Sie sicher, dass die Uhrzeit auf Ihrem Gerät korrekt ist</li>
                  <li>Der Code ist nur für kurze Zeit gültig</li>
                </ul>
              </div>
            </div>

            <div className="button-group">
              <button 
                className="btn-secondary" 
                onClick={() => setCurrentStep(1)}
                disabled={isLoading}
              >
                Zurück
              </button>
              <button 
                className="btn-primary" 
                onClick={handleVerifyCode}
                disabled={isLoading || verificationCode.length !== 6}
              >
                {isLoading ? <div className="btn-spinner"></div> : 'Verifizieren'}
              </button>
            </div>

            {error && <div className="error-message" role="alert">{error}</div>}
          </div>
        )}

        {/* Schritt 3: Recovery-Codes */}
        {currentStep === 3 && (
          <div className="step-content">
            <div className="step-header">
              <FiCheck className="step-icon success" />
              <h2>{mode === 'manage' ? '2FA verwalten' : 'Setup abgeschlossen!'}</h2>
            </div>
            <div className="success-message">
              <p>{mode === 'manage' ? 'Ihre Zwei-Faktor-Authentifizierung ist aktiv.' : 'Ihre Zwei-Faktor-Authentifizierung wurde erfolgreich eingerichtet.'}</p>
            </div>
            <div className="recovery-section">
              <h3>Recovery-Codes</h3>
              <div className="warning-box">
                <strong>Wichtig:</strong> Bewahren Sie diese Codes sicher auf! Sie werden nur einmal angezeigt und können verwendet werden, wenn Sie keinen Zugriff auf Ihre Authenticator-App haben.
              </div>
              <div className="codes-container">
                {recoveryCodes.map((code, index) => (
                  <div key={index} className="recovery-code">
                    <code>{code}</code>
                    <button
                      className="copy-btn-small"
                      onClick={() => copyToClipboard(code, `code-${index}`)}
                      title="Code kopieren"
                    >
                      {copied === `code-${index}` ? <FiCheck size={14} /> : <FiCopy size={14} />}
                    </button>
                  </div>
                ))}
              </div>
              <div className="recovery-actions">
                <button 
                  className="btn-secondary"
                  onClick={() => copyToClipboard(recoveryCodes.join('\n'), 'all-codes')}
                >
                  <FiCopy /> Alle kopieren
                </button>
                <button 
                  className="btn-secondary"
                  onClick={downloadRecoveryCodes}
                >
                  <FiDownload /> Als Datei herunterladen
                </button>
                {mode === 'manage' && (
                  <button className="btn-secondary" onClick={fetchRecoveryCodes}>
                    <FiKey /> Neue Recovery-Codes generieren
                  </button>
                )}
              </div>
            </div>
            <div className="button-group">
              <button className="btn-primary" onClick={onClose}>
                Fertig
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .dialog-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 1rem;
        }

        .dialog-container {
          background: white;
          border-radius: 16px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          max-width: 500px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
        }

        .close-button {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 8px;
          transition: all 0.2s;
          z-index: 1;
        }

        .close-button:hover {
          background: #f3f4f6;
          color: #374151;
        }

        .progress-steps {
          display: flex;
          justify-content: center;
          padding: 2rem 2rem 0;
          margin-bottom: 1rem;
        }

        .step {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
          position: relative;
        }

        .step:not(:last-child)::after {
          content: '';
          position: absolute;
          top: 16px;
          left: 60%;
          right: -40%;
          height: 2px;
          background: #e5e7eb;
          transition: all 0.3s;
        }

        .step.active:not(:last-child)::after {
          background: #10b981;
        }

        .step-number {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #e5e7eb;
          color: #6b7280;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.875rem;
          transition: all 0.3s;
          position: relative;
          z-index: 1;
        }

        .step.active .step-number {
          background: #10b981;
          color: white;
        }

        .step-label {
          margin-top: 0.5rem;
          font-size: 0.75rem;
          color: #6b7280;
          text-align: center;
        }

        .step.active .step-label {
          color: #374151;
          font-weight: 500;
        }

        .step-content {
          padding: 0 2rem 2rem;
        }

        .step-header {
          display: flex;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .step-icon {
          margin-right: 0.75rem;
          color: #6366f1;
        }

        .step-icon.success {
          color: #10b981;
        }

        .step-header h2 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 600;
          color: #111827;
        }

        .instruction-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
        }

        .instruction-box p {
          margin: 0;
          color: #475569;
          line-height: 1.6;
        }

        .loading-state {
          text-align: center;
          padding: 2rem;
        }

        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #e5e7eb;
          border-top: 3px solid #6366f1;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .qr-section {
          text-align: center;
        }

        .qr-container {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 1rem;
          margin-bottom: 1.5rem;
          display: inline-block;
        }

        .qr-container img {
          width: 200px;
          height: 200px;
          display: block;
        }

        .secret-section {
          margin-bottom: 1.5rem;
        }

        .secret-section label {
          display: block;
          font-weight: 500;
          color: #374151;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
        }

        .secret-input {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #f9fafb;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          padding: 0.75rem;
        }

        .secret-input code {
          flex: 1;
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 0.875rem;
          color: #1f2937;
          word-break: break-all;
        }

        .copy-btn, .copy-btn-small {
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 4px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .copy-btn:hover, .copy-btn-small:hover {
          background: #e5e7eb;
          color: #374151;
        }

        .code-input-section {
          margin-bottom: 2rem;
          text-align: center;
        }

        .code-input {
          width: 200px;
          height: 60px;
          font-size: 1.5rem;
          text-align: center;
          border: 2px solid #d1d5db;
          border-radius: 8px;
          font-family: 'Monaco', 'Menlo', monospace;
          letter-spacing: 0.1em;
          transition: all 0.2s;
        }

        .code-input:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .input-hint {
          margin-top: 0.5rem;
          font-size: 0.75rem;
          color: #6b7280;
        }

        .verification-tips {
          margin-top: 1rem;
          background: #f3f4f6;
          border-radius: 8px;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          color: #4b5563;
          text-align: left;
        }

        .verification-tips p {
          margin: 0 0 0.5rem 0;
        }

        .verification-tips ul {
          margin: 0;
          padding-left: 1.25rem;
        }

        .verification-tips li {
          margin-bottom: 0.25rem;
        }

        .success-message {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1.5rem;
        }

        .success-message p {
          margin: 0;
          color: #166534;
        }

        .recovery-section h3 {
          margin: 0 0 1rem 0;
          font-size: 1.125rem;
          font-weight: 600;
          color: #111827;
        }

        .warning-box {
          background: #fffbeb;
          border: 1px solid #fed7aa;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1.5rem;
          color: #92400e;
          font-size: 0.875rem;
          line-height: 1.6;
        }

        .codes-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }

        .recovery-code {
          display: flex;
          align-items: center;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 0.75rem;
        }

        .recovery-code code {
          flex: 1;
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 0.875rem;
          color: #1f2937;
        }

        .recovery-actions {
          display: flex;
          gap: 0.75rem;
          justify-content: center;
          margin-bottom: 1.5rem;
        }

        .button-group {
          display: flex;
          gap: 0.75rem;
          justify-content: flex-end;
          margin-top: 2rem;
        }

        .btn-primary, .btn-secondary {
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn-primary {
          background: #6366f1;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #5856eb;
        }

        .btn-primary:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #e5e7eb;
        }

        .btn-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .error-message {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 1rem;
          color: #dc2626;
          margin-top: 1rem;
          font-size: 0.875rem;
        }

        .error-state {
          text-align: center;
          padding: 2rem;
          color: #6b7280;
        }

        .retry-btn {
          margin-top: 1rem;
          padding: 0.5rem 1rem;
          background: #6366f1;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .retry-btn:hover {
          background: #5856eb;
        }

        @media (max-width: 640px) {
          .dialog-overlay {
            padding: 0.5rem;
          }

          .step-content {
            padding: 0 1.5rem 1.5rem;
          }

          .progress-steps {
            padding: 1.5rem 1.5rem 0;
          }

          .button-group {
            flex-direction: column;
          }

          .recovery-actions {
            flex-direction: column;
          }

          .codes-container {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default TwoFactorSetupDialog;

