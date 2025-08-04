import React from "react";
import { Block } from "./BlockTypes";

interface TocProps {
  blocks: Block[];
}

interface HeadingItem {
  idx: number;
  text: string;
  level: number;
}


const Toc: React.FC<TocProps> = ({ blocks }) => {
  let headings: HeadingItem[] = [];
  const stripHtml = (str: string) => str.replace(/<[^>]+>/g, '');
  blocks.forEach((block, idx) => {
    if (block.type === "heading") {
      let headingText = "";
      if (block.data && typeof block.data === "string" && block.data.trim() !== "") {
        headingText = stripHtml(block.data);
      } else if (block.name && typeof block.name === "string" && block.name.trim() !== "") {
        headingText = stripHtml(block.name);
      }
      if (headingText) {
        headings.push({ idx, text: headingText, level: 2 });
      }
    }
    if (block.type === "text" && block.data && typeof block.data === "string") {
      const h2Matches = [...block.data.matchAll(/<h2>(.*?)<\/h2>/gi)];
      h2Matches.forEach(match => {
        if (match[1] && match[1].trim() !== "") {
          headings.push({ idx, text: stripHtml(match[1].trim()), level: 2 });
        }
      });
      const h3Matches = [...block.data.matchAll(/<h3>(.*?)<\/h3>/gi)];
      h3Matches.forEach(match => {
        if (match[1] && match[1].trim() !== "") {
          headings.push({ idx, text: stripHtml(match[1].trim()), level: 3 });
        }
      });
    }
  });

  if (headings.length === 0) return null;

  return (
    <nav className="tableOfContents" style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{marginRight:8}}>
          <rect x="3" y="4" width="18" height="2.5" rx="1.2" fill="#1976d2"/>
          <rect x="3" y="10.75" width="12" height="2.5" rx="1.2" fill="#1976d2"/>
          <rect x="3" y="17.5" width="7" height="2.5" rx="1.2" fill="#1976d2"/>
        </svg>
        <span style={{ fontWeight: 600, fontSize: '1.18em', color: '#1976d2', letterSpacing: 0.2 }}>Inhaltsverzeichnis</span>
      </div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {headings.map((h, i) => (
          <li
            key={h.idx + '-' + i}
            style={{
              marginBottom: '6px',
              paddingLeft: h.level === 3 ? '32px' : '8px',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              fontSize: h.level === 3 ? '0.97em' : '1.04em',
              color: h.level === 3 ? '#666' : '#222',
              fontWeight: h.level === 3 ? 400 : 500
            }}
          >
            <span style={{
              display: 'inline-block',
              width: 8,
              height: 8,
              borderRadius: 4,
              background: h.level === 3 ? '#bcd6f6' : '#1976d2',
              marginRight: 10,
              marginLeft: h.level === 3 ? 6 : 0
            }} />
            <a
              href={`#heading-${h.idx}`}
              style={{
                color: 'inherit',
                textDecoration: 'none',
                transition: 'color 0.2s',
                flex: 1
              }}
              onMouseOver={e => (e.currentTarget.style.color = '#1976d2')}
              onMouseOut={e => (e.currentTarget.style.color = '')}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Toc;
