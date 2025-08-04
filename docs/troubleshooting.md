# 🐞 Fehlerbehebung & Logs

Diese Datei hilft bei der Diagnose typischer Probleme während der Entwicklung, beim Deployment oder im Betrieb der Blog-Plattform. Zusätzlich wird erklärt, wie Logs ausgewertet werden können, um Sicherheits- und Systemfehler frühzeitig zu erkennen.

---

## 📋 Häufige Probleme & Lösungen

### ❌ Fehler: `.env` fehlt oder ist leer
**Ursache:** .env-Datei nicht vorhanden oder unvollständig.

**Lösung:**
- Lege eine `.env`-Datei im Projekt-Stammverzeichnis an.
- Füge alle erforderlichen Umgebungsvariablen ein:

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/blog
NEXTAUTH_SECRET=...
OPENAI_API_KEY=...
```
Tipp: Siehe `.env.example` (wenn vorhanden)

---

### ❌ Fehler: „Database connection error“
**Ursache:** Datenbank nicht erreichbar oder falsche Zugangsdaten.

**Lösung:**
- Prüfe, ob PostgreSQL läuft (`systemctl status postgresql` oder Docker-Container).
- Überprüfe `DATABASE_URL` in `.env`.
- Teste Verbindung mit einem DB-Client.

---

### ❌ Fehler: Prisma Migrations schlagen fehl
**Lösung:**

```bash
npx prisma migrate reset
```
> Achtung: Dies löscht alle Daten. Nur in der Entwicklung verwenden.

Alternativ:

```bash
npx prisma generate
npx prisma db push
```

---

### ❌ Fehler: E-Mail-Versand funktioniert nicht
**Ursache:** SMTP-Konfiguration fehlt oder fehlerhaft.

**Lösung:**
- SMTP-Zugangsdaten in `.env` eintragen.

Beispiel für Mailtrap:

```env
EMAIL_SERVER=smtp.mailtrap.io
EMAIL_PORT=587
EMAIL_USER=deinuser
EMAIL_PASS=deinpass
```
Stelle sicher, dass der Port erreichbar ist (z. B. via Telnet).

---

## ⚠️ Hinweis: ReferenceError: File is not defined

Wenn du beim Starten der Anwendung folgende oder ähnliche Meldung bekommst:

```
✓ Starting...
✓ Ready in 374ms
[ReferenceError: File is not defined]
⨯ unhandledRejection: [ReferenceError: File is not defined]
[next-auth][warn][NEXTAUTH_URL]
https://next-auth.js.org/warnings#nextauth_url
```

Bedeutung: Deine Node.js-Version ist zu alt oder nicht kompatibel.

**So behebst du das Problem:**

1. Node.js entfernen und neu installieren:
   ```bash
   sudo apt remove nodejs
   curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
   sudo apt install -y nodejs
   ```
   Jetzt solltest du mindestens Version v22.18.0 haben.

2. Projekt neu bauen:
   ```bash
   rm -rf .next
   npm install
   npm run build
   npm start
   ```

**Erwartetes Ergebnis:**

```
✓ Starting...
✓ Ready in 296ms
```


---

## 🛠 Fehler beim Build: users.ts (Prisma join)

Falls beim Bauen (`npm run build`) ein Fehler im Zusammenhang mit `Prisma.join` in der Datei `src/pages/api/admin/users.ts` auftritt, gehe wie folgt vor:

### Schritt-für-Schritt-Anleitung

1. Navigiere zu `src/pages/api/admin/users.ts` (z. B. unter `/var/www/ORDNERNAME/src/pages/api/admin`)
2. Suche folgenden Abschnitt (ca. Zeile 70):

```ts
if (userIds.length > 0) {
  if (statusFilter) {
    statusRows = await prisma.$queryRaw`
      SELECT id, status FROM "User" WHERE id IN (${Prisma.join(userIds)}) AND status = ${statusFilter}
    `;
  } else {
    statusRows = await prisma.$queryRaw`
      SELECT id, status FROM "User" WHERE id IN (${Prisma.join(userIds)})
    `;
  }
}
```

Ersetze diesen Block durch:

```ts
if (userIds.length > 0) {
  if (statusFilter) {
    statusRows = await prisma.user.findMany({
      where: {
        id: { in: userIds },
        status: statusFilter,
      },
      select: { id: true, status: true },
    });
  } else {
    statusRows = await prisma.user.findMany({
      where: {
        id: { in: userIds },
      },
      select: { id: true, status: true },
    });
  }
}
```

3. Datei speichern und hochladen
4. Erneut bauen:
   ```bash
   npm run build
   ```

**Erwartetes Ergebnis:**

```
> build
> next build

   ▲ Next.js 15.4.5
   - Environments: .env

 ✓ Linting and checking validity of types    
   Creating an optimized production build ...
 ✓ Compiled successfully in 16.0s
 ✓ Collecting page data
 ✓ Generating static pages (16/16)
 ✓ Collecting build traces
 ✓ Finalizing page optimization

Route (pages)                                Size  First Load JS    
┌ ○ /                                     1.66 kB         108 kB        
├   /_app                                     0 B         103 kB        
├ ○ /404                                    180 B         103 kB        
├ ○ /admin (413 ms)                       32.8 kB         170 kB        
├   └ css/3effb44b1b3e6195.css            6.69 kB
├ ○ /agb (409 ms)                         2.19 kB         108 kB        
├ ƒ /api/admin/auditlog                       0 B         103 kB        
├ ƒ /api/admin/auth-check                     0 B         103 kB        
├ ƒ /api/admin/auth-test                      0 B         103 kB        
├ ƒ /api/admin/blogs                          0 B         103 kB        
├ ƒ /api/admin/categories                     0 B         103 kB        
├ ƒ /api/admin/categories/[id]                0 B         103 kB        
├ ƒ /api/admin/comments                       0 B         103 kB        
├ ƒ /api/admin/dashboard-stats                0 B         103 kB        
├ ƒ /api/admin/db-test                        0 B         103 kB        
├ ƒ /api/admin/ticket-stats                   0 B         103 kB        
├ ƒ /api/admin/tickets-reports                0 B         103 kB        
├ ƒ /api/admin/users                          0 B         103 kB        
├ ƒ /api/admin/users/[id]                     0 B         103 kB        
├ ƒ /api/admin/users/[id]/auditlog            0 B         103 kB        
├ ƒ /api/admin/users/[id]/tokens              0 B         103 kB        
├ ƒ /api/admin/users/[id]/tokens-notify       0 B         103 kB        
├ ƒ /api/admin/users/[id]/tokens/block        0 B         103 kB        
├ ƒ /api/admin/users/role                     0 B         103 kB        
├ ƒ /api/admin/users/search                   0 B         103 kB        
├ ƒ /api/ai-auth                              0 B         103 kB        
├ ƒ /api/ai-generate                          0 B         103 kB        
├ ƒ /api/auth-helpers                         0 B         103 kB        
├ ƒ /api/auth/[...nextauth]                   0 B         103 kB        
├ ƒ /api/auth/avatar-upload                   0 B         103 kB        
├ ƒ /api/auth/check-email                     0 B         103 kB        
├ ƒ /api/auth/check-status                    0 B         103 kB        
├ ƒ /api/auth/check-status-internal           0 B         103 kB        
├ ƒ /api/auth/generate-2fa                    0 B         103 kB        
├ ƒ /api/auth/login                           0 B         103 kB        
├ ƒ /api/auth/password-update                 0 B         103 kB        
├ ƒ /api/auth/register                        0 B         103 kB        
├ ƒ /api/auth/verify-2fa                      0 B         103 kB        
├ ƒ /api/block-draft                          0 B         103 kB        
├ ƒ /api/block-draft-comment-like             0 B         103 kB        
├ ƒ /api/block-draft-comments                 0 B         103 kB        
├ ƒ /api/block-draft-like                     0 B         103 kB        
├ ƒ /api/block-drafts                         0 B         103 kB        
├ ƒ /api/categories                           0 B         103 kB        
├ ƒ /api/ensure-subscription                  0 B         103 kB        
├ ƒ /api/generate-description                 0 B         103 kB
├ ƒ /api/highlight                            0 B         103 kB        
├ ƒ /api/highlight-code                       0 B         103 kB        
├ ƒ /api/highlighted-block                    0 B         103 kB        
├ ƒ /api/link-preview                         0 B         103 kB        
├ ƒ /api/newsletter-list                      0 B         103 kB        
├ ƒ /api/notification-add                     0 B         103 kB        
├ ƒ /api/notification-delete                  0 B         103 kB        
├ ƒ /api/notifications-list                   0 B         103 kB        
├ ƒ /api/notifications-polling                0 B         103 kB        
├ ƒ /api/profile-avatar                       0 B         103 kB        
├ ƒ /api/profile-delete                       0 B         103 kB        
├ ƒ /api/profile-history                      0 B         103 kB        
├ ƒ /api/profile-history-empty                0 B         103 kB        
├ ƒ /api/profile-newsletters                  0 B         103 kB        
├ ƒ /api/profile-plan                         0 B         103 kB        
├ ƒ /api/profile-plan-simple                  0 B         103 kB        
├ ƒ /api/profile-requests                     0 B         103 kB        
├ ƒ /api/profile-token-status                 0 B         103 kB        
├ ƒ /api/profile-token-status-simple          0 B         103 kB        
├ ƒ /api/profile-update                       0 B         103 kB        
├ ƒ /api/profile/auditlog                     0 B         103 kB        
├ ƒ /api/profile/auditlog-simple              0 B         103 kB        
├ ƒ /api/published-blocks                     0 B         103 kB        
├ ƒ /api/report-block-draft                   0 B         103 kB        
├ ƒ /api/report-block-draft-comment           0 B         103 kB        
├ ƒ /api/search-bloggers                      0 B         103 kB        
├ ○ /blogs (410 ms)                        2.5 kB         109 kB        
├ ○ /blogs/[id] (408 ms)                  4.76 kB         142 kB        
├ ○ /create-blog (406 ms)                 7.25 kB         110 kB        
├   └ css/d255eefa5683a6f9.css             1.5 kB
├ ○ /dashboard (407 ms)                   3.25 kB         109 kB        
├   └ css/a9611ae8c5049ae3.css            2.19 kB
├ ○ /datenschutz (408 ms)                 16.1 kB         122 kB        
├ ○ /impressum (408 ms)                   1.13 kB         107 kB        
├ ○ /login                                1.75 kB         108 kB        
├ ○ /profile                              6.55 kB         113 kB        
├   └ css/ab4163907c9b775f.css            3.71 kB
├ ○ /profile/two-factor                     822 B         110 kB        
├ ○ /profile/two-factor-activate          1.03 kB         110 kB        
└ ○ /register                              700 kB         806 kB        
+ First Load JS shared by all              103 kB
  ├ chunks/framework-306aa0968ce8efc5.js  57.7 kB
  ├ chunks/main-6263e94550d9af4b.js       33.5 kB
  └ other shared chunks (total)           12.3 kB

ƒ Middleware                              54.2 kB

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand

```

- Nutze `console.log()` im Code (nur während Entwicklung).
- Optional: `debug`-Paket nutzen:

```bash
DEBUG=app:* npm run dev
```

---

### 🗂 Admin-Logs
Im Admin-Panel unter "Logs" findest du Einträge wie:
- Login-Versuche
- Rollenänderungen
- Beitragsfreigaben
- Systemaktionen (z. B. neue Registrierung)

Diese stammen aus der `AuditLog`-Tabelle:

```prisma
model AuditLog {
  id        Int      @id @default(autoincrement())
  action    String
  details   String
  userId    String?
  createdAt DateTime @default(now())
}
```

---

## 🧪 Health Checks
Für produktive Deployments (z. B. Docker oder Server):

- Richte eine Monitoring-Route ein: `/api/health`
- Rückgabe:

```json
{ "status": "ok" }
```

---

## 🔐 Sicherheitshinweise
- Log-Dateien regelmäßig prüfen
- Admin-Aktivitäten dokumentieren
- Verdächtige IPs blockieren
- 2FA aktivieren
