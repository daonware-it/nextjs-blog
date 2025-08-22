import fs from 'fs/promises';
import path from 'path';
import nodemailer from 'nodemailer';

export async function sendRecoveryCodeNotification({ to, username, code }) {
  console.log('sendRecoveryCodeNotification aufgerufen:', { to, username, code });

  // Transporter konfigurieren (hier Beispiel mit SMTP, ggf. anpassen)
  const port = Number(process.env.SMTP_PORT);
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465, // Port 465 benötigt secure: true
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  // HTML-Template laden und Platzhalter ersetzen
  let html = '';
  try {
    const templatePath = path.join(process.cwd(), 'src', 'lib', 'emailTemplates', 'recovery-code.html');
    html = await fs.readFile(templatePath, 'utf8');
    html = html.replace(/{{displayName}}/g, username || '')
               .replace(/{{code}}/g, code || '');
  } catch (e) {
    html = `<p>Hallo ${username},<br>Ihr Recovery-Code wurde verwendet, um sich in Ihr Konto einzuloggen.<br>Code: <b>${code}</b></p>`;
  }

  const mailOptions = {
    from: process.env.SMTP_FROM || 'noreply@example.com',
    to,
    subject: 'Hinweis: Recovery-Code verwendet',
    html,
    text: `Hallo ${username},\nIhr Recovery-Code wurde verwendet, um sich in Ihr Konto einzuloggen.\nCode: ${code}`
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error('E-Mail Versandfehler:', err);
    throw new Error('E-Mail Versandfehler: ' + err.message);
  }
}
