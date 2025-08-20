
import React from "react";
import Head from "next/head";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function AgbPage() {
  return (
    <div style={{display: "flex", flexDirection: "column", minHeight: "100vh", fontFamily: "Poppins, Inter, Arial, sans-serif"}}>
      <Head>
        <title>AGB | DaonWare</title>
      </Head>
      <Navbar />
      <main style={{flex: 1, maxWidth: 800, margin: "60px auto", padding: 24}}>
        <section style={{marginBottom: 32}}>
          <div style={{background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.04)", padding: 28, fontSize: 16, lineHeight: 1.7}}>
            <h1 style={{marginTop: 0, marginBottom: 24, fontSize: 28, color: "#2a3a4a"}}>Allgemeine Nutzungsbedingungen</h1>

            <h2 style={{marginTop: 32, marginBottom: 18, fontSize: 22, color: "#2a3a4a"}}>§ 1 Geltungsbereich und Anbieter</h2>
            <p>Diese Nutzungsbedingungen gelten für die Nutzung der Online-Plattform DaonWare.de (im Folgenden „Plattform“).</p>
            <p>Anbieter und verantwortliche Stelle im Sinne des DDG/DSGVO ist:</p>
            <div style={{margin: "18px 0 0 0", paddingLeft: 12}}>
              Oliver Guttmann (Einzelunternehmen)<br />
              Kolberger Str. 1, 26655 Westerstede, Deutschland<br />
              E-Mail: o.guttmann@daonware.de
            </div>

            <h2 style={{marginTop: 32, marginBottom: 18, fontSize: 22, color: "#2a3a4a"}}>§ 2 Registrierung und Nutzerkonto</h2>
            <ul style={{marginTop: 0, marginBottom: 16, paddingLeft: 18}}>
              <li>Die Nutzung der Plattform ist grundsätzlich ohne Registrierung möglich (Gastzugang).</li>
              <li>Für erweiterte Funktionen (z. B. Kommentieren, Beiträge posten, Liken) ist eine Registrierung erforderlich.</li>
              <li>Ein Anspruch auf Registrierung besteht nicht.</li>
              <li>Derzeit gibt es keine Altersbeschränkung. Eltern/Erziehungsberechtigte haften für minderjährige Nutzer.</li>
              <li>Bei der Registrierung sind vollständige und wahrheitsgemäße Angaben zu machen.</li>
            </ul>

            <h2 style={{marginTop: 32, marginBottom: 18, fontSize: 22, color: "#2a3a4a"}}>§ 3 Pflichten der Nutzer</h2>
            <ul style={{marginTop: 0, marginBottom: 16, paddingLeft: 18}}>
              <li>keine Mehrfach-Accounts anzulegen,</li>
              <li>keine Spam-Nachrichten zu verbreiten,</li>
              <li>keine Hassrede, rassistische, pornographische oder sonstige rechtswidrige Inhalte zu veröffentlichen,</li>
              <li>die Rechte Dritter (z. B. Urheberrechte) zu achten.</li>
            </ul>
            <p>Bei Verstößen sind wir berechtigt, Inhalte zu löschen und Nutzerkonten vorübergehend zu sperren oder dauerhaft zu löschen.</p>

            <h2 style={{marginTop: 32, marginBottom: 18, fontSize: 22, color: "#2a3a4a"}}>§ 4 Inhalte und Verantwortung</h2>
            <ul style={{marginTop: 0, marginBottom: 16, paddingLeft: 18}}>
              <li>Nutzer sind für ihre veröffentlichten Inhalte (Beiträge, Kommentare, Links) selbst verantwortlich.</li>
              <li>Der Anbieter übernimmt keine Garantie für die Vollständigkeit, Richtigkeit oder Rechtmäßigkeit von verlinkten externen Inhalten.</li>
            </ul>

            <h2 style={{marginTop: 32, marginBottom: 18, fontSize: 22, color: "#2a3a4a"}}>§ 5 Verfügbarkeit</h2>
            <ul style={{marginTop: 0, marginBottom: 16, paddingLeft: 18}}>
              <li>Der Anbieter ist bemüht, die Plattform jederzeit verfügbar zu halten, übernimmt jedoch keine Garantie für unterbrechungsfreie Erreichbarkeit.</li>
              <li>Wartungen oder technische Ausfälle können jederzeit auftreten.</li>
            </ul>

            <h2 style={{marginTop: 32, marginBottom: 18, fontSize: 22, color: "#2a3a4a"}}>§ 6 Kündigung / Löschung von Accounts</h2>
            <ul style={{marginTop: 0, marginBottom: 16, paddingLeft: 18}}>
              <li>Nutzer können ihr Konto jederzeit selbst löschen oder die Löschung per E-Mail verlangen.</li>
              <li>Der Anbieter kann Nutzerkonten bei schwerwiegenden Verstößen gegen diese Nutzungsbedingungen fristlos sperren oder löschen.</li>
            </ul>

            <h2 style={{marginTop: 32, marginBottom: 18, fontSize: 22, color: "#2a3a4a"}}>§ 7 Haftung</h2>
            <ul style={{marginTop: 0, marginBottom: 16, paddingLeft: 18}}>
              <li>Der Anbieter haftet nur bei Vorsatz oder grober Fahrlässigkeit.</li>
              <li>Für leichte Fahrlässigkeit haftet der Anbieter nur bei Verletzung wesentlicher Vertragspflichten (Kardinalpflichten), jedoch beschränkt auf den vorhersehbaren, vertragstypischen Schaden.</li>
              <li>Die Haftung für Schäden durch Inhalte Dritter wird ausgeschlossen.</li>
            </ul>

            <h2 style={{marginTop: 32, marginBottom: 18, fontSize: 22, color: "#2a3a4a"}}>§ 8 Datenschutz</h2>
            <ul style={{marginTop: 0, marginBottom: 16, paddingLeft: 18}}>
              <li>Die Erhebung und Verarbeitung personenbezogener Daten erfolgt ausschließlich im Rahmen der Datenschutzerklärung.</li>
              <li>IP-Adressen in Server-Logs werden nur zu Sicherheitszwecken erfasst und nach spätestens 7 Tagen gelöscht.</li>
            </ul>

            <h2 style={{marginTop: 32, marginBottom: 18, fontSize: 22, color: "#2a3a4a"}}>§ 9 Änderungen der Nutzungsbedingungen</h2>
            <ul style={{marginTop: 0, marginBottom: 16, paddingLeft: 18}}>
              <li>Der Anbieter behält sich vor, diese Nutzungsbedingungen jederzeit zu ändern.</li>
              <li>Nutzer werden über wesentliche Änderungen rechtzeitig informiert.</li>
            </ul>

            <h2 style={{marginTop: 32, marginBottom: 18, fontSize: 22, color: "#2a3a4a"}}>§ 10 Schlussbestimmungen</h2>
            <ul style={{marginTop: 0, marginBottom: 16, paddingLeft: 18}}>
              <li>Es gilt deutsches Recht.</li>
              <li>Sollte eine Bestimmung dieser Bedingungen unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.</li>
            </ul>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
