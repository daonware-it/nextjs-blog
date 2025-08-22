import crypto from 'crypto';

const ENCRYPTION_KEY = process.env['2FA_SECRET_KEY'] || '';
const IV_LENGTH = 16;

function getKeyBuffer(): Buffer {
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 32) {
    throw new Error('Ungültiger 2FA_SECRET_KEY! Der Schlüssel muss mindestens 32 Zeichen lang sein.');
  }
  // Erzeuge einen konsistenten 32-Byte-Schlüssel durch Hashing
  return crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
}

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getKeyBuffer();
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text: string): string {
  try {
    const textParts = text.split(':');
    if (textParts.length !== 2) throw new Error('Ungültiges Secret-Format');
    const iv = Buffer.from(textParts[0], 'hex');
    const encryptedText = Buffer.from(textParts[1], 'hex');
    const key = getKeyBuffer();
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (err: any) {
    throw new Error('Entschlüsselung des 2FA-Secrets fehlgeschlagen: ' + err.message);
  }
}