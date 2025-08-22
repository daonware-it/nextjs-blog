import crypto from 'crypto';
import { encrypt, decrypt } from './encryptionUtils';

/**
 * Generiert eine angegebene Anzahl von Recovery-Codes
 * @param count Anzahl der zu generierenden Codes
 * @returns Array mit generierten Recovery-Codes
 */
export function generateRecoveryCodes(count: number = 10): string[] {
  const codes: string[] = [];

  for (let i = 0; i < count; i++) {
    // Generiere 6 Zufallszeichen (Buchstaben und Zahlen)
    // Format: XXXX-XXXX-XXXX
    const segment1 = crypto.randomBytes(2).toString('hex').toUpperCase();
    const segment2 = crypto.randomBytes(2).toString('hex').toUpperCase();
    const segment3 = crypto.randomBytes(2).toString('hex').toUpperCase();

    codes.push(`${segment1}-${segment2}-${segment3}`);
  }

  return codes;
}

/**
 * Speichert Recovery-Codes verschlüsselt
 * @param codes Array von Recovery-Codes
 * @returns Verschlüsselter String mit allen Codes
 */
export function storeRecoveryCodes(codes: string[]): string {
  return encrypt(JSON.stringify(codes));
}

/**
 * Entschlüsselt und gibt gespeicherte Recovery-Codes zurück
 * @param encryptedCodes Verschlüsselter String mit Recovery-Codes
 * @returns Array der entschlüsselten Recovery-Codes
 */
export function getRecoveryCodes(encryptedCodes: string): string[] {
  if (!encryptedCodes) return [];

  try {
    const decryptedCodes = decrypt(encryptedCodes);
    return JSON.parse(decryptedCodes);
  } catch (error) {
    console.error('Fehler beim Entschlüsseln der Recovery-Codes:', error);
    return [];
  }
}

/**
 * Überprüft, ob ein eingegebener Recovery-Code gültig ist
 * @param inputCode Der vom Benutzer eingegebene Code
 * @param encryptedCodes Die verschlüsselten gespeicherten Codes
 * @returns Gibt true zurück, wenn der Code gültig ist, sonst false
 */
export function verifyRecoveryCode(inputCode: string, encryptedCodes: string): boolean {
  if (!encryptedCodes || !inputCode) return false;

  try {
    const codes = getRecoveryCodes(encryptedCodes);
    // Formatierung normalisieren (Groß-/Kleinschreibung, Bindestriche)
    const normalizedInputCode = inputCode.trim().toUpperCase();

    // Überprüfe, ob der Code in der Liste ist
    return codes.includes(normalizedInputCode);
  } catch (error) {
    console.error('Fehler bei der Überprüfung des Recovery-Codes:', error);
    return false;
  }
}

/**
 * Entfernt einen verwendeten Recovery-Code aus der Liste
 * @param usedCode Der verwendete Code
 * @param encryptedCodes Die verschlüsselten gespeicherten Codes
 * @returns Neue verschlüsselte Liste ohne den verwendeten Code
 */
export function useRecoveryCode(usedCode: string, encryptedCodes: string): string {
  if (!encryptedCodes || !usedCode) return encryptedCodes;

  try {
    const codes = getRecoveryCodes(encryptedCodes);
    const normalizedUsedCode = usedCode.trim().toUpperCase();

    // Entferne den verwendeten Code
    const updatedCodes = codes.filter(code => code !== normalizedUsedCode);

    // Wenn alle Codes verwendet wurden, gib leeren String zurück
    if (updatedCodes.length === 0) return '';

    // Verschlüssele die aktualisierten Codes
    return storeRecoveryCodes(updatedCodes);
  } catch (error) {
    console.error('Fehler beim Verwenden des Recovery-Codes:', error);
    return encryptedCodes;
  }
}
