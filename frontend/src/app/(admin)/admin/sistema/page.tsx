"use client";

import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Cpu, 
  Settings2, 
  Volume2, 
  Users, 
  UserPlus, 
  Pencil, 
  Trash2, 
  Save, 
  MessageSquare, 
  Check, 
  AlertTriangle,
  Database,
  Download,
  RefreshCw,
  Clock,
  Calendar
} from "lucide-react";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  maxMetaConnections: number;
  maxWhatsappConnections: number;
  maxTotalInstances: number;
  subscriptionStatus: string;
  subscriptionPlan: string | null;
  subscriptionExpiresAt: string | null;
  billingStatus: string;
  createdAt: string;
}

export default function SystemManagementPage() {
  // Global System Configuration State
  const [systemName, setSystemName] = useState("Rastreia.ai");
  const [modules, setModules] = useState({
    whatsapp: true,
    meta: true,
    googleAds: true
  });
  
  // Data Backup Configuration State
  const [backupConfig, setBackupConfig] = useState({
    enabled: false,
    frequency: "WEEKLY",
    time: "02:00",
    retentionDays: 30
  });

  // Backup History State
  const [backups, setBackups] = useState<{ filename: string; size: number; createdAt: string }[]>([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [generatingBackup, setGeneratingBackup] = useState(false);

  // Broadcast Warning States
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeMessage, setNoticeMessage] = useState("");
  const [noticeType, setNoticeType] = useState("INFO");

  // Users State
  const [users, setUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // User Dialog States
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "CLIENTE",
    maxMetaConnections: 1,
    maxWhatsappConnections: 1,
    maxTotalInstances: 5,
    subscriptionStatus: "TRIAL",
    subscriptionPlan: "MONTHLY",
    subscriptionExpiresAt: "",
    billingStatus: "ativo",
  });

  // Fetch configs, users and backups
  const fetchConfig = async () => {
    try {
      setLoadingConfig(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/system-config`, {
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        setSystemName(data.systemName);
        setModules(data.modules);
        if (data.backup) {
          setBackupConfig(data.backup);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar configurações do sistema:", error);
    } finally {
      setLoadingConfig(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users`, {
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Erro ao listar usuários:", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchBackups = async () => {
    try {
      setLoadingBackups(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/backups`, {
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        setBackups(data);
      }
    } catch (error) {
      console.error("Erro ao listar backups do sistema:", error);
    } finally {
      setLoadingBackups(false);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchUsers();
    fetchBackups();
  }, []);

  // Save System Name, Module Configuration, and Backup Settings
  const handleSaveConfig = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/system-config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemName, modules, backup: backupConfig }),
        credentials: "include"
      });
      if (res.ok) {
        toast.success("Configurações salvas com sucesso!");
        // Refresh local cache and trigger workspace reload to pick up new name
        window.location.reload();
      } else {
        const err = await res.json();
        toast.error(err.error || "Erro ao salvar configurações");
      }
    } catch (error) {
      toast.error("Erro ao conectar ao servidor");
    }
  };

  // Save ONLY Backup Settings
  const handleSaveBackupConfig = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/system-config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemName, modules, backup: backupConfig }),
        credentials: "include"
      });
      if (res.ok) {
        toast.success("Configuração de backup atualizada!");
      } else {
        const err = await res.json();
        toast.error(err.error || "Erro ao salvar configuração de backup");
      }
    } catch (error) {
      toast.error("Erro de conexão");
    }
  };

  // Trigger manual system backup
  const handleGenerateBackup = async () => {
    try {
      setGeneratingBackup(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/backups`, {
        method: "POST",
        credentials: "include"
      });
      if (res.ok) {
        toast.success("Backup manual gerado com sucesso!");
        fetchBackups();
      } else {
        const err = await res.json();
        toast.error(err.error || "Erro ao gerar backup de dados");
      }
    } catch (error) {
      toast.error("Erro de conexão com o servidor");
    } finally {
      setGeneratingBackup(false);
    }
  };

  // Delete an existing backup file
  const handleDeleteBackup = async (filename: string) => {
    if (!confirm(`Deseja permanentemente excluir o arquivo ${filename}?`)) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/backups/${filename}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (res.ok) {
        toast.success("Backup removido com sucesso!");
        fetchBackups();
      } else {
        const err = await res.json();
        toast.error(err.error || "Erro ao excluir arquivo");
      }
    } catch (error) {
      toast.error("Erro ao conectar ao servidor");
    }
  };

  // Trigger download of the backup file
  const handleDownloadBackup = (filename: string) => {
    window.open(`${process.env.NEXT_PUBLIC_API_URL}/admin/backups/download/${filename}`, "_blank");
  };

  // Toggle dynamic modules
  const handleModuleToggle = (key: keyof typeof modules) => {
    setModules(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Broadcast Notification to all users
  const handleSendBroadcast = async () => {
    if (!noticeTitle || !noticeMessage) {
      toast.error("Preencha o título e a mensagem do aviso!");
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/broadcast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: noticeTitle, message: noticeMessage, type: noticeType }),
        credentials: "include"
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`Aviso global enviado para ${data.count} usuários!`);
        setNoticeTitle("");
        setNoticeMessage("");
      } else {
        const err = await res.json();
        toast.error(err.error || "Erro ao enviar aviso global");
      }
    } catch (error) {
      toast.error("Erro de conexão");
    }
  };

  // User Actions (Create, Update, Delete)
  const openUserDialog = (user: User | null = null) => {
    setSelectedUser(user);
    if (user) {
      setUserForm({
        name: user.name,
        email: user.email,
        password: "",
        role: user.role,
        maxMetaConnections: user.maxMetaConnections,
        maxWhatsappConnections: user.maxWhatsappConnections,
        maxTotalInstances: user.maxTotalInstances,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionPlan: user.subscriptionPlan || "MONTHLY",
        subscriptionExpiresAt: user.subscriptionExpiresAt ? user.subscriptionExpiresAt.slice(0, 10) : "",
        billingStatus: user.billingStatus,
      });
    } else {
      setUserForm({
        name: "",
        email: "",
        password: "",
        role: "CLIENTE",
        maxMetaConnections: 1,
        maxWhatsappConnections: 1,
        maxTotalInstances: 5,
        subscriptionStatus: "TRIAL",
        subscriptionPlan: "MONTHLY",
        subscriptionExpiresAt: "",
        billingStatus: "ativo",
      });
    }
    setIsUserDialogOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = selectedUser
        ? `${process.env.NEXT_PUBLIC_API_URL}/admin/users/${selectedUser.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/admin/users`;

      const method = selectedUser ? "PUT" : "POST";

      const bodyPayload = { ...userForm };
      if (!selectedUser && !bodyPayload.password) {
        toast.error("A senha é obrigatória para novos usuários!");
        return;
      }
      if (selectedUser && !bodyPayload.password) {
        delete (bodyPayload as any).password; // Don't update password if left empty
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
        credentials: "include"
      });

      if (res.ok) {
        toast.success(selectedUser ? "Usuário atualizado com sucesso!" : "Usuário criado com sucesso!");
        setIsUserDialogOpen(false);
        fetchUsers();
      } else {
        const err = await res.json();
        toast.error(err.error || "Erro ao salvar usuário");
      }
    } catch (error) {
      toast.error("Erro na conexão");
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm("Tem certeza que deseja deletar permanentemente este usuário e todas as suas informações?")) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userId}`, {
        method: "DELETE",
        credentials: "include"
      });

      if (res.ok) {
        toast.success("Usuário removido com sucesso!");
        fetchUsers();
      } else {
        const err = await res.json();
        toast.error(err.error || "Erro ao remover usuário");
      }
    } catch (error) {
      toast.error("Erro de conexão");
    }
  };

  // Filtered Users List
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto bg-background min-h-screen">
      {/* Header Banner */}
      <div className="flex justify-between items-center bg-gradient-to-r from-blue-600 to-indigo-600 p-8 rounded-3xl shadow-xl text-white">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Gestão do Sistema</h1>
          <p className="text-blue-50 opacity-90 mt-2 font-medium">Configurações globais de módulos, nome e usuários.</p>
        </div>
        <div className="p-3 bg-white/10 rounded-2xl">
          <Cpu className="w-10 h-10" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Module Settings and Name */}
        <Card className="lg:col-span-1 rounded-3xl border-none shadow-md overflow-hidden bg-white">
          <CardHeader className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2 text-blue-600">
              <Settings2 className="w-5 h-5" />
              <CardTitle className="text-lg">Configurações Gerais</CardTitle>
            </div>
            <CardDescription>Nome da marca e módulos ativos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-5">
            {/* System Name Input */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">Nome do Sistema</Label>
              <Input 
                value={systemName}
                onChange={(e) => setSystemName(e.target.value)}
                placeholder="Ex: Rastreia AI"
                className="rounded-xl border-slate-200"
              />
            </div>

            {/* Modules Toggle List */}
            <div className="space-y-4">
              <Label className="text-sm font-semibold text-slate-700">Módulos do Sistema</Label>
              
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-800">Atendimento WhatsApp</span>
                  <span className="text-[10px] text-slate-500 font-medium">Permite integrar instâncias e ler chats</span>
                </div>
                <Switch 
                  checked={modules.whatsapp} 
                  onCheckedChange={() => handleModuleToggle("whatsapp")} 
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-800">Integração Meta Ads</span>
                  <span className="text-[10px] text-slate-500 font-medium">Sincroniza Formulários do Facebook Ads</span>
                </div>
                <Switch 
                  checked={modules.meta} 
                  onCheckedChange={() => handleModuleToggle("meta")} 
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-800">Google Ads Tracker</span>
                  <span className="text-[10px] text-slate-500 font-medium">Permite rastrear UTMs e conversões</span>
                </div>
                <Switch 
                  checked={modules.googleAds} 
                  onCheckedChange={() => handleModuleToggle("googleAds")} 
                />
              </div>
            </div>

            <Button 
              onClick={handleSaveConfig} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-blue-500/10 transition-all"
            >
              <Save className="w-4 h-4" />
              Salvar Alterações
            </Button>
          </CardContent>
        </Card>

        {/* Global Broadcast Notice */}
        <Card className="lg:col-span-2 rounded-3xl border-none shadow-md overflow-hidden bg-white">
          <CardHeader className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2 text-indigo-600">
              <Volume2 className="w-5 h-5" />
              <CardTitle className="text-lg">Aviso Geral (Broadcast)</CardTitle>
            </div>
            <CardDescription>Envia uma notificação e alerta visual instantâneo para TODOS os usuários do painel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label className="text-sm font-semibold text-slate-700">Título do Alerta</Label>
                <Input 
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  placeholder="Ex: Manutenção agendada neste domingo"
                  className="rounded-xl border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">Tipo de Alerta</Label>
                <Select value={noticeType} onValueChange={setNoticeType}>
                  <SelectTrigger className="rounded-xl border-slate-200">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INFO">Informação (Azul)</SelectItem>
                    <SelectItem value="WARNING">Aviso/Alerta (Laranja)</SelectItem>
                    <SelectItem value="ERROR">Crítico (Vermelho)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">Mensagem detalhada</Label>
              <Textarea 
                value={noticeMessage}
                onChange={(e) => setNoticeMessage(e.target.value)}
                placeholder="Escreva a mensagem aqui que aparecerá nas caixas de notificação dos usuários..."
                className="rounded-xl border-slate-200 min-h-[100px]"
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button 
                onClick={handleSendBroadcast} 
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-indigo-500/10 transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                Enviar Aviso Geral
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Backups Configuration & History Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Backup Settings */}
        <Card className="lg:col-span-1 rounded-3xl border-none shadow-md overflow-hidden bg-white">
          <CardHeader className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2 text-blue-600">
              <Database className="w-5 h-5" />
              <CardTitle className="text-lg">Configuração de Backup</CardTitle>
            </div>
            <CardDescription>Configure backups automáticos do sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-5">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-800">Backups Automáticos</span>
                <span className="text-[10px] text-slate-500 font-medium">Ativar rotina automatizada de segurança</span>
              </div>
              <Switch 
                checked={backupConfig.enabled} 
                onCheckedChange={(val) => setBackupConfig({ ...backupConfig, enabled: val })} 
              />
            </div>

            {backupConfig.enabled && (
              <div className="space-y-4 animate-in slide-in-from-top-3 duration-300">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-700">Frequência</Label>
                  <Select 
                    value={backupConfig.frequency} 
                    onValueChange={(val) => setBackupConfig({ ...backupConfig, frequency: val })}
                  >
                    <SelectTrigger className="rounded-xl border-slate-200">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DAILY">Diário (Todos os dias)</SelectItem>
                      <SelectItem value="WEEKLY">Semanal (Uma vez por semana)</SelectItem>
                      <SelectItem value="MONTHLY">Mensal (Uma vez por mês)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-700">Horário Execução</Label>
                    <div className="relative">
                      <Input 
                        type="text" 
                        value={backupConfig.time} 
                        onChange={(e) => setBackupConfig({ ...backupConfig, time: e.target.value })} 
                        placeholder="Ex: 02:00"
                        className="rounded-xl border-slate-200 pl-8 text-xs font-medium"
                      />
                      <Clock className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-700">Retenção (Dias)</Label>
                    <Input 
                      type="number" 
                      value={backupConfig.retentionDays} 
                      onChange={(e) => setBackupConfig({ ...backupConfig, retentionDays: parseInt(e.target.value) || 30 })} 
                      placeholder="Ex: 30"
                      className="rounded-xl border-slate-200 text-xs font-medium"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3 pt-2">
              <Button 
                onClick={handleSaveBackupConfig} 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all text-xs"
              >
                <Save className="w-3.5 h-3.5" />
                Salvar Configurações de Backup
              </Button>

              <Button 
                onClick={handleGenerateBackup} 
                disabled={generatingBackup}
                variant="outline"
                className="w-full border-dashed border-blue-200 hover:border-blue-300 hover:bg-blue-50/50 text-blue-600 font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all text-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${generatingBackup ? 'animate-spin' : ''}`} />
                {generatingBackup ? 'Gerando Backup...' : 'Gerar Backup Manual Agora'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Backups History Table */}
        <Card className="lg:col-span-2 rounded-3xl border-none shadow-md overflow-hidden bg-white">
          <CardHeader className="border-b border-slate-100 pb-4 flex flex-row items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-indigo-600">
                <Calendar className="w-5 h-5" />
                <CardTitle className="text-lg">Histórico de Backups</CardTitle>
              </div>
              <CardDescription>Gerencie arquivos de segurança e faça downloads</CardDescription>
            </div>
            <Button 
              onClick={fetchBackups} 
              disabled={loadingBackups} 
              variant="ghost" 
              size="sm" 
              className="text-xs font-semibold text-slate-500 rounded-lg"
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${loadingBackups ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {loadingBackups ? (
              <div className="text-center py-12 text-slate-400 font-medium text-xs">Carregando histórico...</div>
            ) : backups.length === 0 ? (
              <div className="text-center py-16 text-slate-400 font-medium text-xs">Nenhum backup gerado ainda.</div>
            ) : (
              <div className="max-h-[350px] overflow-y-auto">
                <Table>
                  <TableHeader className="bg-slate-50/50 sticky top-0">
                    <TableRow>
                      <TableHead className="font-bold text-xs text-slate-500">Nome do Arquivo</TableHead>
                      <TableHead className="font-bold text-xs text-slate-500">Tamanho</TableHead>
                      <TableHead className="font-bold text-xs text-slate-500">Data de Criação</TableHead>
                      <TableHead className="font-bold text-xs text-slate-500 text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {backups.map((b) => (
                      <TableRow key={b.filename} className="hover:bg-slate-50/50">
                        <TableCell className="py-3 font-semibold text-xs text-slate-700 truncate max-w-[220px]">
                          {b.filename}
                        </TableCell>
                        <TableCell className="py-3 text-xs text-slate-500 font-medium">
                          {(b.size / 1024).toFixed(2)} KB
                        </TableCell>
                        <TableCell className="py-3 text-xs text-slate-500 font-medium">
                          {new Date(b.createdAt).toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell className="py-3 text-right">
                          <div className="flex justify-end gap-1.5">
                            <Button 
                              onClick={() => handleDownloadBackup(b.filename)} 
                              size="icon" 
                              variant="ghost" 
                              className="h-7 w-7 rounded-lg text-blue-600 hover:bg-blue-50"
                              title="Baixar Backup"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </Button>
                            <Button 
                              onClick={() => handleDeleteBackup(b.filename)} 
                              size="icon" 
                              variant="ghost" 
                              className="h-7 w-7 rounded-lg text-rose-600 hover:bg-rose-50"
                              title="Excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Users Manager Section */}
      <Card className="rounded-3xl border-none shadow-md overflow-hidden bg-white">
        <CardHeader className="border-b border-slate-100 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-600">
              <Users className="w-5 h-5" />
              <CardTitle className="text-xl font-bold text-slate-800">Gerenciamento de Usuários</CardTitle>
            </div>
            <CardDescription>Crie, edite, controle limites e gerencie o acesso de todos no sistema</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Input 
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Buscar por nome ou email..."
              className="rounded-xl border-slate-200 max-w-xs"
            />
            <Button 
              onClick={() => openUserDialog()} 
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl px-4 py-3 flex items-center gap-2 shadow-md transition-all hover:scale-105"
            >
              <UserPlus className="w-4 h-4" />
              Novo Usuário
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loadingUsers ? (
            <div className="text-center py-10 font-semibold text-slate-400">Carregando usuários...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-20 text-slate-400">Nenhum usuário correspondente encontrado.</div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="font-bold text-xs text-slate-500">ID / Nome</TableHead>
                  <TableHead className="font-bold text-xs text-slate-500">Email</TableHead>
                  <TableHead className="font-bold text-xs text-slate-500">Função (Role)</TableHead>
                  <TableHead className="font-bold text-xs text-slate-500">Limites (Meta/Whats/Total)</TableHead>
                  <TableHead className="font-bold text-xs text-slate-500">Status Assinatura</TableHead>
                  <TableHead className="font-bold text-xs text-slate-500 text-right">Gerenciar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((u) => (
                  <TableRow key={u.id} className="hover:bg-slate-50/50">
                    <TableCell className="py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-slate-800">{u.name}</span>
                        <span className="text-[10px] text-slate-400">ID: {u.id}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 font-medium text-slate-600">{u.email}</TableCell>
                    <TableCell className="py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        u.role === "ADMIN" ? "bg-red-100 text-red-700" :
                        u.role === "GESTOR" ? "bg-blue-100 text-blue-700" :
                        "bg-slate-100 text-slate-700"
                      }`}>
                        {u.role}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 font-semibold text-slate-600">
                      Meta: {u.maxMetaConnections} | Whats: {u.maxWhatsappConnections} | Total Inst.: {u.maxTotalInstances}
                    </TableCell>
                    <TableCell className="py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        u.subscriptionStatus === "ACTIVE" ? "bg-emerald-100 text-emerald-700" :
                        u.subscriptionStatus === "TRIAL" ? "bg-blue-100 text-blue-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {u.subscriptionStatus === "ACTIVE" ? "Ativa" :
                         u.subscriptionStatus === "TRIAL" ? "Teste Grátis" : "Expirada"}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Button 
                          onClick={() => openUserDialog(u)} 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-xl text-blue-600 hover:bg-blue-50"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          onClick={() => handleDeleteUser(u.id)} 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-xl text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* User Create/Edit Dialog */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-extrabold text-slate-800">
              {selectedUser ? "Editar Usuário" : "Criar Novo Usuário"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveUser} className="space-y-4 py-4 max-h-[75vh] overflow-y-auto px-1">
            
            {/* Base info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700">Nome Completo</Label>
                <Input 
                  required
                  value={userForm.name}
                  onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                  placeholder="Nome do usuário"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700">Endereço de Email</Label>
                <Input 
                  required
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                  placeholder="exemplo@email.com"
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700">Senha {selectedUser && "(Deixe vazio para manter)"}</Label>
                <Input 
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                  placeholder="••••••••"
                  className="rounded-xl"
                  required={!selectedUser}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700">Função Global (Role)</Label>
                <Select value={userForm.role} onValueChange={(val) => setUserForm({...userForm, role: val})}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CLIENTE">Cliente (Acesso Comum)</SelectItem>
                    <SelectItem value="GESTOR">Gestor (Dono da Empresa)</SelectItem>
                    <SelectItem value="ADMIN">Administrador do Sistema</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="h-px bg-slate-100 my-2" />
            <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider">Limites de Conexões (Gestores)</h4>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700">Max Meta Conexões</Label>
                <Input 
                  type="number"
                  min={1}
                  value={userForm.maxMetaConnections}
                  onChange={(e) => setUserForm({...userForm, maxMetaConnections: parseInt(e.target.value) || 1})}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700">Max WhatsApp Conexões</Label>
                <Input 
                  type="number"
                  min={1}
                  value={userForm.maxWhatsappConnections}
                  onChange={(e) => setUserForm({...userForm, maxWhatsappConnections: parseInt(e.target.value) || 1})}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700">Total Instâncias Evolution</Label>
                <Input 
                  type="number"
                  min={1}
                  value={userForm.maxTotalInstances}
                  onChange={(e) => setUserForm({...userForm, maxTotalInstances: parseInt(e.target.value) || 5})}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="h-px bg-slate-100 my-2" />
            <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Controle de Assinatura & Faturamento</h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700">Status da Assinatura</Label>
                <Select value={userForm.subscriptionStatus} onValueChange={(val) => setUserForm({...userForm, subscriptionStatus: val})}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TRIAL">Fase de Teste (Trial)</SelectItem>
                    <SelectItem value="ACTIVE">Assinatura Ativa (Active)</SelectItem>
                    <SelectItem value="EXPIRED">Atrasada/Bloqueada (Expired)</SelectItem>
                    <SelectItem value="CANCELED">Cancelada (Canceled)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700">Vencimento da Licença</Label>
                <Input 
                  type="date"
                  value={userForm.subscriptionExpiresAt}
                  onChange={(e) => setUserForm({...userForm, subscriptionExpiresAt: e.target.value})}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700">Plano da Assinatura</Label>
                <Select value={userForm.subscriptionPlan} onValueChange={(val) => setUserForm({...userForm, subscriptionPlan: val})}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONTHLY">Plano Mensal</SelectItem>
                    <SelectItem value="QUARTERLY">Plano Trimestral</SelectItem>
                    <SelectItem value="ANNUAL">Plano Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700">Status do Faturamento (Billing)</Label>
                <Select value={userForm.billingStatus} onValueChange={(val) => setUserForm({...userForm, billingStatus: val})}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Adimplente / Ativo</SelectItem>
                    <SelectItem value="pendente">Inadimplente / Pendente</SelectItem>
                    <SelectItem value="inativo">Inativo / Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-6">
              <Button type="button" variant="outline" onClick={() => setIsUserDialogOpen(false)} className="rounded-xl">
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-6">
                Salvar Alterações
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
