// Zentrale E-Mail-Templates für Passwort-Reset und E-Mail-Verifizierung

export function passwordResetTemplate({ resetCode }) {
  return {
    subject: 'Passwort zurücksetzen – DaonWare',
    text: `Hallo,\n\nDu hast das Zurücksetzen deines Passworts angefordert.\n\nGib bitte folgenden Code auf der Passwort-zurücksetzen-Seite ein: ${resetCode}\n\nDer Code ist 30 Minuten gültig. Sollte er ablaufen, kannst du einen neuen anfordern.\n\nBei Fragen oder Problemen schreibe uns an support@daonware.de.`,
    html: `
      <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:8px;border:1px solid #eaeaea;padding:32px 24px;font-family:Arial,sans-serif;box-shadow:0 2px 8px rgba(0,0,0,0.04);">
        <div style="text-align:center;margin-bottom:24px;">
          <img src="https://www.daonware.de/logo.png" alt="DaonWare Logo" style="height: 48px; margin-bottom: 8px;" onerror="this.style.display='none'">
          <h2 style="margin:0;color:#007bff;font-size:22px;font-weight:700;">Passwort zurücksetzen</h2>
        </div>
        <p style="font-size:16px;color:#222;margin-bottom:18px;">Hallo,<br>du hast das Zurücksetzen deines Passworts angefordert.</p>
        <p style="font-size:16px;color:#222;margin-bottom:18px;">Gib bitte folgenden Code auf der Passwort-zurücksetzen-Seite ein:</p>
        <div style="text-align:center;margin:32px 0;">
          <span style="display:inline-block;font-size:32px;font-weight:700;letter-spacing:6px;color:#007bff;background:#f2f8ff;padding:16px 32px;border-radius:8px;border:1px solid #cce3ff;">${resetCode}</span>
        </div>
        <p style="font-size:15px;color:#555;margin-bottom:18px;">Der Code ist <b>30 Minuten gültig</b>. Sollte er ablaufen, kannst du einen neuen anfordern.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:32px 0;">
        <div style="font-size:13px;color:#888;text-align:center;">
          Bei Fragen oder Problemen schreibe uns an <a href="mailto:support@daonware.de" style="color:#007bff;text-decoration:underline;">support@daonware.de</a>.<br>
          <a href="https://www.daonware.de" style="color:#007bff;text-decoration:underline;">www.daonware.de</a>
        </div>
      </div>
    `
  };
}

export function emailVerificationTemplate({ verificationCode }) {
  return {
    subject: 'Dein DaonWare Verifizierungscode',
    text: `Hallo und willkommen bei DaonWare!\n\nGib bitte folgenden Code auf der Verifizierungsseite ein: ${verificationCode}\n\nDer Code ist 30 Minuten gültig. Sollte er ablaufen, kannst du einen neuen anfordern.\n\nBei Fragen oder Problemen schreibe uns an support@daonware.de.`,
    html: `
      <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:8px;border:1px solid #eaeaea;padding:32px 24px;font-family:Arial,sans-serif;box-shadow:0 2px 8px rgba(0,0,0,0.04);">
        <div style="text-align:center;margin-bottom:24px;">
          <img src="https://www.daonware.de/logo.png" alt="DaonWare Logo" style="height: 48px; margin-bottom: 8px;" onerror="this.style.display='none'">
          <h2 style="margin:0;color:#007bff;font-size:22px;font-weight:700;">Willkommen bei DaonWare!</h2>
        </div>
        <p style="font-size:16px;color:#222;margin-bottom:18px;">Hallo,<br>vielen Dank für deine Registrierung!</p>
        <p style="font-size:16px;color:#222;margin-bottom:18px;">Gib bitte folgenden Code auf der Verifizierungsseite ein:</p>
        <div style="text-align:center;margin:32px 0;">
          <span style="display:inline-block;font-size:32px;font-weight:700;letter-spacing:6px;color:#007bff;background:#f2f8ff;padding:16px 32px;border-radius:8px;border:1px solid #cce3ff;">${verificationCode}</span>
        </div>
        <p style="font-size:15px;color:#555;margin-bottom:18px;">Der Code ist <b>30 Minuten gültig</b>. Sollte er ablaufen, kannst du einen neuen anfordern.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:32px 0;">
        <div style="font-size:13px;color:#888;text-align:center;">
          Bei Fragen oder Problemen schreibe uns an <a href="mailto:support@daonware.de" style="color:#007bff;text-decoration:underline;">support@daonware.de</a>.<br>
          <a href="https://www.daonware.de" style="color:#007bff;text-decoration:underline;">www.daonware.de</a>
        </div>
      </div>
    `
  };
}
