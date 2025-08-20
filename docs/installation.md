
# 📦 Installation & Setup

Diese Anleitung führt dich durch die lokale Einrichtung der Blog-Plattform für Entwicklungszwecke.

----

## 🔧 Voraussetzungen

Stelle sicher, dass folgende Software installiert ist

- **Node.js** (Version 22 oder neuer)
- **npm** (wird mit Node installiert)
- **PostgreSQL** (Version 13 oder neuer)
- **Redis** (fur Session und Caching)
- **Git**

----


### 1. Repository klonen

```bash
git clone https://github.com/daonware-it/nextjs-blog.git
cd nextjs-blog/blog-page
```

----


### 2. Umgebungsvariablen einrichten

Kopiere die Beispiel-Umgebungsdatei, falls vorhanden, und passe sie an:

```bash
[ -f .env.example ] && cp .env.example .env
nano .env
```

Passe die wichtigsten Variablen an:

```env
DATABASE_URL="postgres://NAME:PASSWORT@127.0.0.1:5432/homepage"
NEXTAUTH_SECRET="KEY-BITTE-ERSTELLEN"
RECAPTCHA_SECRET_KEY=""
RATE_LIMIT_MAX_ATTEMPTS=5
RATE_LIMIT_WINDOW_MINUTES=15
# OpenAI API Key für KI-Textgenerierung (optional)
OPENAI_API_KEY=""
```


----


### 3. Abhängigkeiten installieren

```bash
npm install
```

----


### 4. Prisma vorbereiten

```bash
npx prisma generate
npx prisma migrate deploy
```

Falls du Seed-Daten verwenden möchtest:

```bash
npx prisma db seed
```

> Die Datei `prisma/seed.ts` kannst du selbst mit Testdaten anpassen

----


### 5. Anwendung starten

Starte die Anwendung im Entwicklungsmodus:

```bash
npm run dev
```

Im Produktionsmodus (z.B. auf Server):

```bash
npm run build
npm start
```

Rufe dann im Browser auf:

[http://localhost:3000](http://localhost:3000) oder [http://SERVER-IP:3000](http://SERVER-IP:3000)

----


### 6. Test-Login (Admin erstellen)

Registriere dich über die Anwendung und erstelle einen normalen Benutzer. Um Admin-Rechte zu vergeben, ändere die Rolle in der Datenbank:

Beispiel (in SQL oder Prisma Studio):

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'deine@email.de';
```

Alternativ über Prisma Studio:

```bash
npx prisma studio
```

> Öffne den Datensatz und setze das Feld **role** auf **ADMIN**.