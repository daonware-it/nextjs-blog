// ... Datei beginnt mit Imports ...
import ExcerptBlock from "./ExcerptBlock";
import React from "react";
import { Block } from "./BlockTypes";
import Toc from "./Toc";
import Timeline from "./Timeline";
import SpacingBlock from "./SpacingBlock";
import styles from './BlockPreview.module.css';
import TableBlockPreview from './TableBlockPreview';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-powershell';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';

interface BlockPreviewProps {
  block: Block;
  nextBlockType?: string;
  blocks?: Block[];
}

const BlockPreview: React.FC<BlockPreviewProps> = React.memo(({ block, nextBlockType, blocks }) => {
  
  const isDivider = block.type === 'divider' || block.type === 'separator';
  const spacingClass = isDivider ? styles.blockWithSpacing : styles.blockNoSpacing;

  switch (block.type) {
    case "gallery": {
      // GalleryBlockPreview übernimmt die gesamte Vorschau-Logik für Galerie-Modi
      const GalleryBlockPreview = require("./GalleryBlockPreview").default;
      let galleryData = {};
      try {
        
        galleryData = JSON.parse(block.data || '{}');

      } catch (error) {
        console.error("Error parsing gallery data in BlockPreview:", error);
        console.error("Raw data was:", block.data);
      }
      // Füge einen key hinzu, der sich mit den Daten ändert
      return <GalleryBlockPreview key={JSON.stringify(galleryData)} data={galleryData} />;
    }
    case "text": {
      let html = block.data || "";
      html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
      return <p className={spacingClass} dangerouslySetInnerHTML={{ __html: html }} />;
    }
    case "heading": {
      // Zeige block.data (getrimmt) oder, falls leer/whitespace, block.name (getrimmt)
      let headingText = "";
      if (block.data && block.data.trim() !== "") {
        headingText = block.data.trim();
      } else if (block.name && block.name.trim() !== "") {
        headingText = block.name.trim();
      }
      return <h2 className={spacingClass}>{headingText}</h2>;
    }
    case "image": {
      let value: { url: string, aspect?: string, align?: string } = { url: '', aspect: 'original', align: 'center' };
      if (typeof block.data === 'string') {
        try {
          value = JSON.parse(block.data);
        } catch {
          value = { url: block.data, aspect: 'original', align: 'center' };
        }
      } else if (block.data && typeof block.data === 'object' && !Array.isArray(block.data)) {
        value = { url: '', aspect: 'original', align: 'center', ...(block.data as Record<string, any>) };
      }

      const getAspectRatio = (aspect: string) => {
        switch (aspect) {
          case 'square': return '1 / 1';
          case '16:9': return '16 / 9';
          case '4:3': return '4 / 3';
          default: return undefined;
        }
      };
      let justifyContent: 'flex-start' | 'center' | 'flex-end' = 'center';
      if (value.align === 'left') justifyContent = 'flex-start';
      if (value.align === 'right') justifyContent = 'flex-end';

      if (!value.url) return null;
      return (
        <div style={{ display: 'flex', justifyContent, width: '100%' }}>
          <img
            className={spacingClass}
            src={value.url}
            alt={block.name || 'Bild'}
            style={{ maxWidth: 400, width: '100%', aspectRatio: getAspectRatio(value.aspect), objectFit: 'cover', borderRadius: 8, background: '#eee' }}
          />
        </div>
      );
    }
    case "code": {
      const lang = block.language || 'plaintext';
      const content = block.highlightedCode || `<pre><code class="language-${lang}">${
        block.data
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
      }</code></pre>`;
      return (
        <div className={styles.preWrapper + ' ' + spacingClass}>
          <div className={styles.languageLabel}>{lang || 'Text'}</div>
          <div dangerouslySetInnerHTML={{ __html: content }} />
        </div>
      );
    }
    case "quote": {
      return (
        <blockquote className={styles.quoteBlock + ' ' + spacingClass}>
          <span className={styles.quoteMark}>&ldquo;</span>
          <span>{block.data}</span>
          <span className={styles.quoteMark}>&rdquo;</span>
        </blockquote>
      );
    }
    case "separator":
    case "divider": {
      return <hr className={styles.separator + ' ' + spacingClass} />;
    }
    case "toc": {
      if (!blocks) return null;
      return <Toc blocks={blocks.filter(b => b.type !== "toc")} />;
    }
    case "notice": {
      // Vorschau für Notice-Block mit Typ und Text
      const NOTICE_TYPES = [
        { value: 'info', label: 'Information', color: '#1976d2', bg: '#e3f2fd' },
        { value: 'warning', label: 'Warnung', color: '#b71c1c', bg: '#ffebee' },
        { value: 'success', label: 'Erfolg', color: '#388e3c', bg: '#e8f5e9' },
        { value: 'error', label: 'Fehler', color: '#d32f2f', bg: '#ffebee' },
        { value: 'tip', label: 'Tipp', color: '#0288d1', bg: '#e1f5fe' },
        { value: 'important', label: 'Wichtig', color: '#f57c00', bg: '#fff3e0' },
        { value: 'question', label: 'Frage', color: '#512da8', bg: '#ede7f6' },
        { value: 'hint', label: 'Hinweis', color: '#ad8b00', bg: '#fffbe6' },
        { value: 'spoiler', label: 'Spoiler', color: '#333', bg: '#f3f3f3' }
      ];
      const noticeType = (block as any).noticeType || 'info';
      const data = (block as any).data || '';
      const type = NOTICE_TYPES.find(t => t.value === noticeType) || NOTICE_TYPES[0];
      return (
        <div style={{ background: type.bg, border: `1.5px solid ${type.color}`, borderRadius: 8, padding: 16, margin: '8px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span className={styles.noticeIcon + ' ' + styles[noticeType]} aria-label={type.label} />
            <span className={styles.noticeLabel} style={{ color: type.color }}>{type.label}</span>
          </div>
          <div className={styles.noticeText} style={{ color: type.color }}>{data}</div>
        </div>
      );
    }
    case "excerpt": {
      // Auszug-Block: block.data ist der Auszugstext
      return <ExcerptBlock text={block.data} />;
    }
    case "shortcode": {
      // Zeige für [shortlink url="..." text="..."] einen echten Link, sonst als Text
      const shortcode = block.data || "";
      let error = null;
      if (!/^\[.+\]$/.test(shortcode.trim())) error = "Ungültiger Shortcode";

      // Shortlink-Parsing
      let link = null;
      if (!error && shortcode.startsWith('[shortlink')) {
        // Extrahiere url und text
        const urlMatch = shortcode.match(/url\s*=\s*"([^"]+)"/i);
        const textMatch = shortcode.match(/text\s*=\s*"([^"]+)"/i);
        const url = urlMatch ? urlMatch[1] : null;
        const text = textMatch ? textMatch[1] : null;
        if (url && text) {
          link = <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2', fontWeight: 600, textDecoration: 'underline' }}>{text}</a>;
        }
      }
      return (
        <div className={spacingClass} style={{ fontFamily: 'monospace', color: error ? '#cf0808' : '#1976d2', background: '#f5f7fa', border: '1px solid #e2e4e7', borderRadius: 4, padding: 8, margin: '8px 0' }}>
          {error ? `Fehler: ${error}` : link ? <>{link} <span style={{fontSize:13,opacity:0.7,marginLeft:8}}>[shortlink]</span></> : shortcode}
        </div>
      );
    }
    case "linkpreview": {
      // Zeige die Link-Vorschau (wie im Bearbeiten-Modus, aber readonly)
      const LinkPreviewBlock = require("./LinkPreviewBlock").default;
      return <LinkPreviewBlock url={block.data || ""} />;
    }
    case "video": {
      // Video-Block: block.data ist die Video-URL oder ein Plattform-Link
      const url = block.data?.trim() || "";
      if (!url) {
        return <div style={{color:'#cf0808',fontFamily:'monospace',margin:'8px 0'}}>Kein Video-Link angegeben.</div>;
      }
      // YouTube
      const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([\w-]{11})/);
      if (ytMatch) {
        const videoId = ytMatch[1];
        return (
          <div style={{margin:'8px 0'}}>
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              title="YouTube Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{width:'100%',aspectRatio:'16/9',borderRadius:8,border:'none',background:'#000'}}
            />
          </div>
        );
      }
      // Vimeo
      const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
      if (vimeoMatch) {
        const videoId = vimeoMatch[1];
        return (
          <div style={{margin:'8px 0'}}>
            <iframe
              src={`https://player.vimeo.com/video/${videoId}`}
              title="Vimeo Video"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              style={{width:'100%',aspectRatio:'16/9',borderRadius:8,border:'none',background:'#000'}}
            />
          </div>
        );
      }
      // Twitch
      const twitchMatch = url.match(/twitch\.tv\/(videos\/(\d+)|([\w-]+))/);
      if (twitchMatch) {
        let src = '';
        if (twitchMatch[2]) {
          // Video
          src = `https://player.twitch.tv/?video=${twitchMatch[2]}&parent=${window.location.hostname}`;
        } else if (twitchMatch[3]) {
          // Channel
          src = `https://player.twitch.tv/?channel=${twitchMatch[3]}&parent=${window.location.hostname}`;
        }
        return (
          <div style={{margin:'8px 0'}}>
            <iframe
              src={src}
              title="Twitch Video"
              allowFullScreen
              style={{width:'100%',aspectRatio:'16/9',borderRadius:8,border:'none',background:'#000'}}
            />
          </div>
        );
      }
      // Direktlink zu Video-Datei
      const isDirect = url.match(/^https?:\/\/.+\.(mp4|webm|ogg)$/i);
      if (isDirect) {
        return (
          <div style={{margin:'8px 0'}}>
            <video src={url} controls style={{maxWidth:'100%',borderRadius:8,background:'#000'}} />
          </div>
        );
      }
      // Generischer Fallback: Versuche Einbettung per <iframe> (oEmbed-Ansatz)
      return (
        <div style={{margin:'8px 0'}}>
          <iframe
            src={url}
            title="Externer Inhalt"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            style={{width:'100%',aspectRatio:'16/9',borderRadius:8,border:'none',background:'#000'}}
          />
          <div style={{fontSize:13,opacity:0.7,marginTop:4,color:'#888'}}>Falls die Seite keine Einbettung erlaubt, wird ggf. nichts angezeigt.</div>
        </div>
      );
    }
    case "timeline": {
      // Timeline-Blockvorschau: block.data ist JSON-String mit TimelineItems
      let items = [];
      try {
        items = JSON.parse(block.data || "[]");
      } catch (e) {
        items = [];
      }
      return (
        <div>
          {block.name && (
            <h3 style={{ margin: '0 0 12px 0', fontWeight: 700, fontSize: '1.25em', color: '#1976d2' }}>{block.name}</h3>
          )}
          <Timeline items={items} />
        </div>
      );
    }
    case "spacing": {
      // Abstand-Block: Höhe aus block.data (px), Standard 32
      let height = 32;
      if (block.data && !isNaN(Number(block.data))) {
        height = parseInt(block.data, 10);
      }
      return <SpacingBlock height={height} />;
    }
    case "table": {
      // block.data ggf. parsen, damit TableBlockPreview immer ein Objekt bekommt
      let tableData = block.data;
      if (typeof tableData === 'string') {
        try {
          tableData = JSON.parse(tableData);
        } catch {
          tableData = null;
        }
      }
      if (
        !tableData ||
        typeof tableData !== 'object' ||
        !('data' in (tableData as object)) ||
        !Array.isArray((tableData as any).data) ||
        (tableData as any).data.length === 0
      ) {
        return (
          <div style={{ padding: 24, textAlign: 'center', color: '#888', background: '#f7fafd', borderRadius: 8, border: '1.5px solid #e3e7ee', margin: 16 }}>
            <span style={{ fontSize: 18, fontWeight: 500 }}>Keine Tabelle definiert</span>
            <div style={{ fontSize: 14, marginTop: 8 }}>Füge eine Tabelle hinzu, um sie in der Vorschau zu sehen.</div>
          </div>
        );
      }
      // Übergib das geparste Objekt explizit an TableBlockPreview
      return <TableBlockPreview block={{ ...block, data: tableData }} />;
    }
    default:
      return <p>Unbekannter Blocktyp: {block.type}</p>;
  }
});

export default BlockPreview;
