import React from 'react';
import TextBlockEdit from './blocks/TextBlockEdit';
import HeadingBlockEdit from './blocks/HeadingBlockEdit';
import QuoteBlockEdit from './blocks/QuoteBlockEdit';
import ImageBlockEdit from './blocks/ImageBlockEdit';
import CodeBlock from './CodeBlock';
import Toc from './Toc';
import NoticeBlockEdit from './blocks/NoticeBlockEdit';
import { BlockType } from './BlockTypes';

export const BLOCK_TYPE_CONFIG: Record<string, {
  label: string;
  icon: React.ReactNode;
  EditComponent: React.ComponentType<any>;
}> = {
  text:    { label: 'Text',        icon: 'T', EditComponent: TextBlockEdit },
  heading: { label: 'Überschrift', icon: 'H', EditComponent: HeadingBlockEdit },
  quote:   { label: 'Zitat',       icon: '❝', EditComponent: QuoteBlockEdit },
  image:   { label: 'Bild',        icon: '🖼️', EditComponent: ImageBlockEdit },
  code:    { label: 'Code',        icon: '<>', EditComponent: CodeBlock },
  notice:  { label: 'Hinweis',     icon: '⚠️', EditComponent: NoticeBlockEdit },
  toc:     { label: 'Inhalt',      icon: '≡', EditComponent: Toc },
};

export const getBlockEditComponent = (type: BlockType) => {
  return BLOCK_TYPE_CONFIG[type]?.EditComponent;
};
