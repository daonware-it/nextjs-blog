// Beispiel für eine API-Route, falls du eigene Login-Logik brauchst
// Für NextAuth ist diese Datei meist nicht nötig, da alles über [...nextauth].ts läuft

export default function handler(req, res) {
  res.status(404).json({ error: "Nutze /api/auth/[...nextauth] für Login!" });
}
