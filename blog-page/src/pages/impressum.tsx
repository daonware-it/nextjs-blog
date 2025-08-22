import React from "react";
import Head from "next/head";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function ImpressumPage() {
  return (
    <div style={{display: "flex", flexDirection: "column", minHeight: "100vh", fontFamily: "Poppins, Inter, Arial, sans-serif"}}>
      <Head>
        <title>Impressum | DaonWare</title>
      </Head>
      <Navbar />
      <main style={{flex: 1, maxWidth: 800, margin: "60px auto", padding: 32, background: "#fff", borderRadius: 12, boxShadow: "0 2px 16px rgba(0,0,0,0.06)"}}>
        <h1 style={{fontSize: 32, marginBottom: 24, color: "#222"}}>Dummy Überschrift</h1>
        <section style={{marginBottom: 24}}>
          <h2 style={{fontSize: 20, marginBottom: 8}}>Dummy Abschnitt 1</h2>
          <p>Lorem ipsum dolor sit amet.<br />Consectetur adipiscing elit.<br />Dummy Straße 1<br />12345 Dummy-Stadt</p>
        </section>
        <section style={{marginBottom: 24}}>
          <h2 style={{fontSize: 20, marginBottom: 8}}>Dummy Abschnitt 2</h2>
          <p>Telefon: 0123456789<br />E-Mail: <a href="mailto:dummy@example.com">dummy@example.com</a></p>
        </section>
        <section style={{marginBottom: 24}}>
          <h2 style={{fontSize: 20, marginBottom: 8}}>Dummy Abschnitt 3</h2>
          <p>Lorem Ipsum Dummy</p>
        </section>
        <section style={{marginBottom: 24}}>
          <h2 style={{fontSize: 20, marginBottom: 8}}>Dummy Abschnitt 4</h2>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis euismod urna eu tincidunt.</p>
        </section>
        <section style={{marginBottom: 24}}>
          <h2 style={{fontSize: 20, marginBottom: 8}}>Dummy Abschnitt 5</h2>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
          <p>E-Mail: <a href="mailto:dummy@example.com">dummy@example.com</a><br />Telefon: 0123456789</p>
          <p>Sprache: Dummy</p>
        </section>
        <section style={{marginBottom: 24}}>
          <h2 style={{fontSize: 20, marginBottom: 8}}>Dummy Abschnitt 6</h2>
          <p><a href="#" target="_blank" rel="noopener noreferrer">Dummy Link</a></p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
