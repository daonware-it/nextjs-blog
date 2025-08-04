import React from "react";
import Head from "next/head";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function DatenschutzPage() {
  return (
    <div style={{display: "flex", flexDirection: "column", minHeight: "100vh", fontFamily: "Poppins, Inter, Arial, sans-serif"}}>
      <Head>
        <title>Datenschutzerklärung | DaonWare</title>
      </Head>
      <Navbar />
      <main style={{flex: 1, maxWidth: 800, margin: "60px auto", padding: 24}}>
        <section style={{marginBottom: 32}}>
          <div style={{background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.04)", padding: 28, fontSize: 16, lineHeight: 1.7}}>
            <h1 style={{marginTop: 0, marginBottom: 24, fontSize: 28, color: "#2a3a4a"}}>Dummy Überschrift</h1>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque euismod, urna eu tincidunt consectetur, nisi nisl aliquam nunc, eget aliquam massa nisi nec erat.</p>
            <p>Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Integer ac sem nec urna cursus faucibus.</p>
            <p>Morbi non urna vitae elit cursus dictum. Nullam euismod, nisi vel consectetur cursus, nisl nunc cursus nisi, euismod aliquam nunc nisl euismod.</p>
          

            <h2 style={{marginTop: 32, marginBottom: 18, fontSize: 22, color: "#2a3a4a"}}>Dummy Abschnitt 1</h2>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis euismod, urna eu tincidunt consectetur, nisi nisl aliquam nunc, eget aliquam massa nisi nec erat.</p>
            <p>Phasellus dictum, urna eu tincidunt consectetur, nisi nisl aliquam nunc, eget aliquam massa nisi nec erat.</p>
          
            <ul style={{marginTop: 18, marginBottom: 0, paddingLeft: 18}}>
              <li><b>a)</b> Lorem ipsum dolor sit amet, consectetur adipiscing elit.</li>
              <li><b>b)</b> Pellentesque euismod, urna eu tincidunt consectetur.</li>
              <li><b>c)</b> Duis euismod, urna eu tincidunt consectetur, nisi nisl aliquam nunc.</li>
              <li><b>d)</b> Morbi non urna vitae elit cursus dictum.</li>
              <li><b>e)</b> Nullam euismod, nisi vel consectetur cursus, nisl nunc cursus nisi.</li>
              <li><b>f)</b> Vestibulum ante ipsum primis in faucibus orci luctus.</li>
              <li><b>g)</b> Integer ac sem nec urna cursus faucibus.</li>
              <li><b>h)</b> Etiam euismod, urna eu tincidunt consectetur.</li>
              <li><b>i)</b> Proin euismod, urna eu tincidunt consectetur.</li>
              <li><b>j)</b> Sed euismod, urna eu tincidunt consectetur.</li>
              <li><b>k)</b> Aenean euismod, urna eu tincidunt consectetur.</li>
            </ul>

            <h2 style={{marginTop: 32, marginBottom: 18, fontSize: 22, color: "#2a3a4a"}}>Dummy Abschnitt 2</h2>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis euismod, urna eu tincidunt consectetur, nisi nisl aliquam nunc, eget aliquam massa nisi nec erat.</p>
            <div style={{margin: "18px 0 0 0", paddingLeft: 12}}>
              <div><b>Dummy Firma</b></div>
              <div>Dummy Straße 123</div>
              <div>12345 Dummy-Stadt</div>
              <div>Deutschland</div>
              <div style={{marginTop: 8}}>Tel.: 0123456789</div>
              <div>E-Mail: <a href="mailto:dummy@example.com">dummy@example.com</a></div>
              <div>Website: <a href="https://www.example.com" target="_blank" rel="noopener noreferrer">www.example.com</a></div>
            </div>

            <h2 style={{marginTop: 32, marginBottom: 18, fontSize: 22, color: "#2a3a4a"}}>Dummy Abschnitt 3</h2>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis euismod, urna eu tincidunt consectetur, nisi nisl aliquam nunc, eget aliquam massa nisi nec erat.</p>
            <p>Phasellus dictum, urna eu tincidunt consectetur, nisi nisl aliquam nunc, eget aliquam massa nisi nec erat.</p>
            <p>Morbi non urna vitae elit cursus dictum. Nullam euismod, nisi vel consectetur cursus, nisl nunc cursus nisi, euismod aliquam nunc nisl euismod.</p>
            <p>Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Integer ac sem nec urna cursus faucibus.</p>
            <p>Etiam euismod, urna eu tincidunt consectetur, nisi nisl aliquam nunc, eget aliquam massa nisi nec erat.</p>
          
            <h2 style={{marginTop: 32, marginBottom: 18, fontSize: 22, color: "#2a3a4a"}}>Dummy Abschnitt 4</h2>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis euismod, urna eu tincidunt consectetur, nisi nisl aliquam nunc, eget aliquam massa nisi nec erat.</p>
            <ul style={{marginTop: 0, marginBottom: 16, paddingLeft: 18}}>
              <li>Dummy Punkt 1</li>
              <li>Dummy Punkt 2</li>
              <li>Dummy Punkt 3</li>
              <li>Dummy Punkt 4</li>
              <li>Dummy Punkt 5</li>
              <li>Dummy Punkt 6</li>
              <li>Dummy Punkt 7</li>
              <li>Dummy Punkt 8</li>
            </ul>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis euismod, urna eu tincidunt consectetur, nisi nisl aliquam nunc, eget aliquam massa nisi nec erat.</p>
            <ul style={{marginTop: 0, marginBottom: 16, paddingLeft: 18}}>
              <li>Dummy Punkt A</li>
              <li>Dummy Punkt B</li>
              <li>Dummy Punkt C</li>
              <li>Dummy Punkt D</li>
            </ul>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis euismod, urna eu tincidunt consectetur, nisi nisl aliquam nunc, eget aliquam massa nisi nec erat.</p>

            <h2 style={{marginTop: 32, marginBottom: 18, fontSize: 22, color: "#2a3a4a"}}>Dummy Abschnitt 5</h2>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis euismod, urna eu tincidunt consectetur, nisi nisl aliquam nunc, eget aliquam massa nisi nec erat.</p>
            <p>Phasellus dictum, urna eu tincidunt consectetur, nisi nisl aliquam nunc, eget aliquam massa nisi nec erat.</p>
            <ul style={{marginTop: 0, marginBottom: 16, paddingLeft: 18}}>
              <li>Dummy Punkt X</li>
              <li>Dummy Punkt Y</li>
              <li>Dummy Punkt Z</li>
            </ul>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis euismod, urna eu tincidunt consectetur, nisi nisl aliquam nunc, eget aliquam massa nisi nec erat.</p>
            <h2 style={{marginTop: 32, marginBottom: 18, fontSize: 22, color: "#2a3a4a"}}>Dummy Abschnitt 6</h2>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis euismod, urna eu tincidunt consectetur, nisi nisl aliquam nunc, eget aliquam massa nisi nec erat.</p>
            <ul style={{marginTop: 0, marginBottom: 16, paddingLeft: 18}}>
              <li>Dummy Punkt 1</li>
              <li>Dummy Punkt 2</li>
              <li>Dummy Punkt 3</li>
            </ul>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis euismod, urna eu tincidunt consectetur, nisi nisl aliquam nunc, eget aliquam massa nisi nec erat.</p>
            <h2 style={{marginTop: 32, marginBottom: 18, fontSize: 22, color: "#2a3a4a"}}>Dummy Abschnitt 7</h2>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis euismod, urna eu tincidunt consectetur, nisi nisl aliquam nunc, eget aliquam massa nisi nec erat.</p>
            <ul style={{marginTop: 0, marginBottom: 16, paddingLeft: 18}}>
              <li>Dummy Punkt A</li>
              <li>Dummy Punkt B</li>
              <li>Dummy Punkt C</li>
              <li>Dummy Punkt D</li>
            </ul>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis euismod, urna eu tincidunt consectetur, nisi nisl aliquam nunc, eget aliquam massa nisi nec erat.</p>
            <h2 style={{marginTop: 32, marginBottom: 18, fontSize: 22, color: "#2a3a4a"}}>Dummy Abschnitt 8</h2>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis euismod, urna eu tincidunt consectetur, nisi nisl aliquam nunc, eget aliquam massa nisi nec erat.</p>
            <ul style={{marginTop: 0, marginBottom: 16, paddingLeft: 18}}>
              <li>Dummy Punkt Alpha</li>
              <li>Dummy Punkt Beta</li>
              <li>Dummy Punkt Gamma</li>
            </ul>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis euismod, urna eu tincidunt consectetur, nisi nisl aliquam nunc, eget aliquam massa nisi nec erat.</p>

            <h2 style={{marginTop: 32, marginBottom: 18, fontSize: 22, color: "#2a3a4a"}}>9. Kommentarfunktion im Blog auf der Internetseite</h2>
            <p>Die DaonWare bietet den Nutzern auf einem Blog die Möglichkeit, individuelle Kommentare zu einzelnen Blog-Beiträgen zu hinterlassen. Ein Blog ist ein öffentlich einsehbares Portal, in dem Artikel gepostet und von Dritten kommentiert werden können.</p>
            <ul style={{marginTop: 0, marginBottom: 16, paddingLeft: 18}}>
              <li>Bei Kommentaren werden neben dem Kommentar auch Zeitpunkt der Eingabe und der gewählte Nutzername (Pseudonym) gespeichert und veröffentlicht.</li>
              <li>Die vom Internet-Service-Provider (ISP) vergebene IP-Adresse wird mitprotokolliert. Dies dient Sicherheitszwecken und dem Schutz vor Rechtsverletzungen.</li>
              <li>Die Speicherung der IP-Adresse erfolgt im Interesse des Verantwortlichen, um sich im Falle einer Rechtsverletzung exkulpieren zu können.</li>
              <li>Eine Weitergabe der erhobenen personenbezogenen Daten an Dritte erfolgt nicht, außer sie ist gesetzlich vorgeschrieben oder dient der Rechtsverteidigung.</li>
            </ul>

            <h2 style={{marginTop: 32, marginBottom: 18, fontSize: 22, color: "#2a3a4a"}}>10. Routinemäßige Löschung und Sperrung von personenbezogenen Daten</h2>
            <p>Der für die Verarbeitung Verantwortliche verarbeitet und speichert personenbezogene Daten der betroffenen Person nur für den Zeitraum, der zur Erreichung des Speicherungszwecks erforderlich ist oder sofern dies durch gesetzliche Vorschriften vorgesehen wurde.</p>
            <ul style={{marginTop: 0, marginBottom: 16, paddingLeft: 18}}>
              <li>Entfällt der Speicherungszweck oder läuft eine gesetzlich vorgeschriebene Speicherfrist ab, werden die personenbezogenen Daten routinemäßig und entsprechend den gesetzlichen Vorschriften gesperrt oder gelöscht.</li>
            </ul>

            <h2 style={{marginTop: 32, marginBottom: 18, fontSize: 22, color: "#2a3a4a"}}>Dummy Abschnitt 9</h2>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis euismod, urna eu tincidunt consectetur, nisi nisl aliquam nunc, eget aliquam massa nisi nec erat.</p>
            <ul style={{marginTop: 0, marginBottom: 16, paddingLeft: 18}}>
              <li>Dummy Punkt 1</li>
              <li>Dummy Punkt 2</li>
              <li>Dummy Punkt 3</li>
            </ul>
            <h2 style={{marginTop: 32, marginBottom: 18, fontSize: 22, color: "#2a3a4a"}}>Dummy Abschnitt 10</h2>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis euismod, urna eu tincidunt consectetur, nisi nisl aliquam nunc, eget aliquam massa nisi nec erat.</p>
            <ul style={{marginTop: 0, marginBottom: 16, paddingLeft: 18}}>
              <li>Dummy Punkt A</li>
              <li>Dummy Punkt B</li>
            </ul>
            <h2 style={{marginTop: 32, marginBottom: 18, fontSize: 22, color: "#2a3a4a"}}>Dummy Abschnitt 11</h2>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis euismod, urna eu tincidunt consectetur, nisi nisl aliquam nunc, eget aliquam massa nisi nec erat.</p>
            <ul style={{marginTop: 0, marginBottom: 16, paddingLeft: 18}}>
              <li>Dummy Punkt Alpha</li>
              <li>Dummy Punkt Beta</li>
              <li>Dummy Punkt Gamma</li>
            </ul>
            <h2 style={{marginTop: 32, marginBottom: 18, fontSize: 22, color: "#2a3a4a"}}>Dummy Abschnitt 12</h2>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis euismod, urna eu tincidunt consectetur, nisi nisl aliquam nunc, eget aliquam massa nisi nec erat.</p>
            <ul style={{marginTop: 0, marginBottom: 16, paddingLeft: 18}}>
              <li>Dummy Punkt X</li>
              <li>Dummy Punkt Y</li>
              <li>Dummy Punkt Z</li>
            </ul>
            <ul style={{marginTop: 0, marginBottom: 16, paddingLeft: 18}}>
              <li>Wir klären Sie darüber auf, dass die Bereitstellung personenbezogener Daten zum Teil gesetzlich vorgeschrieben ist (z.B. Steuervorschriften) oder sich auch aus vertraglichen Regelungen (z.B. Angaben zum Vertragspartner) ergeben kann.</li>
              <li>Mitunter kann es zu einem Vertragsschluss erforderlich sein, dass eine betroffene Person uns personenbezogene Daten zur Verfügung stellt, die in der Folge durch uns verarbeitet werden müssen.</li>
              <li>Die betroffene Person ist beispielsweise verpflichtet uns personenbezogene Daten bereitzustellen, wenn unser Unternehmen mit ihr einen Vertrag abschließt.</li>
              <li>Eine Nichtbereitstellung der personenbezogenen Daten hätte zur Folge, dass der Vertrag mit dem Betroffenen nicht geschlossen werden könnte.</li>
              <li>Vor einer Bereitstellung personenbezogener Daten durch den Betroffenen muss sich der Betroffene an einen unserer Mitarbeiter wenden. Unser Mitarbeiter klärt den Betroffenen einzelfallbezogen darüber auf, ob die Bereitstellung der personenbezogenen Daten gesetzlich oder vertraglich vorgeschrieben oder für den Vertragsabschluss erforderlich ist, ob eine Verpflichtung besteht, die personenbezogenen Daten bereitzustellen, und welche Folgen die Nichtbereitstellung der personenbezogenen Daten hätte.</li>
            </ul>

            <h2 style={{marginTop: 32, marginBottom: 18, fontSize: 22, color: "#2a3a4a"}}>21. Bestehen einer automatisierten Entscheidungsfindung</h2>
            <ul style={{marginTop: 0, marginBottom: 16, paddingLeft: 18}}>
              <li>Als verantwortungsbewusstes Unternehmen verzichten wir auf eine automatische Entscheidungsfindung oder ein Profiling.</li>
            </ul>

            <div style={{marginTop: 32, marginBottom: 18, fontSize: 15, color: "#2a3a4a"}}>
              Diese Datenschutzerklärung wurde durch den Datenschutzerklärungs-Generator der DGD Deutsche Gesellschaft für Datenschutz GmbH, die als <a href="https://dg-datenschutz.de/datenschutz-dienstleistungen/externer-datenschutzbeauftragter/" target="_blank" rel="noopener noreferrer">Externer Datenschutzbeauftragter Erlangen</a> tätig ist, in Kooperation mit dem <a href="https://www.wbs.legal/it-recht/datenschutzrecht/" target="_blank" rel="noopener noreferrer">IT- und Datenschutzrecht Anwalt Christian Solmecke</a> erstellt.
            </div>
          </div>
          </section>
      </main>
      <Footer />
    </div>
  );
}
