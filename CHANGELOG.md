# Changelog

Alle wichtigen Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
und dieses Projekt folgt [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Geplant
- Statistiken (Besucher, Beiträge, Trends)
- Weitere KI-Features
- Performance-Optimierungen


## [0.2.0] - 2025-08-22

### Added
- **Passwort zurücksetzen (Passwort‑Vergessen):**  
  E‑Mail mit Verifizierungscode zum Zurücksetzen.
- **Zwei‑Faktor‑Authentifizierung (2FA):**
    - 2FA‑Statusanzeige im Benutzerprofil
    - Einmalige Generierung und Speicherung von Recovery Codes (verschlüsselt in der DB)
    - `.env`‑Key für Ver-/Entschlüsselung erforderlich
    - 2FA im Profil deaktivierbar
    - Konfigurierbarer Anzeigename (Issuer) in der Auth‑App über `.env`
    - Wiederherstellung mit Recovery‑Code + zusätzliche E‑Mail‑Bestätigung
- **E‑Mail‑Anbindung (Admin):**  
  Konfiguration über `.env`
- **E‑Mail‑Template‑Generator (Admin):**
    - KI‑gestützte Generierung (OpenAPI erforderlich; Modell in `.env` wählbar, Kosten beachten)
    - Alternativ vereinfachter Baukasten
- **OpenAPI‑Infobereich (Admin):**  
  Übersicht der Modelle, Kontolinks; Modellwahl in `.env`
- **Datenbanksicherung:**  
  Backups erstellen sowie Upload via Drag & Drop im Adminbereich
- **Datenbank‑Diagnose & Debug (Admin):**  
  UI + strukturierter JSON‑Output mit u. a.:
    - Verbindungstest (Status, Latenz ms)
    - Basisinfos (Provider, Host, Port, User, Version, DB‑Name)
    - Tabellenstatistiken (User, Post, Category, BlockDraft)
    - Migrationsstatus (lokal vs. angewendet, Erkennung fehlender Migrationen)
    - Verbindungspool (max/aktiv, Auslastung %)
    - Speicherplatz (freier Plattenplatz, DB‑Größe)
    - WAL‑Metriken (aktuelle Größe, Durchsatz)
    - Locks/Blocker (nicht vergebene Locks, aktive/blockierte Prozesse)
    - Langsame Abfragen (Top 5 aus `pg_stat_statements`, Fallback `pg_stat_activity`)
    - Autovacuum‑Indikatoren (Dead Tuples, letzte Vacuum/Analyze‑Zeitpunkte)
    - Scan‑Stats (Sequential vs. Index Scans, gelesene Tupel)
    - Größenreport (Top 10 Tabellen & Indizes)
    - Integritätscheck (z. B. verwaiste Posts ohne User)
    - Sicherheitsübersicht (Rollen & Rechte inkl. Superuser)
    - DB‑Settings (Encoding, Zeitzone, SSL‑Status, Extensions)
    - Replikation/HA (Primary/Standby, Replikations‑Slots)
    - Smoke‑Tests (Read/Write via Temp‑Tabelle mit Rollback)
    - Status‑Ampel für Verbindungen, Locks, Slow Queries, Plattenplatz
- **BlockDraft‑Cleanup:**  
  Löschen von Entwürfen älter als 30 Tage über Admin → System

### Changed
- Einheitliche Darstellung aller Diagnose‑Testergebnisse in der UI; konsistenter, strukturierter JSON‑Export

### Fixed
- Abo‑Status (UI) zeigt nun den korrekten Status an

### Security
- 2FA‑Einführung inkl. Recovery Codes (verschlüsselt) und zusätzlicher E‑Mail‑Sicherheitsbestätigung
- Sensible Schlüssel über `.env` konfigurierbar (2FA‑Crypto‑Key, E‑Mail‑Provider, Modellwahl für KI)

### Migration Notes / Setup
- `.env` aktualisieren:
    - `TWOFA_ENCRYPTION_KEY` (o. ä.) für Recovery‑Code‑Verschlüsselung
    - `EMAIL_*` (SMTP/Provider‑Settings)
    - `AI_PROVIDER` / `AI_MODEL` (für Template‑Generator & OpenAPI‑Integration)
    - `TWOFA_ISSUER_NAME` (Anzeigename in Auth‑App)
- DB‑Extensions prüfen (optional, je nach Setup): `pg_stat_statements` für Slow‑Query‑Analyse
- Berechtigungen sicherstellen für Diagnose‑Abfragen (Locks, Activity, Replikation)
- Backup‑Ziel konfigurieren (Storage/Bucket/Path) für DB‑Sicherung & Drag‑&‑Drop‑Upload
- E‑Mail‑Templates testen (KI‑Generator vs. Baukasten) und Preisrahmen/Limitierungen prüfen

### Post‑Deploy Checks
- Test Benutzer‑Flow: Passwort‑Vergessen (Code‑E‑Mail erhalten, Reset möglich)
- 2FA aktivieren/deaktivieren, Recovery Codes generieren & erfolgreich validieren
- Admin: Backup erstellen + Upload testen
- Diagnose‑Dashboard lädt, Status‑Ampeln korrekt
- Abo‑Statusanzeige zeigt erwartete Werte
- E‑Mail‑Versand (SMTP) funktioniert für Systemmails

---

## Initiale Version

- Grundfunktionalität & Admin‑System
- Rollenrechte
- Logging & Auditing
- Deployment‑Dokumentation

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
[0.2.0]: https://github.com/daonware-it/nextjs-blog/releases/tag/v0.2.0
