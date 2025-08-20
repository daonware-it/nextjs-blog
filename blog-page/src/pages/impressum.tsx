import React from "react";
import Head from "next/head";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ImpressumPage() {
  return (
    <div style={{display: "flex", flexDirection: "column", minHeight: "100vh", fontFamily: "Poppins, Inter, Arial, sans-serif"}}>
      <Head>
        <title>Impressum | DaonWare</title>
      </Head>
      <Navbar />
      <main style={{flex: 1, maxWidth: 800, margin: "60px auto", padding: 32, background: "#fff", borderRadius: 12, boxShadow: "0 2px 16px rgba(0,0,0,0.06)"}}>
        <h1 style={{fontSize: 32, marginBottom: 24, color: "#222"}}>Impressum</h1>
        <section style={{marginBottom: 24}}>
          <h2 style={{fontSize: 20, marginBottom: 8}}>Verantwortlich</h2>
          <p>Oliver Guttmann<br />Einzelunternehmen<br />Kolberger Str. 1<br />26655 Westerstede</p>
        </section>
        <section style={{marginBottom: 24}}>
          <h2 style={{fontSize: 20, marginBottom: 8}}>Kontakt</h2>
          <p>Telefon: 015141981732<br />E-Mail: <a href="mailto:o.guttmann@daonware.de">o.guttmann@daonware.de</a></p>
        </section>
        <section style={{marginBottom: 24}}>
          <h2 style={{fontSize: 20, marginBottom: 8}}>Redaktionell verantwortlich</h2>
          <p>Oliver Guttmann</p>
        </section>
        <section style={{marginBottom: 24}}>
          <h2 style={{fontSize: 20, marginBottom: 8}}>Verbraucherstreitbeilegung / Universalschlichtungsstelle</h2>
          <p>Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
        </section>
        <section style={{marginBottom: 24}}>
          <h2 style={{fontSize: 20, marginBottom: 8}}>Zentrale Kontaktstelle nach dem Digital Services Act – DSA</h2>
          <p>Unsere zentrale Kontaktstelle für Nutzer und Behörden nach Art. 11, 12 DSA erreichen Sie wie folgt:</p>
          <p>E-Mail: <a href="mailto:O.Guttmann@daonware.de">O.Guttmann@daonware.de</a><br />Telefon: 015141981732</p>
          <p>Die für den Kontakt zur Verfügung stehenden Sprachen sind: Deutsch, Englisch.</p>
        </section>
        <section style={{marginBottom: 24}}>
          <h2 style={{fontSize: 20, marginBottom: 8}}>Quelle</h2>
          <p><a href="https://www.e-recht24.de/impressum-generator.html" target="_blank" rel="noopener noreferrer">e-recht24 Impressum Generator</a></p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
