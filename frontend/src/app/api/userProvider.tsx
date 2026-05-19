"use client";

import { createContext, useContext, useEffect, useState } from "react";

if (typeof window !== "undefined") {
  const originalFetch = window.fetch;
  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
    let urlString = "";
    
    if (typeof input === "string") {
      urlString = input;
    } else if (input instanceof URL) {
      urlString = input.toString();
    } else if (input && (input as any).url) {
      urlString = (input as any).url;
    }

    if (urlString && urlString.includes(apiUrl)) {
      const match = document.cookie.match(new RegExp('(^| )workspaceId=([^;]+)'));
      const workspaceId = match ? match[2] : null;

      if (workspaceId) {
        init = init || {};
        init.headers = init.headers || {};

        if (init.headers instanceof Headers) {
          if (!init.headers.has("x-workspace-id")) {
            init.headers.set("x-workspace-id", workspaceId);
          }
        } else if (Array.isArray(init.headers)) {
          const hasHeader = init.headers.some(([key]) => key.toLowerCase() === "x-workspace-id");
          if (!hasHeader) {
            init.headers.push(["x-workspace-id", workspaceId]);
          }
        } else {
          const keys = Object.keys(init.headers).map(k => k.toLowerCase());
          if (!keys.includes("x-workspace-id")) {
            (init.headers as any)["x-workspace-id"] = workspaceId;
          }
        }
      }
    }
    return originalFetch(input, init);
  };
}

// Context Type definition (implicitly)
interface UserContextType {
  user: any;
  workspaces: any[];
  currentWorkspace: any;
  switchWorkspace: (id: number) => void;
  updateUser: (newData: any) => void;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
  systemConfig: any;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(undefined);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<any>(null);
  const [systemConfig, setSystemConfig] = useState<any>(null);

  const setWorkspaceCookie = (id: number) => {
    document.cookie = `workspaceId=${id}; path=/; max-age=604800; SameSite=Lax`;
  };

  const loadData = async () => {
    try {
      const resUser = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, { credentials: "include" });
      
      if (!resUser.ok) {
        // Se falhou mas temos "hint" de que deveria estar logado, tentamos mais uma vez ou apenas limpamos
        const hasTokenHint = localStorage.getItem('hasToken');
        if (hasTokenHint === 'true' && resUser.status !== 401) {
             // Pode ser erro de rede, não desloga ainda
             console.warn("Falha ao carregar usuário, tentando hint...");
        }
        throw new Error("Unauthorized");
      }

      const userData = await resUser.json();
      setUser(userData);
      localStorage.setItem('hasToken', 'true'); // Reforça o hint

      const isAuthPage = ['/login', '/register', '/forgot-password'].some(p => window.location.pathname.includes(p));
      
      // 🔥 Se já está logado e tenta acessar login/register, manda pro dashboard
      if (isAuthPage && userData) {
          window.location.href = '/dashboard';
          return;
      }

      if (userData.forcePasswordChange && !isAuthPage) {
          window.location.href = '/change-password';
          return;
      }

      // 🔥 Redirect to subscription page if license is expired
      if (userData.subscriptionStatus === "EXPIRED" && !isAuthPage && !window.location.pathname.includes('/assinatura')) {
          window.location.href = '/assinatura';
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

      // Fetch global system config
      try {
        const resConfig = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/system-config`, { credentials: "include" });
        if (resConfig.ok) {
          const configData = await resConfig.json();
          setSystemConfig(configData);
        }
      } catch (configErr) {
        console.error("Failed to load system config:", configErr);
      }
    } catch (err) {
      console.error("UserProvider error:", err);
      // Se realmente deu 401 ou erro crítico, limpa o hint e desloga
      setUser(null);
      setWorkspaces([]);
      localStorage.removeItem('hasToken');
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
      isLoading: user === undefined,
      systemConfig
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  return context?.user ?? undefined; // Keep backward compatibility for 'user' check
}

export function useUserContext() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUserContext must be used within a UserProvider");
  }
  return context;
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
  const context = useContext(UserContext);
  // user === undefined → ainda carregando
  // user === null     → carregado, não autenticado
  // user === {...}    → carregado, autenticado
  return context?.user !== undefined; // true apenas quando a carga terminou (null ou objeto)
}

export function useSystemConfig() {
  const context = useContext(UserContext);
  return context?.systemConfig || { systemName: "Rastreia.ai", modules: { whatsapp: true, meta: true, googleAds: true } };
}
