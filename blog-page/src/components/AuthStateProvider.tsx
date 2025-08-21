import React, { createContext, useContext, useEffect, useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

interface AuthStateContextType {
  isCheckingStatus: boolean;
}

const AuthStateContext = createContext<AuthStateContextType>({ isCheckingStatus: false });

export const useAuthState = () => useContext(AuthStateContext);

export const AuthStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: session } = useSession();
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!session?.user) {
      return;
    }

    const userId = (session.user as any).id;
    if (!userId) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        setIsCheckingStatus(true);
        
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/auth/check-status?t=${timestamp}`);
        
        if (!response.ok) {
          return;
        }
        
        const data = await response.json();
        
        if (data.status === 'BANNED') {
          await signOut({ redirect: false });
          router.push('/login?error=banned');
        }
      } catch (error) {
      } finally {
        setIsCheckingStatus(false);
      }
    }, 30000); 

    (async () => {
      try {
        setIsCheckingStatus(true);
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/auth/check-status?t=${timestamp}`);
        
        if (!response.ok) {
          return;
        }
        
        const data = await response.json();
        
        if (data.status === 'BANNED') {
          await signOut({ redirect: false });
          router.push('/login?error=banned');
        }
      } catch (error) {
      } finally {
        setIsCheckingStatus(false);
      }
    })();

    return () => clearInterval(interval);
  }, [session, router]);

  useEffect(() => {
    if (!session?.user) return;
    const interval = setInterval(() => {
      if (typeof window !== 'undefined' && window.location.pathname === '/profile') {
        window.location.reload();
      }
    }, 60000); 
    return () => clearInterval(interval);
  }, [session?.user?.email]);

  useEffect(() => {
    if (!session?.user?.email) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/auth/check-email');
        if (!res.ok) return;
        const data = await res.json();
        const dbEmail = data?.email?.toLowerCase();
        const sessionEmail = session.user.email.toLowerCase();
        if (dbEmail && sessionEmail && dbEmail !== sessionEmail) {
          await signOut({ redirect: true });
        }
      } catch (e) {
      }
    }, 60000); 
    return () => clearInterval(interval);
  }, [session?.user?.email]);

  return (
    <AuthStateContext.Provider value={{ isCheckingStatus }}>
      {children}
    </AuthStateContext.Provider>
  );
};
