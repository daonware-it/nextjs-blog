
import React, { useRef, useState } from "react";
import styles from "./profile.module.css";
import ServerSafeAvatar from "./ServerSafeAvatar";

type AvatarUploadProps = {
  avatarUrl?: string;
  onUpload: (file: any) => void;
};

// Dummy-Komponente für SSR
const DummyAvatarUpload = (_props: AvatarUploadProps) => null;

function AvatarUploadImpl({ avatarUrl, onUpload }: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | undefined>(avatarUrl);
  React.useEffect(() => {
    setPreview(avatarUrl);
  }, [avatarUrl]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await fetch("/api/auth/avatar-upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.avatarUrl) {
        setPreview(data.avatarUrl);
        onUpload(file);
      } else {
        alert(data.error || "Upload fehlgeschlagen.");
      }
    }
  }

  return (
    <div className={styles.avatarUploadContainer}>
      <ServerSafeAvatar 
        avatarUrl={preview} 
        onClick={() => fileInputRef.current?.click()} 
      />
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      <button type="button" className={styles.avatarButton} onClick={() => fileInputRef.current?.click()}>
        Avatar ändern
      </button>
    </div>
  );
}

const AvatarUpload = typeof window === "undefined" ? DummyAvatarUpload : AvatarUploadImpl;

export default AvatarUpload;

