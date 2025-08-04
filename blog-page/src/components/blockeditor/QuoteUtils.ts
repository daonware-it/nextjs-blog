export class QuoteUtils {
  /**
   * Formatiert einen Text als Zitat (z.B. mit > am Zeilenanfang)
   */
  static formatQuote(text: string): string {
    return text
      .split('\n')
      .map(line => `> ${line}`)
      .join('\n');
  }
}
