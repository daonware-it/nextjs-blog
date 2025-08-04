import { Block } from "./blockeditor/BlockTypes";

export function updateCache(blocks: Block[], cacheKey: string): void {
  if (typeof window !== "undefined") {
    try {
      // Bestehende Daten abrufen, um die ID zu erhalten
      let existingData: any = {};
      const existingCache = localStorage.getItem(cacheKey);
      
      if (existingCache) {
        try {
          existingData = JSON.parse(existingCache);
        } catch (e) {
          console.error('[updateCache] Fehler beim Parsen des existierenden Caches:', e);
        }
      }
      
      // Die vorhandene ID priorisieren - zuerst aus URL oder blockEditorDraftId
      const storedDraftId = localStorage.getItem("blockEditorDraftId");
      // Priorität: 1. Gespeicherte blockEditorDraftId, 2. Bestehende ID im Cache
      const draftId = (storedDraftId && storedDraftId !== "undefined" && storedDraftId !== "null") 
                     ? storedDraftId 
                     : (existingData.id && existingData.id !== "undefined" && existingData.id !== "null")
                       ? existingData.id
                       : undefined;
      
      // Cache aktualisieren mit der korrekten ID
      localStorage.setItem(cacheKey, JSON.stringify({
        id: draftId,
        blocks: blocks,
        lastModified: new Date().toISOString()
      }));
    } catch (e) {
      console.error('[updateCache] Fehler beim Aktualisieren des Caches:', e);
    }
  }
}
