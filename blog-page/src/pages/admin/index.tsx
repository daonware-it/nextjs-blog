import React from "react";
import { useSession } from "next-auth/react";
import AdminInterface from "../../admin/AdminInterface";
import { useRouter } from "next/router";

const AdminPage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  React.useEffect(() => {
    if (status === "loading") return;
    const user = session?.user as (typeof session.user & { role?: string }) | undefined;
    const role = user?.role;
    if (role !== "ADMIN" && role !== "MODERATOR") {
      router.replace("/");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return <div style={{textAlign:'center',marginTop:80}}>Lade...</div>;
  }

  const user = session?.user as (typeof session.user & { role?: string }) | undefined;
  if (user?.role !== "ADMIN" && user?.role !== "MODERATOR") {
    return null;
  }

  return <AdminInterface />;
};

export default AdminPage;
