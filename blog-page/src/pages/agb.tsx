
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
            <h1 style={{marginTop: 0, marginBottom: 24, fontSize: 28, color: "#2a3a4a"}}>Dummy Überschrift</h1>

            <h2 style={{marginTop: 32, marginBottom: 18, fontSize: 22, color: "#2a3a4a"}}>Dummy Abschnitt 1</h2>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis euismod, urna eu tincidunt consectetur.</p>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis euismod, urna eu tincidunt consectetur.</p>
            <div style={{margin: "18px 0 0 0", paddingLeft: 12}}>
              Dummy Name<br />
              Dummy Straße 1, 12345 Dummy-Stadt, Deutschland<br />
              E-Mail: dummy@example.com
            </div>

            <h2 style={{marginTop: 32, marginBottom: 18, fontSize: 22, color: "#2a3a4a"}}>Dummy Abschnitt 2</h2>
            <ul style={{marginTop: 0, marginBottom: 16, paddingLeft: 18}}>
              <li>Lorem ipsum dolor sit amet.</li>
              <li>Consectetur adipiscing elit.</li>
              <li>Duis euismod urna eu tincidunt.</li>
              <li>Vestibulum ante ipsum primis.</li>
              <li>Morbi non urna vitae elit cursus.</li>
            </ul>

            <h2 style={{marginTop: 32, marginBottom: 18, fontSize: 22, color: "#2a3a4a"}}>Dummy Abschnitt 3</h2>
            <ul style={{marginTop: 0, marginBottom: 16, paddingLeft: 18}}>
              <li>Lorem ipsum dolor sit amet.</li>
              <li>Consectetur adipiscing elit.</li>
              <li>Duis euismod urna eu tincidunt.</li>
              <li>Vestibulum ante ipsum primis.</li>
            </ul>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis euismod, urna eu tincidunt consectetur.</p>

            <h2 style={{marginTop: 32, marginBottom: 18, fontSize: 22, color: "#2a3a4a"}}>Dummy Abschnitt 4</h2>
            <ul style={{marginTop: 0, marginBottom: 16, paddingLeft: 18}}>
              <li>Lorem ipsum dolor sit amet.</li>
              <li>Consectetur adipiscing elit.</li>
            </ul>

            <h2 style={{marginTop: 32, marginBottom: 18, fontSize: 22, color: "#2a3a4a"}}>Dummy Abschnitt 5</h2>
            <ul style={{marginTop: 0, marginBottom: 16, paddingLeft: 18}}>
              <li>Lorem ipsum dolor sit amet.</li>
              <li>Consectetur adipiscing elit.</li>
            </ul>

            <h2 style={{marginTop: 32, marginBottom: 18, fontSize: 22, color: "#2a3a4a"}}>Dummy Abschnitt 6</h2>
            <ul style={{marginTop: 0, marginBottom: 16, paddingLeft: 18}}>
              <li>Lorem ipsum dolor sit amet.</li>
              <li>Consectetur adipiscing elit.</li>
            </ul>

            <h2 style={{marginTop: 32, marginBottom: 18, fontSize: 22, color: "#2a3a4a"}}>Dummy Abschnitt 7</h2>
            <ul style={{marginTop: 0, marginBottom: 16, paddingLeft: 18}}>
              <li>Lorem ipsum dolor sit amet.</li>
              <li>Consectetur adipiscing elit.</li>
              <li>Duis euismod urna eu tincidunt.</li>
            </ul>

            <h2 style={{marginTop: 32, marginBottom: 18, fontSize: 22, color: "#2a3a4a"}}>Dummy Abschnitt 8</h2>
            <ul style={{marginTop: 0, marginBottom: 16, paddingLeft: 18}}>
              <li>Lorem ipsum dolor sit amet.</li>
              <li>Consectetur adipiscing elit.</li>
            </ul>

            <h2 style={{marginTop: 32, marginBottom: 18, fontSize: 22, color: "#2a3a4a"}}>Dummy Abschnitt 9</h2>
            <ul style={{marginTop: 0, marginBottom: 16, paddingLeft: 18}}>
              <li>Lorem ipsum dolor sit amet.</li>
              <li>Consectetur adipiscing elit.</li>
            </ul>

            <h2 style={{marginTop: 32, marginBottom: 18, fontSize: 22, color: "#2a3a4a"}}>Dummy Abschnitt 10</h2>
            <ul style={{marginTop: 0, marginBottom: 16, paddingLeft: 18}}>
              <li>Lorem ipsum dolor sit amet.</li>
              <li>Consectetur adipiscing elit.</li>
            </ul>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
