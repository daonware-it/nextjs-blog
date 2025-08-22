import React from "react";
import { useSession } from "next-auth/react";
import AdminInterface from "./AdminInterface";
import { useRouter } from "next/router";

const AdminPage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();


  type UserWithRole = { role?: string } & typeof session.user;
  React.useEffect(() => {
    if (status === "loading") return;
    const role = (session?.user as UserWithRole)?.role;
    if (!role || (role !== "ADMIN" && role !== "MODERATOR")) {
      router.replace("/");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return <div style={{textAlign:'center',marginTop:80}}>Lade...</div>;
  }

  const role = (session?.user as UserWithRole)?.role;
  if (!role || (role !== "ADMIN" && role !== "MODERATOR")) {
    return null;
  }

  return <AdminInterface />;
};

export default AdminPage;
