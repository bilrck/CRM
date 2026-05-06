"use client";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Notifications } from "@/components/notifications";
import { UserProvider, useUser, useUserLoaded } from "../api/userProvider";
import { SubscriptionBanner } from "@/components/subscription-banner";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Toaster } from 'sonner';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <DashboardWithUser>{children}</DashboardWithUser>
    </UserProvider>
  );
}

function DashboardWithUser({ children }: { children: React.ReactNode }) {
  const loaded = useUserLoaded();
  const user = useUser();
  const router = useRouter();

  // 🔥 Redirecionamento correto
  useEffect(() => {
    if (loaded) {
      if (user === null) {
        router.replace("/login");
      } else if (user.role !== "ADMIN") {
        const isAssinaturaPage = window.location.pathname === "/assinatura";
        const now = new Date();
        const trialExpired = user.subscriptionStatus === "TRIAL" && user.trialEndsAt && new Date(user.trialEndsAt) < now;
        const subExpired = user.subscriptionStatus === "EXPIRED" || (user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) < now);

        if ((trialExpired || subExpired) && !isAssinaturaPage) {
          router.replace("/assinatura");
        }
      }
    }
  }, [loaded, user, router]);

  if (!loaded) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background">
        <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center shrink-0 mb-4 animate-pulse">
             <div className="w-4 h-4 rounded-full bg-primary" />
        </div>
        <p className="text-lg text-muted-foreground font-medium">Carregando Rastreia.ai...</p>
      </div>
    );
  }

  if (user === null) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background transition-colors duration-300">

        <AppSidebar />
        <main className="flex-1 max-w-full p-4 relative">
          <div className="sticky top-0 z-20 w-full mb-4">
            <SubscriptionBanner />
            <div className="flex justify-between items-center bg-background/60 backdrop-blur-md p-3 border-b border-border/50 rounded-b-xl shadow-sm">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="text-primary hover:bg-primary/10 transition-colors" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest hidden sm:inline-block">Rastreia.ai CRM</span>
              </div>
              <div className="flex items-center gap-4">
                <Notifications />
              </div>
            </div>
          </div>
          {children}
          <Toaster />
        </main>
      </div>
    </SidebarProvider>
  );
}
