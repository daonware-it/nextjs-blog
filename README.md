
# 📝 Blog-Plattform mit Admin-System, KI & 2FA
![Status](https://img.shields.io/badge/status-in%20process-yellow)

Ein flexibles und erweiterbares Blog-System mit Benutzerverwaltung, Admin-Dashboard, Zwei-Faktor-Authentifizierung, NextAuth, moderner Next.js-Architektur und geplanter KI-Integration (OpenAI API). Ideal für Entwickler:innen, Blogger:innen und Selbsthoster mit Fokus auf Kontrolle, Sicherheit und Erweiterbarkeit.

----


### 🚀 Features

- ✍️ Beitragserstellung mit Block-Editor (Editor.js)
- 🔐 Login mit NextAuth, E-Mail & optional 2FA (TOTP)
- 🛠 Admin-Panel mit Benutzerrollen, Moderation & Ticket-System
- 💬 Audit-Log für System-Transparenz
- 🤖 KI-Unterstützung (OpenAI, Text- und Bild-Generierung)
- 📌 Blog-Kategorien, Tags, Slugs & Filter
- 🧠 Statusverwaltung: Entwurf, Veröffentlicht, Geplant, Nicht öffentlich
- 📊 Statistiken (Besucher, Beiträge, Trends – geplant)
- 📬 Newsletter-System
- 📨 Benachrichtigungen für Nutzer

----


### 📦 Installation (Kurzfassung)

1. Repository klonen
2. `.env` Datei konfigurieren (siehe `.env.example`)
3. Abhängigkeiten installieren
4. Datenbank und Prisma initialisieren
5. Lokalen Server starten

Beispiel-Befehle:

```bash
git clone https://github.com/daonware-it/blog-system.git
cd blog-system/homepage
[ -f .env.example ] && cp .env.example .env
nano .env
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```

Für vollständige Konfiguration siehe die Dokumentation im `docs/`-Ordner.

----

### 📚 Dokumentation

- [Installation & Setup](docs/installation.md)
- [Deployment auf Produktivserver](docs/deployment.md)
- [Admin-Funktionen & Rollen](docs/admin.md)
- [Fehlerbehebung & Logs](docs/troubleshooting.md)
- [KI-Integration (OpenAI, API-Schlüssel)](docs/ai-integration.md)
- [Geplante Erweiterungen & Roadmap](docs/roadmap.md)

----

### 🔖 Version


Aktuelle Version `v0.1.0`  
🧪 Status: `In Entwicklung`

[📋 Zum Entwicklungs-Board (Trello)](https://trello.com/b/WhAYVSHT)

Siehe Github [Releases](https://github.com/daonware-it/blog-system/releases) für den vollständigen Changelog

----

### 📁 Projektstruktur (Auszug)

```text
Release/
├── CONTRIBUTING.md
├── README.md
├── docs/
│   ├── admin.md
│   ├── ai-integration.md
│   ├── database.md
│   ├── deployment.md
│   ├── installation.md
│   ├── roadmap.md
│   └── troubleshooting.md
├── homepage/
│   ├── package.json
│   ├── tsconfig.json
│   ├── next-env.d.ts
│   ├── custom.d.ts
│   ├── update-schema.js
│   ├── updateDisposableDomains.js
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.ts
│   │   ├── seed.js
│   │   └── migrations/
│   ├── public/
│   │   └── avatars/
│   ├── src/
│   │   ├── middleware.ts
│   │   ├── admin/
│   │   ├── api/
│   │   ├── components/
│   │   ├── lib/
│   │   ├── pages/
│   │   ├── styles/
│   │   └── types/
│   └── types/
└── ...
```

---

### 🧠 Tech-Stack

- Frontend: Next.js (React, TypeScript, Editor.js, TailwindCSS)
- Backend: Next.js API-Routes, NextAuth, Prisma ORM
- Datenbank: PostgreSQL
- Authentifizierung: NextAuth, E-Mail, 2FA (TOTP)
- Caching / Session: Redis
- E-Mail: Nodemailer
- KI-Integration: OpenAI (API)
- Newsletter-System
- Deployment: PM2, Docker (optional)

----

## 🤝 Mitmachen / Contributing

Du möchtest mitentwickeln?  
Pull Requests, Bug-Reports und Feature-Ideen sind willkommen!  
Bitte lies vorab die Hinweise in [CONTRIBUTING.md](CONTRIBUTING.md) (sofern vorhanden).

---


### 📸 Vorschau

<br>
<br>

<div align="center">

<img src="https://storage.googleapis.com/github-storage-daonware/Github/blogpage_1.png" alt="blogpage_1" width="800" />
<div><em>Startseite / Übersicht</em></div>
<br/>
<img src="https://storage.googleapis.com/github-storage-daonware/Github/blogpage_2.png" alt="blogpage_2" width="800" />
<div><em>Registierungs-Seite</em></div>
<br/>
<img src="https://storage.googleapis.com/github-storage-daonware/Github/blogpage_3.png" alt="blogpage_3" width="800" />
<div><em>Login</em></div>
<br/>
<img src="https://storage.googleapis.com/github-storage-daonware/Github/blogpage_4.png" alt="blogpage_4" width="800" />
<div><em>Mein Profil</em></div>
<br/>
<img src="https://storage.googleapis.com/github-storage-daonware/Github/blogpage_5.png" alt="blogpage_5" width="800" />
<div><em>Blogseite</em></div>
<br/>
<img src="https://storage.googleapis.com/github-storage-daonware/Github/blogpage_6.png" alt="blogpage_6" width="800" />
<div><em>Artikel lesen</em></div>
<br/>
<img src="https://storage.googleapis.com/github-storage-daonware/Github/blogpage_7.png" alt="blogpage_7" width="800" />
<div><em>Artikl bewerten / kommentieren</em></div>
<br/>
<img src="https://storage.googleapis.com/github-storage-daonware/Github/blogpage_8.png" alt="blogpage_8" width="800" />
<div><em>Blog-Dashboard</em></div>
<br/>
<img src="https://storage.googleapis.com/github-storage-daonware/Github/blogpage_9.png" alt="blogpage_9" width="800" />
<div><em>Blog-Dashboard mit Beispielinhalt</em></div>
<br/>
<img src="https://storage.googleapis.com/github-storage-daonware/Github/blogpage_10.png" alt="blogpage_10" width="800" />
<div><em>Blog-Editor</em></div>
<br/>
<img src="https://storage.googleapis.com/github-storage-daonware/Github/blogpage_11.png" alt="blogpage_11" width="800" />
<div><em>Admin-Dashboard</em></div>
<br/>
<img src="https://storage.googleapis.com/github-storage-daonware/Github/blogpage_12.png" alt="blogpage_12" width="800" />
<div><em>Benutzer-Verwaltung</em></div>
<br/>
<img src="https://storage.googleapis.com/github-storage-daonware/Github/blogpage_13.png" alt="blogpage_13" width="800" />
<div><em>Blogbeiträge einsehen / bearbeiten</em></div>
<br/>
<img src="https://storage.googleapis.com/github-storage-daonware/Github/blogpage_14.png" alt="blogpage_14" width="800" />
<div><em>Audit-Log / Verlauf</em></div>

</div>

### 🛡 Lizenz

**MIT License** - frei für private & kommerzielle Nutzung   
Author: **daonware-it**