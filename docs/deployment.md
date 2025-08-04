# 🚀 Deployment auf Produktionserver

Diese Anleitung zeigt dir, wie du das Blog-System sicher und stabil auf einem Linux-Server betreibst.

---

### 🔐 Empfehlung: dedizierter Linux-Server

Am besten verwendest du:

- Ubuntu Server 22.04 LTS oder höher
- Einen dedizierten Benutzer für den Node.js-Prozess (z.B. `bloguser`)
- Systemdienste wie `pm2` oder `systemd`
- Reverse-Proxy mit Nginx
- SSL Zertifikate (z.B. **Let's Encrypt**)
  
---


### 1. System vorbereiten

_Grundlegende Systempakete und Tools installieren, damit alle Abhängigkeiten für Node.js, Datenbank, Redis und Webserver bereitstehen._


```bash
sudo apt update && sudo apt upgrade
sudo apt install git curl build-essential postgresql redis nginx
```

Node.js (LTS.Version) installieren:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

---


### 2. Datenbank & Benutzer einrichten

_PostgreSQL-Datenbank und Benutzer für das Blog-System anlegen. Redis für Caching und Queues aktivieren._

```bash
sudo -u postgres psql
```

```bash
CREATE USER bloguser WITH PASSWORD 'SICHERES_PASSOWRD';
CREATE DATABASE blogdb OWNER bloguser;
\q
```

Redis starten:

```bash
sudo systemctl enable redis
sudo systemctl start redis
```

---


### 3. Projekt bereitstellen

_Quellcode auf den Server holen, Umgebungsvariablen anpassen und alles für den Produktivbetrieb vorbereiten._


```bash
sudo adduser --system --group bloguser
sudo su - bloguser
git clone https://github.com/daonware-it/blog-system
cd blog-system
# Beispiel-Umgebungsdatei kopieren, falls vorhanden
[ -f .env.example ] && cp .env.example .env
nano .env
```


Dann `.env` anpassen wie bei der lokalen [Einrichtung](installation.md) (besonders `DATABASE_URL` , `NEXTAUTH_SECRET` und ggf. `OPEN_API_KEY`)

---


### 4. Installierung & Start vorbereiten

_Abhängigkeiten installieren, Prisma-Client generieren und Datenbank-Migrationen ausführen. Optional Seed-Daten einspielen._

```bash
npm install
npx prisma generate
npx prisma migrate deploy
```

Optional Seed-Daten:

```bash
npx prisma db seed
```

---


### 5. Mit `pm2` dauerhaft betreiben

_PM2 sorgt dafür, dass der Node.js-Prozess im Hintergrund läuft, automatisch neu startet und beim Systemstart verfügbar ist._

Installiere `pm2` global:

```bash
npm install -g pm2
```

Starte den Blog als Dienst:

```bash
pm2 start npm --name blog-system -- run start
pm2 save
pm2 startup
```

---


### 6. Reverse Proxy mit Nginx

_Nginx leitet Anfragen von außen an den Node.js-Server weiter und sorgt für mehr Sicherheit und Performance._

Konfigurationsdatei z.B. unter `/etc/nginx/sites-available/blog-system`:

```bash
server {
  listen 80;
  server_name deinblog.de;

  location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

Aktivieren & neustarten:

```bash
sudo ln -s /etc/nginx/sites-available/blog-system /etc/nginx/sites-enabled/blog-system
sudo nginx -t
sudo systemctl restart nginx
```

---


### 7. SSL Zertifikate mit Let's Encrypt

_Kostenlose SSL-Zertifikate für HTTPS einrichten und automatische Verlängerung aktivieren._


```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d deinblog.de
```

Zertifikat automatisch verlängern:

```bash
sudo systemctl enable --now certbot.timer
# oder regelmäßig testen:
sudo certbot renew --dry-run
```

---


### ✅ Alles läuft?

_Wenn alle Schritte erfolgreich waren, ist dein Blog-System produktiv erreichbar! Bei Problemen siehe [Troubleshooting](troubleshooting.md)._