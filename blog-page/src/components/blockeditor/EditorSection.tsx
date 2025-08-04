import React from 'react';
import { useRouter } from 'next/router';
import BlockEditor from './BlockEditor';
import styles from '../../pages/create-blog.module.css';

interface EditorSectionProps {
  blocks: any[];
  setBlocks: (blocks: any[]) => void;
  userId?: string;
  currentDraftId?: string;
  onDraftIdChange: (id: string | undefined) => void;
}

export default function EditorSection({ 
  blocks, 
  setBlocks, 
  userId, 
  currentDraftId, 
  onDraftIdChange 
}: EditorSectionProps) {
  const router = useRouter();
  
  return (
    <>
      {router.isReady ? (
        <div className={styles.editorContainer}>
          <BlockEditor
            value={blocks}
            onChange={setBlocks}
            userId={userId}
            draftId={currentDraftId}
            onDraftIdChange={onDraftIdChange}
          />
        </div>
      ) : (
        <div className={styles.editorLoading}>
          Lade Editor...
        </div>
      )}
    </>
  );
}
