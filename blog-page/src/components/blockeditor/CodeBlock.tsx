// Verschoben nach blockeditor/CodeBlock.tsx


import React, { useState, useEffect } from 'react';
import styles from './CodeBlock.module.css';
import { highlightCodeServer } from '@/lib/highlightServer';

interface CodeBlockProps {
  code: string;
  language: string;
  onChange: (code: string, language: string, highlightedCode?: string) => void;
  defaultEditing?: boolean;
}

const codeBlockEditingState: { [key: string]: boolean } = {};

const SUPPORTED_LANGUAGES = [
  // Webentwicklung
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'scss', label: 'SCSS' },
  { value: 'less', label: 'LESS' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'jsx', label: 'JSX' },
  { value: 'tsx', label: 'TSX' },
  { value: 'vue', label: 'Vue' },
  { value: 'php', label: 'PHP' },

  // Programmiersprachen
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'csharp', label: 'C#' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'dart', label: 'Dart' },
  { value: 'r', label: 'R' },

  // Datenbanken
  { value: 'sql', label: 'SQL' },
  { value: 'plsql', label: 'PL/SQL' },
  { value: 'mongodb', label: 'MongoDB' },
  { value: 'graphql', label: 'GraphQL' },

  // Markup & Data
  { value: 'xml', label: 'XML' },
  { value: 'json', label: 'JSON' },
  { value: 'yaml', label: 'YAML' },
  { value: 'toml', label: 'TOML' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'latex', label: 'LaTeX' },

  // Shell & Konfiguration
  { value: 'bash', label: 'Bash' },
  { value: 'shell', label: 'Shell' },
  { value: 'powershell', label: 'PowerShell' },
  { value: 'docker', label: 'Dockerfile' },
  { value: 'nginx', label: 'Nginx' },
  { value: 'apache', label: 'Apache' },
  
  // Cloud & Infrastructure
  { value: 'terraform', label: 'Terraform' },
  { value: 'kubernetes', label: 'Kubernetes' },
  { value: 'hcl', label: 'HCL' },
  { value: 'cloudformation', label: 'CloudFormation' },

  // Andere
  { value: 'plaintext', label: 'Plain Text' },
  { value: 'diff', label: 'Diff' },
  { value: 'ini', label: 'INI' },
  { value: 'env', label: '.env' }
];

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, language, onChange, defaultEditing = false }) => {
  const [highlightedCode, setHighlightedCode] = useState('');
  
  // Erstelle eine eindeutige ID für diesen Block basierend auf dem Code und der Sprache
  const blockId = React.useMemo(() => {
    return `${code.slice(0, 20)}_${language}_${Math.random().toString(36).slice(2, 7)}`;
  }, []);

  // Initialisiere den Bearbeitungszustand, wenn er noch nicht existiert
  React.useEffect(() => {
    if (codeBlockEditingState[blockId] === undefined) {
      codeBlockEditingState[blockId] = defaultEditing;
    }
  }, [blockId, defaultEditing]);

  const [isEditing, setIsEditing] = useState(codeBlockEditingState[blockId] || defaultEditing);

  // Syntax-Highlighting aktualisieren wenn sich Code oder Sprache ändern
  useEffect(() => {
    if (!isEditing && language) {
      // Status für das Highlighting
      let isMounted = true;

      // Führe das Highlighting durch
      (async () => {
        try {
          // Wenn kein Code vorhanden ist, zeige einen leeren Block an
          if (!code) {
            setHighlightedCode(`<pre><code class="language-${language}"></code></pre>`);
            return;
          }

          const highlighted = await highlightCodeServer(code, language);
          
          // Nur aktualisieren wenn die Komponente noch mounted ist
          if (isMounted) {
            setHighlightedCode(highlighted);
          }
        } catch (err) {
          console.error('Highlighting fehlgeschlagen:', {
            error: err,
            language,
            code: code?.substring(0, 100) + '...'
          });
          
          // Nur aktualisieren wenn die Komponente noch mounted ist
          if (isMounted) {
            // Fallback mit einfachem HTML Escaping
            const escapedCode = (code || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            setHighlightedCode(`<pre><code class="language-${language}">${escapedCode}</code></pre>`);
          }
        }
      })();

      // Cleanup-Funktion
      return () => {
        isMounted = false;
      };
    }
  }, [code, language, isEditing]);

  // Aktualisiere den globalen Zustand wenn sich isEditing ändert
  React.useEffect(() => {
    codeBlockEditingState[blockId] = isEditing;
  }, [isEditing, blockId]);

  const handleCodeChange = async (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = event.target.value;
    try {
      if (newCode && language) {
        const highlighted = await highlightCodeServer(newCode, language);
        onChange(newCode, language, highlighted);
      } else {
        onChange(newCode, language);
      }
    } catch (error) {
      onChange(newCode, language);
    }
  };

  const handleLanguageChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = event.target.value;
    try {
      if (code && newLanguage) {
        const highlighted = await highlightCodeServer(code, newLanguage);
        onChange(code, newLanguage, highlighted);
      } else {
        onChange(code, newLanguage);
      }
    } catch (error) {
      onChange(code, newLanguage);
    }
  };

  return (
    <div className={styles.codeBlockWrapper}>
      <div className={styles.codeBlockHeader}>
        <select 
          value={language} 
          onChange={handleLanguageChange}
          className={styles.languageSelect}
        >
          <option value="">Sprache wählen...</option>
          {SUPPORTED_LANGUAGES.map(lang => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
        <button
          className={styles.toggleEditButton}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsEditing(!isEditing);
          }}
        >
          {isEditing ? 'Vorschau' : 'Bearbeiten'}
        </button>
      </div>
      
      <div className={styles.codeBlockContent}>
        {isEditing ? (
          <textarea
            value={code}
            onChange={handleCodeChange}
            className={styles.codeEditor}
            placeholder="Code hier eingeben..."
            spellCheck={false}
          />
        ) : (
          <div dangerouslySetInnerHTML={{ __html: highlightedCode }} />
        )}
      </div>
    </div>
  );
};

export default CodeBlock;
