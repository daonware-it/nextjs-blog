import React, { useState } from "react";
import styles from "../GalleryBlockEditor.module.css";

export type GalleryMode = "grid" | "slider" | "lightbox" | "masonry" | "collage" | "thumbnails" | "slideshow" | "fullscreen";

interface GalleryBlockProps {
  value: {
    images: string[];
    mode: GalleryMode;
    columns: number;
    gap: number;
    captions: string[];
    autoplay: boolean;
    duration: number;
    startIndex: number;
    lightbox: boolean;
    aspect: string;
  };
  onChange: (val: GalleryBlockProps["value"]) => void;
}

const modeOptions = [
  { value: "grid", label: "Grid" },
  { value: "slider", label: "Slider" },
  { value: "lightbox", label: "Lightbox" },
  { value: "masonry", label: "Masonry" },
  { value: "collage", label: "Collage" },
  { value: "thumbnails", label: "Thumbnails" },
  { value: "slideshow", label: "Slideshow" },
  { value: "fullscreen", label: "Fullscreen" },
];

const aspectOptions = [
  { value: "original", label: "Original" },
  { value: "square", label: "Quadrat (1:1)" },
  { value: "16:9", label: "16:9" },
  { value: "4:3", label: "4:3" },
];

export default function GalleryBlock({ value, onChange }: GalleryBlockProps) {
  const [local, setLocal] = useState({
    images: value.images || [],
    captions: value.captions || [],
    mode: value.mode,
    columns: value.columns,
    gap: value.gap,
    autoplay: value.autoplay,
    duration: value.duration,
    startIndex: value.startIndex,
    lightbox: value.lightbox,
    aspect: value.aspect
  });

  
  React.useEffect(() => {
    setLocal({
      images: value.images || [],
      captions: value.captions || [],
      mode: value.mode,
      columns: value.columns,
      gap: value.gap,
      autoplay: value.autoplay,
      duration: value.duration,
      startIndex: value.startIndex,
      lightbox: value.lightbox,
      aspect: value.aspect
    });
  }, [value]);

  const handleChange = (patch: Partial<typeof local>) => {
    setLocal(prev => ({ ...prev, ...patch }));
  };
  const handleSubmit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange({ ...value, ...local });
    
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className={styles.galleryEditorCard}>
        <div className={styles.galleryEditorTitle}>Galerie-Einstellungen</div>
        <div className={styles.galleryEditorRow}>
          <div className={styles.galleryEditorCol}>
            <label className={styles.galleryEditorLabel}>Bild-URLs (eine pro Zeile)</label>
            <textarea
              value={local.images.join("\n")}
              onChange={e => handleChange({ images: e.target.value.split("\n").map(s => s.trim()) })}
              rows={Math.max(3, local.images.length)}
              className={styles.galleryEditorTextarea}
              data-galleryblock="true"
            />
          </div>
          <div className={styles.galleryEditorCol}>
            <label className={styles.galleryEditorLabel}>Bildunterschriften (eine pro Zeile, Reihenfolge wie Bilder)</label>
            <textarea
              value={local.captions.join("\n")}
              onChange={e => handleChange({ captions: e.target.value.split("\n") })}
              rows={Math.max(2, local.captions.length)}
              className={styles.galleryEditorTextarea}
              data-galleryblock="true"
            />
          </div>
          <div className={styles.galleryEditorColSmall}>
            <label className={styles.galleryEditorLabel}>Galerie-Modus</label>
            <select
              value={local.mode}
              onChange={e => handleChange({ mode: e.target.value as GalleryMode })}
              className={styles.galleryEditorSelect}
            >
              {modeOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          {(local.mode === "grid" || local.mode === "masonry") && (
            <div className={styles.galleryEditorColSmall}>
              <label className={styles.galleryEditorLabel}>Spaltenanzahl</label>
              <input
                type="number"
                min={1}
                max={6}
                value={local.columns}
                onChange={e => handleChange({ columns: Number(e.target.value) })}
                className={styles.galleryEditorInput}
              />
            </div>
          )}
          <div className={styles.galleryEditorColSmall}>
            <label className={styles.galleryEditorLabel}>Abstand (px)</label>
            <input
              type="number"
              min={0}
              max={64}
              value={local.gap}
              onChange={e => handleChange({ gap: Number(e.target.value) })}
              className={styles.galleryEditorInput}
            />
          </div>
          <div className={styles.galleryEditorColSmall}>
            <label className={styles.galleryEditorLabel}>Bildverhältnis</label>
            <select
              value={local.aspect}
              onChange={e => handleChange({ aspect: e.target.value })}
              className={styles.galleryEditorSelect}
            >
              {aspectOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className={styles.galleryEditorRow} style={{ marginTop: 18 }}>
          <div className={styles.galleryEditorColSmall}>
            <label className={styles.galleryEditorLabel}>Startbild (Index, 1-basiert)</label>
            <input
              type="number"
              min={1}
              max={local.images.length}
              value={local.startIndex}
              onChange={e => handleChange({ startIndex: Number(e.target.value) })}
              className={styles.galleryEditorInput}
            />
          </div>
          {local.mode !== "lightbox" && (
            <div className={styles.galleryEditorColSmall}>
              <label className={styles.galleryEditorLabel}>Lightbox aktivieren</label>
              <input
                type="checkbox"
                checked={local.lightbox}
                onChange={e => handleChange({ lightbox: e.target.checked })}
                style={{ marginTop: 8, width: 20, height: 20 }}
              />
            </div>
          )}
          {(local.mode === "slider" || local.mode === "slideshow") && (
            <div className={styles.galleryEditorColSmall}>
              <label className={styles.galleryEditorLabel}>Automatisches Abspielen</label>
              <input
                type="checkbox"
                checked={local.autoplay}
                onChange={e => handleChange({ autoplay: e.target.checked })}
                style={{ marginTop: 8, width: 20, height: 20 }}
              />
            </div>
          )}
          {local.mode === "slideshow" && (
            <div className={styles.galleryEditorColSmall}>
              <label className={styles.galleryEditorLabel}>Anzeigedauer (Sekunden)</label>
              <input
                type="number"
                min={1}
                max={60}
                value={local.duration}
                onChange={e => handleChange({ duration: Number(e.target.value) })}
                className={styles.galleryEditorInput}
              />
            </div>
          )}
        </div>
        <button type="button" className={styles.galleryEditorButton} onClick={handleSubmit}>Übernehmen & Vorschau</button>
      </div>

      <div style={{ marginTop: 24, maxWidth: 900, width: '100%', marginLeft: 'auto', marginRight: 'auto' }}>
        {(() => {
          const GalleryBlockPreview = require("../GalleryBlockPreview").default;
          return <GalleryBlockPreview data={local} />;
        })()}
      </div>
    </div>
  );
}
