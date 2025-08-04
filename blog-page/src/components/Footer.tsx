import React from "react";

export default function Footer() {
  return (
    <footer style={{
      width: '100%',
      background: '#f8f9fa',
      color: '#333',
      textAlign: 'center',
      padding: '18px 0 10px 0',
      fontSize: 15,
      borderTop: '1px solid #e5e5e5',
      marginTop: 'auto'
    }}>
      <div style={{marginBottom: 6}}>
        <a href="/datenschutz" style={{color: '#007bff', textDecoration: 'underline', marginRight: 16}}>Datenschutz</a>
        <a href="/impressum" style={{color: '#007bff', textDecoration: 'underline', marginRight: 16}}>Impressum</a>
      </div>
      <div style={{fontSize: 14, color: '#666'}}>
        &copy; 2025 DaonWare
      </div>
    </footer>
  );
}
