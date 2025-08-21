import React, { useState, useEffect, useCallback } from "react";
import styles from "./BlockEditor.module.css";
import CodeBlock from "./CodeBlock";

import { BLOCK_TYPES, BlockType, Block } from "./BlockTypes";
import { getBlockEditComponent } from "./blockTypeConfig";
import ImageBlockEdit from "./blocks/ImageBlockEdit";
import dynamic from "next/dynamic";
const GalleryBlock = dynamic(() => import("./blocks/GalleryBlock"), { ssr: false });
import TableBlockWrapper from "./TableBlockWrapper";

import BlockPreview from "./BlockPreview";
import Toc from "./Toc";
import { updateCache } from "../utils";

import { useRouter } from "next/router";


type BlockEditorProps = {
  value: Block[];
  onChange?: (blocks: Block[]) => void;
  userId?: string;
  cacheKey?: string;
  draftId?: string;
  onDraftIdChange?: (id: string | undefined) => void;
};

export default function BlockEditor({ value, onChange, userId, cacheKey = "blockEditorDraft", draftId, onDraftIdChange }: BlockEditorProps) {
  const previewStateKey = `${cacheKey}-showPreview`;

  const [blocks, setBlocks] = useState<Block[]>(value || []);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [hasMounted, setHasMounted] = useState<boolean>(false);

  useEffect(() => {
    setBlocks(value || []);
  }, [value]);

  const router = useRouter();

  const handleUpdateCache = useCallback((currentBlocks: Block[]) => {
    // Cache aktualisieren
    updateCache(currentBlocks, cacheKey);
    
    // Sicherstellen, dass die blockEditorDraftId in localStorage immer mit dem aktuellen draftId Prop übereinstimmt
    if (draftId && typeof draftId === "string" && draftId !== "") {
      try {
        localStorage.setItem("blockEditorDraftId", draftId);
      } catch (e) {
        console.error('[BlockEditor] Fehler beim Aktualisieren der blockEditorDraftId:', e);
      }
    } else {
      // Wenn kein draftId Prop vorhanden, versuchen die ID aus localStorage oder URL zu verwenden
      try {
        const storedDraftId = localStorage.getItem("blockEditorDraftId");
        const urlDraftId = router.isReady ? router.query.id as string : undefined;
        
        // Priorität: URL > localStorage
        const currentDraftId = urlDraftId || (storedDraftId && storedDraftId !== "undefined" && storedDraftId !== "null" ? storedDraftId : undefined);
        
        if (currentDraftId) {
          localStorage.setItem("blockEditorDraftId", currentDraftId);
          
          // Auch die ID über den Callback weitergeben
          if (onDraftIdChange) {
            onDraftIdChange(currentDraftId);
          }
        }
      } catch (e) {
        console.error('[BlockEditor] Fehler beim Ermitteln der aktuellen draftId:', e);
      }
    }
  }, [cacheKey, draftId, router, onDraftIdChange]);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (hasMounted) {
      const cachedPreviewState = localStorage.getItem(previewStateKey);
      if (cachedPreviewState !== null) {
        setShowPreview(cachedPreviewState === "true");
      }
    }
  }, [hasMounted, previewStateKey]);

  useEffect(() => {
    if (hasMounted) {
      localStorage.setItem(previewStateKey, showPreview.toString());
    }
  }, [showPreview, previewStateKey, hasMounted]);


  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [newBlockValue, setNewBlockValue] = useState<string>("");
  const [showNewBlockMenu, setShowNewBlockMenu] = useState<boolean>(false);
  const [newBlockMenuQuery, setNewBlockMenuQuery] = useState<string>("");
  const [newBlockMenuIndex, setNewBlockMenuIndex] = useState<number>(0);

  const [showBlockMenuIdx, setShowBlockMenuIdx] = useState<number | null>(null);
  const [blockMenuQuery, setBlockMenuQuery] = useState<string>("");
  const [blockMenuIndex, setBlockMenuIndex] = useState<number>(0);

  const addBlock = useCallback(
    async (type: BlockType, insertIndex: number, initialData: string = "") => {
      let newBlock: Block = { type, data: initialData, name: "" };
      if (type === "gallery") {
        newBlock.data = JSON.stringify({
          images: [],
          mode: "grid",
          columns: 3,
          gap: 8,
          captions: [],
          autoplay: false,
          duration: 5,
          startIndex: 1,
          lightbox: true,
          aspect: "original"
        });
      }
      
      if (type === "code") {
        newBlock = { 
          ...newBlock, 
          language: "plaintext",
          highlightedCode: `<pre><code class="language-plaintext"></code></pre>`
        } as Block;
      }

      setBlocks(currentBlocks => {
        const newBlocks = [...currentBlocks];
        newBlocks.splice(insertIndex, 0, newBlock);
        updateCache(newBlocks, cacheKey);
        onChange?.(newBlocks);
        
        if (newBlocks.length === 1 && !getDraftId() && (initialData.trim() !== "" || type !== "text")) {
          const newDraftId = generateDraftId();
          
          try {
            localStorage.setItem("blockEditorDraftId", newDraftId);
            localStorage.setItem(cacheKey, JSON.stringify({
              id: newDraftId,
              blocks: newBlocks,
              lastModified: new Date().toISOString()
            }));
          } catch (err) {
            console.error('[BlockEditor] Fehler beim Speichern der draftId:', err);
          }
          
          if (onDraftIdChange) {
            onDraftIdChange(newDraftId);
          }
        }
        
        return newBlocks;
      });
    },
    [cacheKey, onChange, onDraftIdChange]
  );

  const updateBlock = useCallback(
    (idx: number, data: string | any, field: "data" | "name" = "data") => {
      
      setBlocks(currentBlocks => {
        const newBlocks = currentBlocks.map((block, index) => {
          if (index !== idx) return block;
          if (block.type === "gallery" && field === "data") {
            const newData = typeof data === "string" ? data : JSON.stringify(data);
            
            return { ...block, data: newData };
          }
          return { ...block, [field]: data };
        });
        
        handleUpdateCache(newBlocks);
        onChange?.(newBlocks);
        return newBlocks;
      });
    },
    [handleUpdateCache, onChange]
  );

  const insertBlockAt = useCallback(
    (idx: number, type: BlockType) => {
      setBlocks(currentBlocks => {
        const newBlocks = [...currentBlocks];
        const currentName = newBlocks[idx]?.name || "";
        newBlocks.splice(idx, 1, { type, data: "", name: currentName });
        handleUpdateCache(newBlocks);
        onChange?.(newBlocks);
        return newBlocks;
      });

      setShowBlockMenuIdx(null);
      setBlockMenuQuery("");
      setTimeout(() => {
        const input = document.querySelector(`#block-input-${idx}`);
        if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
          input.focus();
        }
      }, 50);
    },
    [handleUpdateCache, onChange]
  );

  const removeBlock = useCallback(
    (idx: number, event?: React.MouseEvent) => {
      if (event) {
        event.stopPropagation();
        event.preventDefault();
      }
      setBlocks(currentBlocks => {
        if (idx < 0 || idx >= currentBlocks.length) return currentBlocks;
        const newBlocks = currentBlocks.filter((_, index) => index !== idx);
        handleUpdateCache(newBlocks);
        onChange?.(newBlocks);
        return newBlocks;
      });
    },
    [handleUpdateCache, onChange]
  );


  const handleDragStart = useCallback((idx: number) => {
    setDragIndex(idx);
    setDropIndex(null);
  }, []);

  const handleDragEnter = useCallback((idx: number) => {
    setDropIndex(idx);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDropIndex(null);
  }, []);

  const handleDrop = useCallback(
    (idx: number) => {
      if (dragIndex === null || dropIndex === null) return;
      if (dragIndex === dropIndex || dragIndex + 1 === dropIndex) {
        setDragIndex(null);
        setDropIndex(null);
        return;
      }
      setBlocks(currentBlocks => {
        const newBlocks = [...currentBlocks];
        const [draggedBlock] = newBlocks.splice(dragIndex, 1);
        let insertAt = dropIndex;
        if (dragIndex < dropIndex) insertAt--;
        newBlocks.splice(insertAt, 0, draggedBlock);
        handleUpdateCache(newBlocks);
        onChange?.(newBlocks);
        return newBlocks;
      });
      setDragIndex(null);
      setDropIndex(null);
    },
    [dragIndex, dropIndex, handleUpdateCache, onChange]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    
    if (dragIndex === null) return;

    const scrollMargin = 200;
    const minScrollStep = 3;
    const maxScrollStep = 25;

    const viewportHeight = window.innerHeight;
    const mouseY = e.clientY;

    const getScrollSpeed = (distance: number): number => {
      const factor = Math.pow(Math.max(0, 1 - distance / scrollMargin), 2);
      
      return minScrollStep + (maxScrollStep - minScrollStep) * factor;
    };

    if (mouseY < scrollMargin) {
      const speed = getScrollSpeed(mouseY);
      window.scrollBy(0, -speed);
    }
    else if (mouseY > viewportHeight - scrollMargin) {
      const speed = getScrollSpeed(viewportHeight - mouseY);
      window.scrollBy(0, speed);
    }
  }, [dragIndex]);



  useEffect(() => {
    if (hasMounted && router.isReady) {
      // Nur getDraftId aufrufen, wenn keine Draft-ID explizit übergeben wurde
      if (!draftId) {
        const id = getDraftId();
        
        if (id && onDraftIdChange) {
          onDraftIdChange(id);
        }
      }
    }
  }, [hasMounted, router.isReady, draftId, onDraftIdChange]);


  const getDraftId = () => {
    // Immer zuerst die übergebene Draft-ID verwenden, wenn sie existiert
    if (draftId && typeof draftId === "string" && draftId !== "") {
      return draftId;
    }
    
    // Dann URL Query-Parameter prüfen
    if (router && router.isReady) {
      const queryParam = router.query.id;
      if (queryParam && typeof queryParam === 'string' && queryParam !== "") {
        return queryParam;
      }
    }
    
    // Dann localStorage prüfen
    try {
      const lsId = localStorage.getItem("blockEditorDraftId");
      if (lsId && lsId !== "" && lsId !== "undefined" && lsId !== "null") {
        return lsId;
      }
    } catch (e) {
      console.error('[BlockEditor] Fehler beim Lesen von localStorage:', e);
    }
    
    // Zuletzt den Cache prüfen
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.id && parsed.id !== "") {
          return parsed.id.toString();
        }
      }
    } catch (e) {
      console.error('[BlockEditor] Fehler beim Parsen des Caches:', e);
    }
    
    // Nur als letzte Option undefined zurückgeben
    return undefined;
  };

  function generateDraftId() {
    return (
      Date.now().toString(36) +
      Math.random().toString(36).substr(2, 8)
    );
  }

  const handlePreviewClick = async () => {
    let finalBlocks = blocks;
    const text = newBlockValue.trim();
    if (!showNewBlockMenu && text !== "") {
      finalBlocks = [...blocks, { type: "text" as BlockType, data: text, name: "" }];
      setBlocks(finalBlocks);
      setNewBlockValue("");
    }
    
    // Die vorhandene draftId beibehalten, oder eine aus der URL holen, nie eine neue generieren
    const draftIdToUse = getDraftId();
    
    // Die Draft-ID sowohl in localStorage als auch via Callback aktualisieren
    if (draftIdToUse) {
      try {
        localStorage.setItem("blockEditorDraftId", draftIdToUse);
      } catch (e) {
        console.error('[handlePreviewClick] Fehler beim Setzen der blockEditorDraftId:', e);
      }
      
      if (onDraftIdChange) {
        onDraftIdChange(draftIdToUse);
      }
    }
    
    setShowPreview(true);
    
    if (userId && draftIdToUse && finalBlocks.length > 0) {
      try {
        await fetch(`/api/block-draft`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: draftIdToUse,
            userId,
            blocks: finalBlocks
          }),
        });
      } catch (e) {
        console.error("Fehler beim Speichern des Entwurfs:", e);
      }
    }
  };

  const handleEditorClick = () => {
    // Die vorhandene draftId beibehalten, oder eine aus der URL holen, nie eine neue generieren
    const draftIdToUse = getDraftId();
    
    // Die Draft-ID sowohl in localStorage als auch via Callback aktualisieren
    if (draftIdToUse) {
      try {
        localStorage.setItem("blockEditorDraftId", draftIdToUse);
      } catch (e) {
        console.error('[handleEditorClick] Fehler beim Setzen der blockEditorDraftId:', e);
      }
      
      if (onDraftIdChange) {
        onDraftIdChange(draftIdToUse);
      }
    }
    
    setShowPreview(false);
  };


  return (
    <div className={styles.blockEditorWrapperOuter}>
      <div className={styles.blockEditorWrapper} onDragOver={handleDragOver}>
        <div className={styles.previewToggle}>
          <button
            className={`${styles.toggleBtn} ${!showPreview ? styles.active : ""}`}
            onClick={handleEditorClick}
          >
            Editor
          </button>
          <button
            className={`${styles.toggleBtn} ${showPreview ? styles.active : ""}`}
            onClick={handlePreviewClick}
          >
            Vorschau
          </button>
        </div>
        {!hasMounted ? (
          <div className={styles.loadingState}>
            Lade Editor...
          </div>
        ) : showPreview ? (
          <div className={styles.previewContent}>
            {blocks.length === 0 ? (
              <div className={styles.emptyPreview}>Keine Inhalte vorhanden</div>
            ) : (
              blocks.map((block, idx) => {
                const nextBlockType = blocks[idx + 1]?.type;
                const key = `preview-${idx}-${block.type}-${block.data}`;
                return (
                  <div key={key} className={styles.blockPreview}>
                    <BlockPreview block={block} nextBlockType={nextBlockType} blocks={blocks} />
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <>
            {blocks.map((block, idx) => (
              <React.Fragment key={idx}>
                {dropIndex === idx && dragIndex !== null && (
                  <div className={styles.dropIndicator} />
                )}
                <div
                  className={styles.blockItem}
                  onDragEnter={e => {
                    e.preventDefault();
                    if (dragIndex !== null && dragIndex !== idx) handleDragEnter(idx);
                  }}
                  onDragOver={e => {
                    e.preventDefault();
                    if (dragIndex !== null && dropIndex !== idx) setDropIndex(idx);
                  }}
                  onDragLeave={e => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                      handleDragLeave();
                    }
                  }}
                  onDrop={e => {
                    e.preventDefault();
                    handleDrop(idx);
                  }}
                  style={{ position: 'relative' }}
                >
                  <div className={styles.blockEdit}>
                  <div
                    style={{
                      position: 'absolute',
                      left: -36,
                      top: 12,
                      width: 28,
                      height: 28,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'grab',
                      background: '#e3e7ee',
                      borderRadius: '50%',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
                    }}
                    title="Block mit Maus verschieben"
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <circle cx="6" cy="6" r="1.5" fill="#555" />
                      <circle cx="12" cy="6" r="1.5" fill="#555" />
                      <circle cx="6" cy="12" r="1.5" fill="#555" />
                      <circle cx="12" cy="12" r="1.5" fill="#555" />
                    </svg>
                  </div>
                  {block.type !== "toc" && (
                    <input
                      type="text"
                      placeholder={`${block.type.charAt(0).toUpperCase() + block.type.slice(1)}-Block Titel...`}
                      value={block.name || ""}
                      onChange={(e) => updateBlock(idx, e.target.value, "name")}
                      className={styles.blockNameInput}
                      onKeyDown={e => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const nextInput = document.querySelector(`#block-title-input-${idx + 1}`) as HTMLInputElement | null;
                          if (nextInput) {
                            nextInput.focus();
                          } else {
                            (e.target as HTMLInputElement).blur();
                          }
                        }
                      }}
                      id={`block-title-input-${idx}`}
                    />
                  )}
                  {block.type === "toc" ? (
                    <Toc blocks={blocks.filter((b) => b.type !== "toc")} />
                  ) : block.type === "notice" ? (
                    (() => {
                      const NoticeBlockEdit = require("./blocks/NoticeBlockEdit").default;
                      return (
                        <NoticeBlockEdit
                          block={block}
                          onChange={newBlock => {
                            setBlocks(currentBlocks => {
                              const newBlocks = currentBlocks.map((b, i) => i === idx ? { ...b, ...newBlock } : b);
                              handleUpdateCache(newBlocks);
                              onChange?.(newBlocks);
                              return newBlocks;
                            });
                          }}
                        />
                      );
                    })()
                  ) : block.type === "timeline" ? (
                    (() => {
                      const TimelineEditor = require("./TimelineEditor").default;
                      let items: any[] = [];
                      try {
                        items = JSON.parse(block.data || "[]");
                      } catch {}
                      return (
                        <TimelineEditor
                          initialItems={items}
                          onChange={newItems => {
                            updateBlock(idx, JSON.stringify(newItems), "data");
                          }}
                        />
                      );
                    })()
                  ) : block.type === "excerpt" ? (
                    <textarea
                      id={`block-input-${idx}`}
                      value={block.data || ""}
                      onChange={e => updateBlock(idx, e.target.value, "data")}
                      className={styles.blockInput}
                      placeholder="Auszugstext..."
                      rows={2}
                      style={{ resize: 'vertical', minHeight: 40, maxHeight: 120, marginBottom: 8 }}
                    />
                  ) : block.type === "text" ? (
                    (() => {
                      const EditComponent = getBlockEditComponent("text");
                      if (!EditComponent) return null;
                      return (
                        <EditComponent
                          block={block}
                          onChange={val => updateBlock(idx, val, "data")}
                        />
                      );
                    })()
                  ) : block.type === "quote" ? (
                    (() => {
                      const EditComponent = getBlockEditComponent("quote");
                      if (!EditComponent) return null;
                      return (
                        <EditComponent
                          block={block}
                          onChange={val => updateBlock(idx, val, "data")}
                        />
                      );
                    })()
                  ) : block.type === "shortcode" ? (
                    (() => {
                      const ShortcodeBlock = require("./ShortcodeBlock").default;
                      return (
                        <ShortcodeBlock
                          shortcode={block.data || ""}
                          onChange={val => updateBlock(idx, val, "data")}
                        />
                      );
                    })()
                  ) : block.type === "linkpreview" ? (
                    (() => {
                      const LinkPreviewBlock = require("./LinkPreviewBlock").default;
                      return (
                        <LinkPreviewBlock
                          url={block.data || ""}
                          onChange={val => updateBlock(idx, val, "data")}
                        />
                      );
                    })()
                  ) : block.type === "gallery" ? (
                    (() => {
                      const GalleryBlock = require("./blocks/GalleryBlock").default;
                      let galleryData = {
                        images: [],
                        mode: "grid",
                        columns: 3,
                        gap: 8,
                        captions: [],
                        autoplay: false,
                        duration: 5,
                        startIndex: 1,
                        lightbox: true,
                        aspect: "original"
                      };
                      try {
                        const parsed = JSON.parse(block.data || '{}');
                        galleryData = { ...galleryData, ...parsed, mode: parsed.mode || "grid" };
                      } catch {}
                      return (
                        <GalleryBlock
                          value={galleryData}
                          onChange={val => updateBlock(idx, JSON.stringify(val), "data")}
                        />
                      );
                    })()
                  ) : block.type === "video" ? (
                    <div>
                      <input
                        id={`block-input-${idx}`}
                        type="text"
                        value={block.data || ""}
                        onChange={e => updateBlock(idx, e.target.value, "data")}
                        className={styles.blockInput}
                        placeholder="Video-URL oder Plattform-Link..."
                        style={{ marginBottom: 8 }}
                      />
                      <div style={{border:'1px solid #e2e4e7',borderRadius:6,padding:6,background:'#fafbfc',marginBottom:4,maxWidth:340}}>
                        <span style={{fontSize:13,color:'#888'}}>Vorschau:</span>
                        <div style={{marginTop:4,display:'flex',justifyContent:'center'}}>
                          {(() => {
                            const url = block.data?.trim() || "";
                            if (!url) return <span style={{color:'#cf0808'}}>Bitte gib eine Video-URL ein.</span>;
                            const previewStyle = { width: 320, height: 180, maxWidth: '100%', borderRadius: 6, border: 'none', background: '#000', display: 'block' };
                            const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([\w-]{11})/);
                            if (ytMatch) {
                              const videoId = ytMatch[1];
                              return <iframe src={`https://www.youtube.com/embed/${videoId}`} title="YouTube Video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={previewStyle} />;
                            }
                            const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
                            if (vimeoMatch) {
                              const videoId = vimeoMatch[1];
                              return <iframe src={`https://player.vimeo.com/video/${videoId}`} title="Vimeo Video" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen style={previewStyle} />;
                            }
                            const twitchMatch = url.match(/twitch\.tv\/(videos\/(\d+)|([\w-]+))/);
                            if (twitchMatch) {
                              let src = '';
                              if (twitchMatch[2]) {
                                src = `https://player.twitch.tv/?video=${twitchMatch[2]}&parent=${window.location.hostname}`;
                              } else if (twitchMatch[3]) {
                                src = `https://player.twitch.tv/?channel=${twitchMatch[3]}&parent=${window.location.hostname}`;
                              }
                              return <iframe src={src} title="Twitch Video" allowFullScreen style={previewStyle} />;
                            }
                            const isDirect = url.match(/^https?:\/\/.+\.(mp4|webm|ogg)$/i);
                            if (isDirect) {
                              return <video src={url} controls style={previewStyle} />;
                            }
                            return <iframe src={url} title="Externer Inhalt" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen style={previewStyle} />;
                          })()}
                        </div>
                      </div>
                    </div>
                  ) : block.type === "spacing" ? (
                    <div style={{ width: '100%' }}>
                      <label style={{ fontSize: 14, color: '#1976d2', fontWeight: 500 }}>
                        Abstand (px):
                        <input
                          type="number"
                          min={0}
                          max={512}
                          value={block.data || 32}
                          onChange={e => updateBlock(idx, e.target.value, "data")}
                          style={{ marginLeft: 8, width: 80, padding: 4, borderRadius: 4, border: '1px solid #cfd8dc' }}
                        />
                      </label>
                    </div>
                  ) : block.type === "table" ? (
                    <TableBlockWrapper 
                      key={`table-wrapper-${idx}`}
                      userId={userId}
                      block={block}
                      updateBlock={(data) => updateBlock(idx, data, "data")}
                    />
                  
                  ) : block.type === "image" ? (
                    <ImageBlockEdit
                      block={block}
                      onChange={data => updateBlock(idx, data, "data")}
                    />
                  ) : block.type === "code" ? (
                    <CodeBlock
                      code={block.data}
                      language={block.language || ""}
                      onChange={(code, language, highlightedCode) => {
                        updateBlock(idx, code, "data");
                        setBlocks(currentBlocks => {
                          const newBlocks = [...currentBlocks];
                          newBlocks[idx] = { 
                            ...newBlocks[idx], 
                            language,
                            highlightedCode 
                          };
                          handleUpdateCache(newBlocks);
                          onChange?.(newBlocks);
                          return newBlocks;
                        });
                      }}
                    />
                  ) : null}
                  {showBlockMenuIdx === idx && (() => {
                    const filtered = BLOCK_TYPES.filter(
                      (bt) => {
                        const query = blockMenuQuery.toLowerCase();
                        return (
                          bt.label.toLowerCase().includes(query) ||
                          bt.type.toLowerCase().includes(query) ||
                          (bt.aliases && bt.aliases.some(alias => alias.toLowerCase().includes(query)))
                        );
                      }
                    );
                    return (
                      <div className={styles.blockMenu}>
                        {filtered.length === 0 ? (
                          <div className={styles.blockMenuEmpty}>Kein Block gefunden</div>
                        ) : (
                          filtered.map((bt, i) => (
                            <div
                              key={bt.type}
                              className={
                                styles.blockMenuItem +
                                (i === blockMenuIndex ? ` ${styles.blockMenuItemHover}` : "")
                              }
                              onMouseDown={(e) => {
                                e.preventDefault();
                                insertBlockAt(idx, bt.type);
                              }}
                              onMouseEnter={() => setBlockMenuIndex(i)}
                              onMouseLeave={() => setBlockMenuIndex(-1)}
                            >
                              <span className={styles.blockMenuIcon}>{bt.icon}</span>
                              <span>{bt.label}</span>
                            </div>
                          ))
                        )}
                      </div>
                    );
                  })()}
                  <button
                    className={styles.removeBlockBtn}
                    onClick={(e) => removeBlock(idx, e)}
                    onMouseDown={(e) => e.stopPropagation()}
                    title="Block entfernen"
                    aria-label="Block entfernen"
                  >
                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" style={{display:'block'}}>
                      <g filter="url(#glow)">
                        <rect x="6" y="8" width="1.5" height="6" rx="0.75" fill="#fff"/>
                        <rect x="12.5" y="8" width="1.5" height="6" rx="0.75" fill="#fff"/>
                        <rect x="9.25" y="8" width="1.5" height="6" rx="0.75" fill="#fff"/>
                        <rect x="4" y="6" width="12" height="2" rx="1" fill="#fff"/>
                        <rect x="7" y="3" width="6" height="2" rx="1" fill="#fff"/>
                        <rect x="2" y="6" width="16" height="2" rx="1" fill="#fff" opacity=".2"/>
                      </g>
                      <defs>
                        <filter id="glow" x="-2" y="-2" width="26" height="26" filterUnits="userSpaceOnUse">
                          <feDropShadow dx="0" dy="0" stdDeviation="1.2" floodColor="#fff" floodOpacity="0.85"/>
                        </filter>
                      </defs>
                    </svg>
                  </button>
                </div>
                </div>
                {idx === blocks.length - 1 && dropIndex === blocks.length && dragIndex !== null && (
                  <div className={styles.dropIndicator} />
                )}
              </React.Fragment>
            ))}
            <div className={styles.blockItem}>
              <div className={styles.blockEdit}>
                <textarea
                  id="block-input-new"
                  placeholder="Neuer Block..."
                  value={newBlockValue}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewBlockValue(val);
                    if (val.startsWith("/")) {
                      setShowNewBlockMenu(true);
                      setNewBlockMenuQuery(val.slice(1));
                      setNewBlockMenuIndex(0);
                    } else if (showNewBlockMenu) {
                      setShowNewBlockMenu(false);
                      setNewBlockMenuQuery("");
                    }
                  }}
                  className={styles.blockInput}
                  rows={1}
                  onKeyDown={(e) => {
                    if ((e.target as HTMLElement).getAttribute('data-galleryblock') === 'true') return;
                    if (showNewBlockMenu) {
                      const filtered = BLOCK_TYPES.filter(
                        (bt) =>
                          bt.label.toLowerCase().includes(newBlockMenuQuery.toLowerCase()) ||
                          bt.type.toLowerCase().includes(newBlockMenuQuery.toLowerCase())
                      );
                      if (e.key === "ArrowDown") {
                        e.preventDefault();
                        setNewBlockMenuIndex((i) => (i + 1) % filtered.length);
                      } else if (e.key === "ArrowUp") {
                        e.preventDefault();
                        setNewBlockMenuIndex((i) => (i - 1 + filtered.length) % filtered.length);
                      } else if (e.key === "Enter") {
                        e.preventDefault();
                        if (filtered.length > 0) {
                          const bt = filtered[newBlockMenuIndex];
                          const insertIndex = blocks.length;
                          let blockData = "";
                          if (bt.type === "text" || bt.type === "heading") {
                            blockData = newBlockValue.startsWith("/") ? "" : newBlockValue.trim();
                          }
                          addBlock(bt.type, insertIndex, blockData);
                          setTimeout(() => {
                            const input = document.querySelector(`#block-input-${insertIndex}`);
                            if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
                              input.focus();
                            }
                          }, 10);
                          setNewBlockValue("");
                          setShowNewBlockMenu(false);
                          setNewBlockMenuQuery("");
                        }
                      } else if (e.key === "Escape") {
                        setShowNewBlockMenu(false);
                        setNewBlockMenuQuery("");
                        setNewBlockValue("");
                      }
                    } else if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      const text = newBlockValue.trim();
                      if (text !== "") {
                        const insertIndex = blocks.length;
                        addBlock("text", insertIndex, text);
                        setNewBlockValue("");
                      }
                    }
                  }}
                  style={{ paddingBottom: showNewBlockMenu ? 24 : undefined }}
                />
                {showNewBlockMenu && (() => {
                  const filtered = BLOCK_TYPES.filter(
                    (bt) => {
                      if (bt.type === "table") return true;
                      const query = newBlockMenuQuery.toLowerCase();
                      return (
                        bt.label.toLowerCase().includes(query) ||
                        bt.type.toLowerCase().includes(query) ||
                        (bt.aliases && bt.aliases.some(alias => alias.toLowerCase().includes(query)))
                      );
                    }
                  );
                  return (
                    <div className={styles.blockMenu}>
                      {filtered.length === 0 ? (
                        <div className={styles.blockMenuEmpty}>Kein Block gefunden</div>
                      ) : (
                        filtered.map((bt, i) => (
                          <div
                            key={bt.type}
                            className={
                              styles.blockMenuItem +
                              (i === newBlockMenuIndex ? ` ${styles.blockMenuItemHover}` : "")
                            }
                            onMouseDown={(e) => {
                              e.preventDefault();
                              const insertIndex = blocks.length;
                              let blockData = "";
                              if (bt.type === "text" || bt.type === "heading") {
                                blockData = newBlockValue.startsWith("/") ? "" : newBlockValue.trim();
                              }
                              addBlock(bt.type, insertIndex, blockData);
                              setTimeout(() => {
                                const input = document.querySelector(`#block-input-${insertIndex}`);
                                if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
                                  input.focus();
                                }
                              }, 10);
                              setNewBlockValue("");
                              setShowNewBlockMenu(false);
                              setNewBlockMenuQuery("");
                            }}
                            onMouseEnter={() => setNewBlockMenuIndex(i)}
                            onMouseLeave={() => setNewBlockMenuIndex(-1)}
                          >
                            <span className={styles.blockMenuIcon}>{bt.icon}</span>
                            <span>{bt.label}</span>
                          </div>
                        ))
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}