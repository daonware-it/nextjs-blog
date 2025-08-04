# Changelog

Alle wichtigen Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
und dieses Projekt folgt [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Geplant
- Statistiken (Besucher, Beiträge, Trends)
- Weitere KI-Features
- Performance-Optimierungen

## [0.1.0] - 2025-08-04

### Hinzugefügt
- ✍️ Beitragserstellung mit Block-Editor (Editor.js)
- 🔐 Login mit NextAuth, E-Mail & optional 2FA (TOTP)
- 🛠 Admin-Panel mit Benutzerrollen, Moderation & Ticket-System
- 💬 Audit-Log für System-Transparenz
- 🤖 KI-Unterstützung (OpenAI, Text- und Bild-Generierung)
- 📌 Blog-Kategorien, Tags, Slugs & Filter
- 🧠 Statusverwaltung: Entwurf, Veröffentlicht, Geplant, Nicht öffentlich
- 📬 Newsletter-System
- 📨 Benachrichtigungen für Nutzer
- 🗄️ PostgreSQL-Datenbank mit Prisma ORM
- 🎨 Responsive Design mit CSS Modules
- 📚 Umfangreiche Dokumentation

### Technische Details
- Next.js 15.4.4 mit TypeScript
- React 19.1.1
- NextAuth 4.24.11 für Authentifizierung
- Prisma 6.13.0 für Datenbankmanagement
- Editor.js für Block-Editor
- bcrypt für Password-Hashing
- QR-Code-Generierung für 2FA
- Highlight.js für Code-Syntax-Highlighting

### Projektstruktur
- Umbenennung von `homepage/` zu `blog-page/` für bessere Klarheit
- Bereinigung der Git-Repository-Struktur
- Einrichtung des Versionierungssystems

[Unreleased]: https://github.com/daonware-it/nextjs-blog/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/daonware-it/nextjs-blog/releases/tag/v0.1.0
