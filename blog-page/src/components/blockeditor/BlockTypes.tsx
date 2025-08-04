import React from "react";
import TableBlock from "./blocks/TableBlock";

export type BlockType = "text" | "heading" | "image" | "table" | "code" | "quote" | "divider" | "separator" | "toc" | "notice" | "timeline" | "spacing" | "excerpt" | "shortcode" | "linkpreview" | "video" | "gallery";

export interface Block {
  type: BlockType;
  data: string;
  name: string;
  language?: string;
  highlightedCode?: string;
}

export type BlockEditorProps = {
  value: Block[];
  onChange?: (blocks: Block[]) => void;
  userId?: string;
  cacheKey?: string;
};

export const BLOCK_TYPES: Array<{ type: BlockType; label: string; icon: React.ReactNode; component?: React.ComponentType<any>; aliases?: string[] }> = [
  {
    type: "linkpreview",
    label: "Link-Vorschau",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="5" width="18" height="14" rx="3" fill="#f5f7fa" stroke="#1976d2" strokeWidth="1.5" />
        <rect x="6" y="9" width="12" height="2" rx="1" fill="#1976d2" />
        <rect x="6" y="13" width="7" height="2" rx="1" fill="#1976d2" />
        <circle cx="18" cy="16" r="2" fill="#1976d2" />
      </svg>
    ),
  },
  {
    type: "shortcode",
    label: "Shortcode",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="5" width="18" height="14" rx="3" fill="#f5f7fa" stroke="#1976d2" strokeWidth="1.5" />
        <text x="7" y="17" fontSize="16" fill="#1976d2">[ ]</text>
      </svg>
    ),
  },
  {
    type: "excerpt",
    label: "Auszug",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="4" width="16" height="16" rx="3" fill="#f5f7fa" stroke="#1976d2" strokeWidth="1.5" />
        <rect x="7" y="8" width="10" height="2" rx="1" fill="#1976d2" />
        <rect x="7" y="12" width="7" height="2" rx="1" fill="#1976d2" />
        <path d="M16 17l2 2" stroke="#1976d2" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="18" cy="19" r="1" fill="#1976d2" />
      </svg>
    ),
  },
  {
    type: "spacing",
    label: "Abstand",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="19" width="16" height="2" rx="1" fill="#1976d2" />
        <path d="M12 5v10" stroke="#1976d2" strokeWidth="2" strokeLinecap="round" />
        <path d="M8 13l4 4 4-4" stroke="#1976d2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    type: "timeline",
    label: "Timeline",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="11" y="3" width="2" height="18" rx="1" fill="#1976d2" />
        <circle cx="12" cy="7" r="2.5" fill="#fff" stroke="#1976d2" strokeWidth="1.5" />
        <circle cx="12" cy="17" r="2.5" fill="#fff" stroke="#1976d2" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    type: "notice",
    label: "Hinweis",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="#fffbe6" stroke="#ffe58f" strokeWidth="2" />
        <text x="8" y="17" fontSize="16" fill="#ad8b00">!</text>
      </svg>
    ),
  },
  {
    type: "toc",
    label: "Inhaltsverzeichnis",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="6" width="16" height="2" rx="1" fill="#1976d2" />
        <rect x="4" y="11" width="10" height="2" rx="1" fill="#1976d2" />
        <rect x="4" y="16" width="8" height="2" rx="1" fill="#1976d2" />
        <circle cx="19" cy="7" r="1.5" fill="#1976d2" />
        <circle cx="15.5" cy="12" r="1" fill="#1976d2" />
        <circle cx="13" cy="17" r="0.8" fill="#1976d2" />
      </svg>
    ),
  },
  {
    type: "divider",
    label: "Trennlinie",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="11" width="16" height="2" rx="1" fill="#1976d2" />
      </svg>
    ),
  },
  {
    type: "text",
    label: "Text",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="6" width="16" height="2" rx="1" fill="#1976d2" />
        <rect x="4" y="11" width="10" height="2" rx="1" fill="#1976d2" />
        <rect x="4" y="16" width="8" height="2" rx="1" fill="#1976d2" />
      </svg>
    ),
  },
  {
    type: "heading",
    label: "Überschrift",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="6" width="16" height="2" rx="1" fill="#1976d2" />
        <rect x="4" y="11" width="16" height="2" rx="1" fill="#1976d2" />
      </svg>
    ),
  },
  {
    type: "image",
    label: "Bild",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="6" width="16" height="12" rx="2" fill="#1976d2" />
        <circle cx="8" cy="10" r="2" fill="#fff" />
        <rect x="12" y="12" width="6" height="4" rx="1" fill="#fff" />
      </svg>
    ),
  },
  {
    type: "table",
    label: "Tabelle",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="5" width="16" height="14" rx="2" fill="#1976d2" />
        <rect x="5" y="7" width="12" height="2" rx="1" fill="#fff" />
        <rect x="5" y="11" width="12" height="2" rx="1" fill="#fff" />
        <rect x="5" y="15" width="12" height="2" rx="1" fill="#fff" />
      </svg>
    ),
    component: TableBlock,
    aliases: ["table", "tabelle"],
  },
  {
    type: "code",
    label: "Code",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M8 6L3 12L8 18M16 6L21 12L16 18" stroke="#1976d2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    type: "quote",
    label: "Zitat",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <text x="4" y="18" fontSize="18" fill="#1976d2">“</text>
      </svg>
    ),
  },
  {
    type: "video",
    label: "Video",
    icon: <span role="img" aria-label="Video">🎬</span>,
  },
  {
    type: "gallery",
    label: "Bildergalerie",
    icon: <span role="img" aria-label="Galerie">🖼️</span>,
  },
];
