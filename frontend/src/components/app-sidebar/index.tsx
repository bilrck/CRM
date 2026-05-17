"use client";

import {
  MessageCircle,
  LayoutDashboard,
  UsersRound,
  Settings,
  User,
  ChevronUp,
  Filter,
  Link2,
  ChartNoAxesCombined,
  Plug,
  Terminal,
  Users,
  CalendarClock,
  Activity,
  Briefcase,
  Sparkles,
  LogOut,
  Building,
  ShieldCheck,
  CheckCircle,
  Cpu
} from "lucide-react";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroupLabel,
  SidebarSeparator
} from "@/components/ui/sidebar";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";

import { useUser, useWorkspace, useSystemConfig } from "@/app/api/userProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Menu Groups for better Organization
interface MenuItem {
  title: string;
  url: string;
  icon: any; // Using any for Lucide icon components for simplicity
  adminOnly?: boolean;
  managerOnly?: boolean;
}

interface MenuGroup {
  label: string;
  items: MenuItem[];
}

const GROUPS: MenuGroup[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
      { title: "Minha Assinatura", url: "/assinatura", icon: Sparkles },
      { title: "Relatórios", url: "/relatorios", icon: ChartNoAxesCombined },
    ]
  },
  {
    label: "Vendas & CRM",
    items: [
      { title: "Leads", url: "/leads", icon: UsersRound },
      { title: "Funil de Vendas", url: "/funil", icon: Filter },
      { title: "Tarefas", url: "/tarefas", icon: CheckCircle },
      { title: "Clientes", url: "/clientes", icon: Briefcase, managerOnly: true },
      { title: "Campos Personalizados", url: "/vendas/campos-personalizados", icon: Activity, managerOnly: true },
    ]
  },
  {
    label: "Atendimento",
    items: [
      { title: "WhatsApp", url: "/whatsapp", icon: MessageCircle },
      { title: "Follow-ups", url: "/follow-ups", icon: CalendarClock },
    ]
  },
  {
    label: "Integrações & Automação",
    items: [
      { title: "Conexões", url: "/conexoes", icon: Plug },
      { title: "Rastreamento", url: "/rastreamento", icon: Link2 },
      { title: "Inteligência Artificial", url: "/integracoes/ai", icon: Sparkles },
    ]
  },
  {
    label: "Gestão Corporativa",
    items: [
      { title: "Equipe", url: "/equipe", icon: Users },
      { title: "Configuração API", url: "/configuracoes/api", icon: Settings },
      { title: "Gestão de Licenças", url: "/admin/licencas", icon: ShieldCheck, adminOnly: true },
      { title: "Gestão do Sistema", url: "/admin/sistema", icon: Cpu, adminOnly: true },
      { title: "Logs do Sistema", url: "/admin/logs", icon: Terminal, adminOnly: true },
    ]
  }
];

export function AppSidebar() {
  const user = useUser();
  const { workspaces, currentWorkspace, switchWorkspace } = useWorkspace();
  const systemConfig = useSystemConfig();
  const pathname = usePathname();
  const router = useRouter();

  if (!user) return null;

  const handleLogout = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/logout`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (response.ok) router.push("/login");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  return (
    <Sidebar collapsible="icon" className="h-screen border-r border-sidebar-border shadow-sm">
      
      {/* --- HEADER: Logo & Workspace Switcher --- */}
      <SidebarHeader className="p-4 flex flex-col gap-4">
        <div className="flex items-center gap-3 px-2 group-data-[collapsible=icon]:justify-center transition-all">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-sm shadow-primary/20">
            <Sparkles className="size-4 text-primary-foreground" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <h1 className="text-lg font-bold tracking-tight text-sidebar-foreground">{systemConfig?.systemName || "Rastreia.ai"}</h1>
            <p className="text-[10px] text-sidebar-primary uppercase tracking-widest font-semibold">Inteligência CRM</p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center px-3 py-2 w-full rounded-xl bg-sidebar-accent/50 hover:bg-sidebar-accent border border-sidebar-border/50 text-sidebar-foreground transition-all group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:justify-center hover:shadow-sm">
              <Building className="size-4 shrink-0 text-primary" />
              <div className="flex flex-col items-start ml-3 overflow-hidden group-data-[collapsible=icon]:hidden flex-1">
                <span className="text-[10px] font-semibold text-sidebar-foreground/50 uppercase tracking-wider">Workspace</span>
                <span className="text-sm font-medium truncate w-full text-left leading-tight text-sidebar-foreground">{currentWorkspace?.name || "Selecione..."}</span>
              </div>
              <ChevronUp className="ml-auto size-4 shrink-0 opacity-50 rotate-180 group-data-[collapsible=icon]:hidden" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[240px] rounded-xl border-border" align="start" side="bottom" sideOffset={8}>
            <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Meus Workspaces</DropdownMenuLabel>
            
            {workspaces.map((ws: { id: number; name: string }) => (
               <DropdownMenuItem 
                  key={ws.id} 
                  className={`gap-3 p-2 cursor-pointer rounded-lg mb-1 ${currentWorkspace?.id === ws.id ? "bg-primary/10 text-primary" : "text-foreground"}`}
                  onClick={() => switchWorkspace(ws.id)}
               >
                 <div className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold ${currentWorkspace?.id === ws.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                   {ws.name.charAt(0).toUpperCase()}
                 </div>
                 <div className="flex flex-col">
                   <span className="font-semibold text-sm leading-none">{ws.name}</span>
                   {currentWorkspace?.id === ws.id && <span className="text-[10px] mt-1 text-primary">Ativo</span>}
                 </div>
               </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator className="my-2" />
            
            <DropdownMenuItem className="gap-2 cursor-pointer text-muted-foreground focus:text-primary rounded-lg p-2" onClick={() => router.push('/configuracoes/workspace')}>
               <Settings className="size-4" />
               <span className="font-semibold">Configurações</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarHeader>

      {/* --- CONTENT: Navigation Groups --- */}
      <SidebarContent className="px-2 scrollbar-none pb-4">
        {GROUPS.map((group, index) => {
          
          // Pre-filter items based on role and subscription
          const visibleItems = group.items.filter(item => {
            // Check Admin/Manager roles
            if (item.adminOnly && user?.role !== "ADMIN") return false;
            if (item.managerOnly && !["MANAGER", "ADMIN"].includes(user?.role)) return false;

            // Check modules
            if (item.url === "/whatsapp" && systemConfig?.modules?.whatsapp === false) return false;
            if (item.url === "/rastreamento" && systemConfig?.modules?.googleAds === false) return false;

            // Check Subscription for non-admins
            if (user?.role !== "ADMIN") {
               const now = new Date();
               const isExpired = user?.subscriptionStatus === "EXPIRED" || 
                               (user?.subscriptionStatus === "TRIAL" && user?.trialEndsAt && new Date(user?.trialEndsAt) < now) ||
                               (user?.subscriptionExpiresAt && new Date(user?.subscriptionExpiresAt) < now);
               
               // If expired, ONLY allow "Minha Assinatura"
               if (isExpired && item.url !== "/assinatura") return false;
            }

            return true;
          });

          if (visibleItems.length === 0) return null;

          return (
            <SidebarGroup key={group.label} className="pt-2">
              <SidebarGroupLabel className="text-[11px] font-bold tracking-wider text-muted-foreground/70 uppercase group-data-[collapsible=icon]:hidden mb-1">
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleItems.map((item) => {
                    const isActive = pathname?.startsWith(item.url);

                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          tooltip={item.title}
                          className={`
                            h-10 px-3 py-2 mb-0.5 w-full rounded-xl transition-all duration-200 ease-in-out
                            hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
                            ${isActive 
                                ? "bg-primary text-primary-foreground font-semibold shadow-sm hover:bg-primary/90" 
                                : "text-sidebar-foreground/80 font-medium"}
                          `}
                        >
                          <Link href={item.url} className="flex items-center gap-3">
                            <item.icon className={`size-5 shrink-0 ${isActive ? "text-primary-foreground" : "text-primary"}`}/>
                            <span className="truncate">{item.title}</span>
                            {isActive && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-foreground shadow-[0_0_8px_rgba(255,255,255,0.4)] group-data-[collapsible=icon]:hidden" />
                            )}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
              {index < GROUPS.length - 1 && <SidebarSeparator className="mt-4 opacity-50 bg-border group-data-[collapsible=icon]:hidden" />}
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      {/* --- FOOTER: User Profile --- */}
      <SidebarFooter className="p-4 mt-auto">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 w-full p-2 rounded-xl transition-colors hover:bg-sidebar-accent border border-transparent hover:border-sidebar-border/50 group-data-[collapsible=icon]:justify-center focus:outline-none">
                  <Avatar className="h-8 w-8 rounded-md border border-sidebar-border shadow-sm">
                    <AvatarImage src={user?.avatarUrl || ""} alt={user?.name} />
                    <AvatarFallback className="bg-primary text-primary-foreground rounded-md font-bold text-xs text-center flex items-center justify-center">
                      {user?.name?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start overflow-hidden group-data-[collapsible=icon]:hidden flex-1">
                    <span className="text-sm font-bold truncate w-full text-sidebar-foreground">{user?.name}</span>
                    <span className="text-xs text-sidebar-foreground/60 truncate w-full">{user?.email}</span>
                  </div>
                  <ChevronUp className="size-4 opacity-60 text-muted-foreground ml-auto group-data-[collapsible=icon]:hidden" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent side="right" align="end" className="w-[240px] rounded-xl border-border" sideOffset={12}>
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-t-xl mb-1">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.avatarUrl || ""} alt={user?.name} />
                    <AvatarFallback className="bg-primary/20 text-primary font-bold">
                      {user?.name?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col flex-1 truncate">
                    <span className="text-sm font-bold text-foreground">{user?.name}</span>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{user?.role}</span>
                  </div>
                </div>
                <DropdownMenuSeparator />
                
                <DropdownMenuItem asChild className="p-3 cursor-pointer rounded-md">
                  <Link href="/me" className="flex items-center gap-2">
                    <User className="size-4" />
                    <span>Configurações da Conta</span>
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  onClick={handleLogout} 
                  className="p-3 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 rounded-md"
                >
                  <LogOut className="size-4 mr-2" />
                  <span className="font-semibold">Sair do Sistema</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

    </Sidebar>
  );
}
