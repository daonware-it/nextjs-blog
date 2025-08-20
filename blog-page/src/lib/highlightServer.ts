// Hauptmodul und Plugins
import 'prismjs/plugins/keep-markup/prism-keep-markup';
import 'prismjs/plugins/normalize-whitespace/prism-normalize-whitespace';

// Kernkomponenten und Sprachen
import 'prismjs/components/prism-core';

// Basissprachen
import 'prismjs/components/prism-markup';           // HTML
import 'prismjs/components/prism-markup-templating'; // Template-System
import 'prismjs/components/prism-clike';            // C-like
import 'prismjs/components/prism-javascript';       // JavaScript
import 'prismjs/components/prism-php-extras';       // PHP Extras
import 'prismjs/components/prism-php';              // PHP selbst
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-bash';

// Weitere Programmiersprachen
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';

export async function highlightCodeServer(code: string, language: string): Promise<string> {
  try {
    const response = await fetch('/api/highlight', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        language: language?.toLowerCase() || 'plaintext'
      }),
    });

    if (!response.ok) {
      // Versuche die Fehlermeldung aus der Antwort zu lesen
      const errorData = await response.json().catch(() => ({}));
      console.error('Server-Antwort:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      // Fallback: Basic HTML Escaping
      const escapedCode = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return `<pre><code class="language-${language}">${escapedCode}</code></pre>`;
    }

    const data = await response.json();
    return data.html;
  } catch (e) {
    console.error('Highlighting-Fehler:', e);
    // Fallback: Basic HTML Escaping
    const escapedCode = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<pre><code class="language-${language}">${escapedCode}</code></pre>`;
  }
}
