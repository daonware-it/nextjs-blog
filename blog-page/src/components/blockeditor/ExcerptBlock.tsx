import React from "react";
import styles from "./ExcerptBlock.module.css";

export interface ExcerptBlockProps {
  text: string;
}

const ExcerptBlock: React.FC<ExcerptBlockProps> = ({ text }) => (
  <blockquote className={styles.excerptBlock}>
    <span className={styles.icon}>📝</span>
    <span className={styles.label}>Auszug</span>
    <span className={styles.text}>{text}</span>
  </blockquote>
);

export default ExcerptBlock;
