import { NextApiRequest, NextApiResponse } from 'next';
import hljs from 'highlight.js/lib/core';

// Basis-Sprachen
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import php from 'highlight.js/lib/languages/php';
import python from 'highlight.js/lib/languages/python';
import xml from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import sql from 'highlight.js/lib/languages/sql';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';
import markdown from 'highlight.js/lib/languages/markdown';

// Registriere die Sprachen
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('php', php);
hljs.registerLanguage('python', python);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('css', css);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('json', json);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('markdown', markdown);

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { code, language } = req.body;

    if (!code || !language || typeof language !== 'string') {
      return res.status(400).json({ message: 'Code and language are required' });
    }

    let lang = language.toLowerCase();
    let processedCode = code;
    // processedCode absichern
    if (typeof processedCode !== 'string') {
      processedCode = String(processedCode);
    }
    // Spezielle Behandlung für PHP
    if (lang === 'php') {
      // Entferne vorhandene PHP-Tags, um sie konsistent hinzuzufügen
      let trimmedCode = processedCode.trim();
      if (trimmedCode.startsWith('<?php')) {
        trimmedCode = trimmedCode.substring(5);
      }
      if (trimmedCode.endsWith('?>')) {
        trimmedCode = trimmedCode.substring(0, trimmedCode.length - 2);
      }
      // Füge PHP-Tags hinzu
      processedCode = `<?php\n${trimmedCode.trim()}\n?>`;
    }

    try {
      // Versuche das Highlighting durchzuführen
      let result;
      
      try {
        // Auto-Detect Sprache wenn nicht angegeben oder nicht unterstützt
        if (!lang || !hljs.getLanguage(lang)) {
          result = hljs.highlightAuto(processedCode);
          lang = result.language || 'plaintext';
        } else {
          result = hljs.highlight(processedCode, { language: lang });
        }

        let highlighted = result.value;

        // Spezielle Behandlung für PHP
        if (lang === 'php') {
          // Verbesserte PHP-Tag Hervorhebung
          highlighted = highlighted
            .replace(/(&lt;\?php\b)/g, '<span class="hljs-meta">&lt;?php</span>')
            .replace(/(\?&gt;)/g, '<span class="hljs-meta">?&gt;</span>');
        }

        // Ausgabe für alle Sprachen
        return res.status(200).json({
          html: `<pre class="hljs language-${lang}"><code>${highlighted}</code></pre>`
        });
      } catch (err) {
        console.error('Highlighting-Fehler:', err);
        // Fallback zu einfachem Escaping
        const escapedCode = processedCode
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
          
        return res.status(200).json({
          html: `<pre class="hljs language-${lang}"><code>${escapedCode}</code></pre>`
        });
      }
    } catch (highlightError) {
      console.error('Highlighting error:', highlightError);
      // Fallback: Basic HTML Escaping
      const escapedCode = processedCode
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      return res.status(200).json({
        html: `<pre class="language-${lang}"><code class="language-${lang}">${escapedCode}</code></pre>`
      });
    }
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ 
      message: 'Error processing code', 
      error: error.message,
      stack: error.stack 
    });
  }
}
