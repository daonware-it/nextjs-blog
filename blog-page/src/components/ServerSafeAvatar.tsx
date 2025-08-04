import React from 'react';
import styles from './profile.module.css';

interface ServerSafeAvatarProps {
  avatarUrl?: string;
  onClick?: () => void;
}

// Diese Komponente ist sicher für die serverseitige Rendering, da sie keine Browser-APIs verwendet
export default function ServerSafeAvatar({ avatarUrl, onClick }: ServerSafeAvatarProps) {
  return (
    <div className={styles.avatarPreview} onClick={onClick}>
      {avatarUrl ? (
        <img src={avatarUrl} alt="Avatar" className={styles.avatarImage} />
      ) : (
        <span className={styles.avatarPlaceholder}>👤</span>
      )}
    </div>
  );
}
