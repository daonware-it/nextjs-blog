// Diese Datei wurde entfernt, da sie nicht mehr benötigt wird.
// Die 2FA-Verifikation erfolgt jetzt direkt über den NextAuth Credential Provider.

export default function handler(req, res) {
  res.status(404).json({ error: 'Diese API-Route ist nicht mehr verfügbar.' });
}
