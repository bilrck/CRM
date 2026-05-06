"use client";

import { createContext, useContext, useEffect, useState } from "react";

// Context Type definition (implicitly)
interface UserContextType {
  user: any;
  workspaces: any[];
  currentWorkspace: any;
  switchWorkspace: (id: number) => void;
  updateUser: (newData: any) => void;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(undefined);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<any>(null);

  const setWorkspaceCookie = (id: number) => {
    document.cookie = `workspaceId=${id}; path=/; max-age=604800; SameSite=Lax`;
  };

  const loadData = async () => {
    try {
      const resUser = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, { credentials: "include" });
      if (!resUser.ok) throw new Error("Unauthorized");
      const userData = await resUser.json();
      setUser(userData);

      const isAuthPage = ['/login', '/register', '/change-password'].some(p => window.location.pathname.includes(p));
      if (userData.forcePasswordChange && !isAuthPage) {
          window.location.href = '/change-password';
          return;
      }

      const resWorkspaces = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workspace/list`, { credentials: "include" });
      if (resWorkspaces.ok) {
         const workspaceList = await resWorkspaces.json();
         setWorkspaces(workspaceList);

         let active = null;
         const match = document.cookie.match(new RegExp('(^| )workspaceId=([^;]+)'));
         const cookieId = match ? Number(match[2]) : null;

         if (cookieId) {
           active = workspaceList.find((w: any) => w.id === cookieId);
         }
         
         if (!active && workspaceList.length > 0) {
           active = workspaceList[0];
         }

         if (active) {
           setCurrentWorkspace(active);
           if (active.id !== cookieId) {
              setWorkspaceCookie(active.id);
           }
         }
      }
    } catch (err) {
      console.error("UserProvider error:", err);
      setUser(null);
      setWorkspaces([]);
    }
  };

  const refreshUser = async () => {
    await loadData();
  };

  const updateUser = (newData: any) => {
    setUser((prev: any) => ({ ...prev, ...newData }));
  };

  const switchWorkspace = (workspaceId: number) => {
    const target = workspaces.find(w => w.id === workspaceId);
    if (target) {
      setCurrentWorkspace(target);
      setWorkspaceCookie(workspaceId);
      window.location.reload();
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <UserContext.Provider value={{ 
      user, 
      workspaces, 
      currentWorkspace, 
      switchWorkspace, 
      updateUser, 
      refreshUser,
      isLoading: user === undefined 
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  return context?.user ?? undefined; // Keep backward compatibility for 'user' check
}

export function useWorkspace() {
  const context = useContext(UserContext);
  if (!context) return { workspaces: [], currentWorkspace: null, switchWorkspace: () => {} };
  return {
    workspaces: context.workspaces,
    currentWorkspace: context.currentWorkspace,
    switchWorkspace: context.switchWorkspace
  };
}

export function useUserLoaded() {
  const user = useUser();
  return user !== undefined; // true quando carregado
}
