# 🛠️ Admin-Funktion und Rollen

Die Blog-Plattform bietet ein Admin-Interface, über das Inhalte und Benutzer zentral verwaltet werden können. Dieser Bereich ist nur für Benutzer mit der Rolle `ADMIN` und `MODERATOR` zugänglich.

---

## 🔑 Zugriff auf das Admin-Interface

Das Admin-Dashboard ist erreichbar unter

```bash
/admin
```

Nur authentifizierte Benutzer mit der Rolle `ADMIN` oder `MODERATOR` können auf diese Seite zugreifen. Alle anderen Benutzer werden umgeleitet.

---

### 👤 Benutzerrollen

In der Blog-Plattform gibt es mehrere Rollen mit abgestuften Rechten. Die Rollen sind in der Datenbank als Enum (`Role`) definiert und steuern den Zugriff auf die verschiedenen Bereichs und Funktionen:

| **Rolle** | **Beschreibung** |
|:----------|:-----------------|
|`LESER`|Kann Beiträge lesen und kommentieren, aber kein eigenen Beitrag schreiben|
|`BLOGGER`|Kann eigene Beiträge erstellen und bearbeiten|
|`MODERATOR`|Kann auf das Ticketsystem zugreifen (z.B. zur Moderation gemeldeter Inhalte)|
|`ADMIN`|Hat vollen Zugriff auf alle Bereiche des Systems, inkl. der Benutzerverwaltung|

---

### ✏️ Benutzerverwaltung

Im Admin-Bereich kannst du:

- Registierte Benutzer auflisten
- Rolle über die UI bearbeiten
- Benutzer temporär sperren, löschen oder anpassen
- AI-Coins anpassen

---

### 📄 Beitragsverwaltung

Im Bereich "Beiträge" kannst du:

- Beiträge einsehen (Entwurf, nicht öffentlich, gelöscht, Veröffentlicht)
- Beiträge freigeben oder zurückziehen
- Beiträge sperren (kein Bearbeiten und Posten als `BLOGGER` möglich)
- Änderungen an Kategorien vornehmen

---

### 🔍 Moderation & Logs

- Kommentare oder Beiträge einsehen
- Log-Einträge zu Benutzeraktion + Admin-Interaktion (audit-Trail)
- Geplant: Benachrichtigung bei verdächtigem Verhalten (z.B. 10 fehlgeschlagene 2FA-Versuche)
