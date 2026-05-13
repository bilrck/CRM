"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  Building2, 
  Shield, 
  Bell,
  Palette,
  Lock,
  Camera,
  Save,
  CheckCircle2,
  Loader2,
  Trash2,
  Plus,
  Sparkles,
  Info
} from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUser } from "@/app/api/userProvider";
import { useTheme } from "next-themes";

export default function Me() {
  const user = useUser();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("perfil");
  const [loading, setLoading] = useState(false);
  
  // Dados do Perfil
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    cargo: "",
    empresa: "",
    avatar: ""
  });

  // Notificações
  const [notifData, setNotifData] = useState({
    email: true,
    push: true,
    whatsapp: false,
    newLead: true,
    conversion: true,
    message: true,
    dailyReport: false,
    weeklyReport: true
  });

  // Preferências
  const [prefData, setPrefData] = useState({
    theme: "light",
    language: "pt-BR",
    timezone: "America/Sao_Paulo",
    dateFormat: "DD/MM/YYYY",
    currency: "BRL"
  });

  // Sync theme with next-themes
  useEffect(() => {
    if (prefData.theme && prefData.theme !== theme) {
      setTheme(prefData.theme);
    }
  }, [prefData.theme, theme, setTheme]);

  // Senha
  const [passwordForm, setPasswordForm] = useState({
    current: "",
    new: "",
    confirm: ""
  });

  // Initialize data when user is loaded
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        cargo: user.role || "",
        empresa: user.workspaceName || "",
        avatar: user.avatarUrl || ""
      });
      if (user.notificationSettings) setNotifData(user.notificationSettings);
      if (user.preferences) setPrefData(user.preferences);
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileData.name,
          phone: profileData.phone,
          avatarUrl: profileData.avatar
        }),
        credentials: "include"
      });
      if (res.ok) {
        toast.success("Perfil atualizado com sucesso!");
      } else {
        toast.error("Erro ao atualizar perfil");
      }
    } catch (_error) {
      toast.error("Erro no servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/notifications`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notifications: notifData }),
        credentials: "include"
      });
      if (res.ok) {
        toast.success("Configurações de notificações atualizadas!");
      } else {
        toast.error("Erro ao salvar notificações");
      }
    } catch (error) {
      toast.error("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/preferences`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: prefData }),
        credentials: "include"
      });
      if (res.ok) {
        toast.success("Preferências salvas!");
      } else {
        toast.error("Erro ao salvar");
      }
    } catch (error) {
      toast.error("Erro no servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.new !== passwordForm.confirm) {
      toast.error("As senhas não coincidem!");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.current,
          newPassword: passwordForm.new
        }),
        credentials: "include"
      });
      if (res.ok) {
        toast.success("Senha alterada com sucesso!");
        setPasswordForm({ current: "", new: "", confirm: "" });
      } else {
        const err = await res.json();
        toast.error(err.error || "Erro ao alterar senha");
      }
    } catch (_error) {
      toast.error("Erro no servidor");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return (
    <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
      <Loader2 className="animate-spin text-primary w-8 h-8" />
      <p className="text-muted-foreground animate-pulse">Carregando seu perfil...</p>
    </div>
  );

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <Badge variant="outline" className="mb-2 border-primary/20 text-primary bg-primary/5 uppercase tracking-widest text-[10px] px-3 py-1">
            Configurações de Conta
          </Badge>
          <h1 className="text-3xl sm:text-4xl text-foreground font-extrabold tracking-tight">
            Olá, <span className="text-primary">{user.name.split(' ')[0]}</span>
          </h1>
          <p className="text-muted-foreground">Gerencie suas informações, preferências e segurança.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-full border border-border/50">
          <Shield size={12} className="text-emerald-500" />
          LGPD: Seus dados estão protegidos e criptografados.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar Profile Card */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="overflow-hidden border-none shadow-xl shadow-primary/5 bg-gradient-to-b from-primary/5 to-transparent">
            <CardContent className="pt-8 flex flex-col items-center">
              <div className="relative group">
                <Avatar className="w-32 h-32 ring-4 ring-background shadow-2xl transition-transform duration-300 group-hover:scale-105">
                  <AvatarImage src={profileData.avatar} />
                  <AvatarFallback className="text-4xl bg-primary text-primary-foreground font-bold">
                    {user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                   <Camera className="text-white" />
                </div>
                <Button
                  size="sm"
                  className="absolute bottom-1 right-1 rounded-full w-8 h-8 p-0 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg border-2 border-background"
                >
                  <Plus size={14} />
                </Button>
              </div>
              
              <div className="text-center mt-6 space-y-1 w-full">
                <h3 className="text-xl text-foreground font-bold">{user.name}</h3>
                <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-transparent shadow-none uppercase text-[10px] font-bold">
                  {user.role}
                </Badge>
                <p className="text-xs text-muted-foreground pt-1">{user.email}</p>
              </div>

              <div className="w-full mt-8 pt-6 border-t border-border/50 space-y-4">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                    <Building2 size={14} className="text-primary/60" />
                  </div>
                  <span className="font-medium truncate">{profileData.empresa}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                    <Phone size={14} className="text-primary/60" />
                  </div>
                  <span className="font-medium">{profileData.phone || "Não informado"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Info Card */}
          <Card className="bg-primary/5 border-primary/10">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                 <Sparkles size={14} /> Nível da Conta
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-muted-foreground">Perfil Completo</span>
                  <span>85%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div className="bg-primary h-full rounded-full transition-all duration-1000" style={{ width: '85%' }}></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <div className="lg:col-span-9">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 md:grid-cols-5 h-auto p-1 bg-muted/50 rounded-2xl border border-border/50 mb-8 overflow-hidden">
              <TabsTrigger value="perfil" className="py-2.5 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-md transition-all gap-2">
                <UserIcon size={14} />
                <span className="hidden sm:inline">Perfil</span>
              </TabsTrigger>
              <TabsTrigger value="notificacoes" className="py-2.5 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-md transition-all gap-2">
                <Bell size={14} />
                <span className="hidden sm:inline">Notificações</span>
              </TabsTrigger>
              <TabsTrigger value="preferencias" className="py-2.5 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-md transition-all gap-2">
                <Palette size={14} />
                <span className="hidden sm:inline">Preferências</span>
              </TabsTrigger>
              <TabsTrigger value="seguranca" className="py-2.5 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-md transition-all gap-2">
                <Lock size={14} />
                <span className="hidden sm:inline">Segurança</span>
              </TabsTrigger>
              <TabsTrigger value="privacidade" className="py-2.5 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-md transition-all gap-2">
                <Shield size={14} />
                <span className="hidden sm:inline">Privacidade</span>
              </TabsTrigger>
            </TabsList>

            {/* TAB CONTENT: PERFIL */}
            <TabsContent value="perfil" className="space-y-6 focus-visible:outline-none">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Pessoais</CardTitle>
                  <CardDescription>Atualize seus dados de contato e identificação.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome Completo</Label>
                      <Input
                        id="nome"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        className="bg-muted/30 focus:bg-background transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Email Principal</Label>
                        <Badge variant="outline" className="text-[9px] h-4 opacity-50 uppercase">Read-only</Badge>
                      </div>
                      <div className="relative">
                        <Input value={profileData.email} readOnly className="bg-muted text-muted-foreground pr-10 cursor-not-allowed" />
                        <Lock size={14} className="absolute right-3 top-3 opacity-20" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefone">Telefone / WhatsApp</Label>
                      <Input
                        id="telefone"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        className="bg-muted/30"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Cargo / Role</Label>
                      <Input value={profileData.cargo} readOnly className="bg-muted text-muted-foreground uppercase font-bold text-xs" />
                    </div>
                  </div>
                  <div className="flex justify-end pt-4">
                    <Button onClick={handleSaveProfile} disabled={loading} className="px-8 shadow-lg shadow-primary/20">
                      {loading ? <Loader2 size={18} className="mr-2 animate-spin" /> : <Save size={18} className="mr-2" />}
                      Salvar Alterações
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB CONTENT: NOTIFICAÇÕES */}
            <TabsContent value="notificacoes" className="space-y-6 focus-visible:outline-none">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="md:col-span-1">
                  <CardHeader>
                    <CardTitle className="text-lg">Canais de Alerta</CardTitle>
                    <CardDescription>Onde você deseja receber avisos.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { id: 'email', label: 'Email', desc: 'Alertas importantes no seu inbox', icon: Mail },
                      { id: 'push', label: 'Push Browser', desc: 'Notificações no navegador', icon: Bell },
                      { id: 'whatsapp', label: 'WhatsApp', desc: 'Receber via nosso bot oficial', icon: Phone },
                    ].map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-muted/10">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <item.icon size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-bold">{item.label}</p>
                            <p className="text-xs text-muted-foreground">{item.desc}</p>
                          </div>
                        </div>
                        <Switch 
                          checked={notifData[item.id as keyof typeof notifData]} 
                          onCheckedChange={(val) => setNotifData({ ...notifData, [item.id]: val })} 
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="md:col-span-1">
                  <CardHeader>
                    <CardTitle className="text-lg">Eventos do CRM</CardTitle>
                    <CardDescription>Quais ações disparam alertas.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {[
                      { id: 'newLead', label: 'Novo Lead Capturado' },
                      { id: 'conversion', label: 'Lead Ganho / Conversão' },
                      { id: 'message', label: 'Nova Mensagem de Cliente' },
                      { id: 'dailyReport', label: 'Relatório Diário' },
                      { id: 'weeklyReport', label: 'Resumo Semanal' },
                    ].map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/20 transition-colors">
                        <span className="text-sm font-medium">{item.label}</span>
                        <Switch 
                          checked={notifData[item.id as keyof typeof notifData]} 
                          onCheckedChange={(val) => setNotifData({ ...notifData, [item.id]: val })} 
                        />
                      </div>
                    ))}
                    <div className="pt-6">
                       <Button onClick={handleSaveNotifications} disabled={loading} className="w-full">
                          {loading ? <Loader2 size={18} className="mr-2 animate-spin" /> : <Save size={18} className="mr-2" />}
                          Salvar Notificações
                       </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* TAB CONTENT: PREFERENCIAS */}
            <TabsContent value="preferencias" className="space-y-6 focus-visible:outline-none">
              <Card>
                <CardHeader>
                  <CardTitle>Personalização</CardTitle>
                  <CardDescription>Ajuste o sistema ao seu estilo e fuso horário.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Tema do Sistema</Label>
                      <Select value={prefData.theme} onValueChange={(val) => setPrefData({ ...prefData, theme: val })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Claro</SelectItem>
                          <SelectItem value="dark">Escuro</SelectItem>
                          <SelectItem value="system">Sistema</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Idioma</Label>
                      <Select value={prefData.language} onValueChange={(val) => setPrefData({ ...prefData, language: val })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                          <SelectItem value="en-US">English (US)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Fuso Horário</Label>
                      <Select value={prefData.timezone} onValueChange={(val) => setPrefData({ ...prefData, timezone: val })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="America/Sao_Paulo">Brasília (GMT-3)</SelectItem>
                          <SelectItem value="Europe/London">Londres (GMT+0)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Moeda Exibida</Label>
                      <Select value={prefData.currency} onValueChange={(val) => setPrefData({ ...prefData, currency: val })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BRL">Real (R$)</SelectItem>
                          <SelectItem value="USD">Dólar ($)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end pt-4">
                    <Button onClick={handleSavePreferences} disabled={loading}>
                      Salvar Preferências
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB CONTENT: SEGURANÇA */}
            <TabsContent value="seguranca" className="space-y-6 focus-visible:outline-none">
              <Card>
                <CardHeader>
                  <CardTitle>Autenticação</CardTitle>
                  <CardDescription>Gerencie sua senha e sessões ativas.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="max-w-md space-y-4">
                    <div className="space-y-2">
                      <Label>Senha Atual</Label>
                      <Input 
                        type="password" 
                        value={passwordForm.current} 
                        onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Nova Senha</Label>
                      <Input 
                        type="password" 
                        value={passwordForm.new} 
                        onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Confirmar Nova Senha</Label>
                      <Input 
                        type="password" 
                        value={passwordForm.confirm} 
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })} 
                      />
                    </div>
                    <Button onClick={handleChangePassword} disabled={loading} className="w-full md:w-auto">
                      Atualizar Senha
                    </Button>
                  </div>

                  <div className="pt-8 border-t border-border/50">
                    <div className="flex items-center justify-between p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/20">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                          <Shield size={24} />
                        </div>
                        <div>
                          <p className="font-bold text-foreground">Autenticação de Dois Fatores (2FA)</p>
                          <p className="text-xs text-muted-foreground">Sua conta está protegida com verificação adicional.</p>
                        </div>
                      </div>
                      <Badge className="bg-emerald-500 text-white border-none">Ativado</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB CONTENT: PRIVACIDADE */}
            <TabsContent value="privacidade" className="space-y-6 focus-visible:outline-none">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-dashed">
                  <CardHeader>
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                      <Save size={20} />
                    </div>
                    <CardTitle>Portabilidade de Dados</CardTitle>
                    <CardDescription>Baixe todos os seus dados em um arquivo JSON legível por máquinas.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full" onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL}/users/me/export`, '_blank')}>
                      Exportar Meus Dados
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-destructive/5 border-destructive/20">
                  <CardHeader>
                    <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive mb-4">
                      <Trash2 size={20} />
                    </div>
                    <CardTitle className="text-destructive">Excluir Conta</CardTitle>
                    <CardDescription>Remova permanentemente seu acesso e todos os seus dados pessoais.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="destructive" className="w-full" onClick={async () => {
                      if (confirm("Tem certeza? Esta ação é irreversível e você perderá o acesso imediatamente.")) {
                        try {
                          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/delete`, { method: "POST", credentials: "include" });
                          if (res.ok) {
                            toast.success("Conta marcada para exclusão.");
                            window.location.href = "/login";
                          }
                        } catch (e) { toast.error("Erro ao solicitar exclusão"); }
                      }
                    }}>
                      Solicitar Exclusão
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="p-6 bg-muted/30 rounded-2xl border border-border/50">
                <div className="flex items-center gap-2 mb-4">
                  <Info size={16} className="text-primary" />
                  <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Transparência LGPD</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <Link href="/termos" className="flex items-center justify-between p-3 rounded-xl bg-background border border-border hover:border-primary transition-colors text-left group">
                    <span>Termos de Uso</span>
                    <Sparkles size={14} className="opacity-0 group-hover:opacity-100 text-primary" />
                  </Link>
                  <Link href="/privacidade" className="flex items-center justify-between p-3 rounded-xl bg-background border border-border hover:border-primary transition-colors text-left group">
                    <span>Política de Privacidade</span>
                    <Sparkles size={14} className="opacity-0 group-hover:opacity-100 text-primary" />
                  </Link>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
