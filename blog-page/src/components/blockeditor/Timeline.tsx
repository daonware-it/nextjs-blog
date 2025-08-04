import React from 'react';
import styles from './Timeline.module.css';

export interface TimelineItem {
  title: string;
  date?: string;
  description?: string;
  icon?: React.ReactNode;
}

interface TimelineProps {
  items: TimelineItem[];
}

const Timeline: React.FC<TimelineProps> = ({ items }) => {
  return (
    <div className={styles.timelineWrapper}>
      <ul className={styles.timelineList}>
        {items.map((item, idx) => {
          // Jahr extrahieren, falls Datum vorhanden
          let year = '';
          if (item.date && /^\d{4}/.test(item.date)) {
            year = item.date.substring(0, 4);
          }
          return (
            <li className={styles.timelineItem} key={idx}>
              {/* Jahreszahl-Badge */}
              {year && <div className={styles.timelineYearBadge}>{year}</div>}
              <div className={styles.timelineContent}>
                <div className={styles.timelineTitle}>{item.title}</div>
                {item.date && <div className={styles.timelineDate}>{item.date}</div>}
                {item.description && <div className={styles.timelineDescription}>{item.description}</div>}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default Timeline;
