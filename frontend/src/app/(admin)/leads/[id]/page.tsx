"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWorkspace } from "@/app/api/userProvider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  User, Mail, Phone, Tag, Calendar, MapPin, 
  FileText, Upload, Trash2, Download, ExternalLink,
  ChevronLeft, MessageSquare, History, Activity
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

interface LeadTask {
  id: number;
  title: string;
  description?: string;
  priority: string;
  dueDate: string;
  status: string;
  reminderAt?: string;
  reminderType?: string;
}

interface LeadDocument {
  id: number;
  name: string;
  size: number;
  createdAt: string;
  fileUrl: string;
}

interface LeadDetail {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  city: string | null;
  state: string | null;
  observations: string | null;
  createdAt: string;
  value: number;
  funnel?: { name: string };
  stage?: { name: string };
  documents: LeadDocument[];
  tasks: LeadTask[];
}

export default function LeadDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { currentWorkspace } = useWorkspace();
  
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  // Task state
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [taskFormData, setTaskFormData] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    dueDate: "",
    reminderAt: "",
    reminderType: "SYSTEM",
  });

  const fetchLead = useCallback(async () => {
    if (!currentWorkspace?.id || !id) return;
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads/${id}`, {
        headers: {
          "x-workspace-id": currentWorkspace.id.toString(),
        },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erro ao carregar lead");
      const data = await res.json();
      setLead(data);
    } catch (error) {
      toast.error("Lead não encontrado");
      router.push("/leads");
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace, id, router]);

  useEffect(() => {
    fetchLead();
  }, [fetchLead]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      // 1. Upload file to storage
      const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload`, {
        method: "POST",
        headers: {
          "x-workspace-id": currentWorkspace.id.toString(),
        },
        body: formData,
        credentials: "include",
      });

      if (!uploadRes.ok) throw new Error("Erro no upload");
      const uploadData = await uploadRes.json();

      // 2. Save document reference in DB
      const saveRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads/${id}/documents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-workspace-id": currentWorkspace.id.toString(),
        },
        body: JSON.stringify({
          name: file.name,
          url: uploadData.url,
          mimetype: file.type,
          size: file.size
        }),
        credentials: "include",
      });

      if (!saveRes.ok) throw new Error("Erro ao salvar referência");

      toast.success("Documento enviado!");
      fetchLead();
    } catch (error) {
      toast.error("Falha ao enviar documento");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (docId: number) => {
    if (!confirm("Excluir este documento?")) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads/documents/${docId}`, {
        method: "DELETE",
        headers: {
          "x-workspace-id": currentWorkspace.id.toString(),
        },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erro ao remover");
      toast.success("Documento removido");
      fetchLead();
    } catch (error) {
      toast.error("Falha ao remover documento");
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-workspace-id": currentWorkspace.id.toString(),
        },
        body: JSON.stringify({
          ...taskFormData,
          leadId: Number(id)
        }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Erro ao criar tarefa");

      toast.success("Tarefa agendada!");
      setIsTaskDialogOpen(false);
      setTaskFormData({
        title: "",
        description: "",
        priority: "MEDIUM",
        dueDate: "",
        reminderAt: "",
        reminderType: "SYSTEM",
      });
      fetchLead();
    } catch (error) {
      toast.error("Erro ao agendar tarefa");
    }
  };

  if (loading) return <div className="p-8 text-center font-bold text-blue-600 animate-pulse">Carregando detalhes do lead...</div>;
  if (!lead) return null;

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" className="rounded-xl hover:bg-blue-50 text-blue-600 font-bold" onClick={() => router.back()}>
          <ChevronLeft className="mr-2 h-5 w-5" /> Voltar
        </Button>
        <div className="flex gap-2">
          <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl font-bold shadow-lg">
            <MessageSquare className="mr-2 h-4 w-4" /> WhatsApp
          </Button>
          <Button variant="outline" className="rounded-xl font-bold border-slate-200">
             Editar Lead
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden bg-white">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-10 text-white relative">
               <div className="flex items-center gap-6">
                 <div className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center text-4xl font-black shadow-inner">
                   {lead.name.charAt(0)}
                 </div>
                 <div>
                   <h1 className="text-4xl font-black tracking-tight">{lead.name}</h1>
                   <div className="flex items-center gap-2 mt-2 opacity-90">
                     <Badge className="bg-white/20 hover:bg-white/30 text-white border-none rounded-lg py-1 px-3 font-bold uppercase tracking-wider text-[10px]">
                        {lead.status}
                     </Badge>
                     <span className="text-sm font-medium">| Criado em {format(new Date(lead.createdAt), "dd/MM/yyyy", { locale: ptBR })}</span>
                   </div>
                 </div>
               </div>
            </div>
            <CardContent className="p-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Contato</h3>
                  <div className="space-y-4">
                    <div className="flex items-center p-4 bg-slate-50 rounded-2xl group transition-all hover:bg-blue-50 border border-transparent hover:border-blue-100">
                      <Mail className="h-5 w-5 text-blue-500 mr-4" />
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">E-mail</p>
                        <p className="font-bold text-slate-700">{lead.email || "Não informado"}</p>
                      </div>
                    </div>
                    <div className="flex items-center p-4 bg-slate-50 rounded-2xl group transition-all hover:bg-blue-50 border border-transparent hover:border-blue-100">
                      <Phone className="h-5 w-5 text-blue-500 mr-4" />
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Telefone</p>
                        <p className="font-bold text-slate-700">{lead.phone || "Não informado"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Localização</h3>
                  <div className="flex items-start p-4 bg-slate-50 rounded-2xl group transition-all hover:bg-blue-50 border border-transparent hover:border-blue-100">
                    <MapPin className="h-5 w-5 text-blue-500 mr-4 mt-1" />
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Endereço</p>
                      <p className="font-bold text-slate-700">
                        {lead.city ? `${lead.city}, ${lead.state}` : "Localização não cadastrada"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {lead.observations && (
                <div className="mt-10 space-y-4">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Observações</h3>
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 text-slate-600 font-medium leading-relaxed italic">
                    "{lead.observations}"
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documents Section */}
          <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden">
            <CardHeader className="p-10 pb-5 flex flex-row items-center justify-between bg-slate-50/50 border-b border-slate-100">
              <div>
                <CardTitle className="text-2xl font-black text-slate-800 flex items-center">
                  <FileText className="mr-3 h-6 w-6 text-blue-500" /> Documentos do Lead
                </CardTitle>
                <CardDescription className="font-bold text-slate-400">Upload de arquivos e anexos importantes</CardDescription>
              </div>
              <div className="relative">
                <input 
                  type="file" 
                  id="doc-upload" 
                  className="hidden" 
                  onChange={handleFileUpload} 
                  disabled={uploading}
                />
                <Button asChild disabled={uploading} className="bg-blue-600 hover:bg-blue-700 rounded-2xl font-bold py-6 px-8 shadow-lg shadow-blue-200">
                  <label htmlFor="doc-upload" className="cursor-pointer flex items-center">
                    <Upload className="mr-2 h-5 w-5" /> {uploading ? "Enviando..." : "Enviar Arquivo"}
                  </label>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-10">
              {lead.documents.length === 0 ? (
                <div className="text-center py-16 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                  <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 font-bold">Nenhum documento anexado a este lead ainda.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {lead.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 group transition-all hover:bg-white hover:shadow-xl hover:border-blue-100">
                      <div className="flex items-center overflow-hidden">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mr-4 shrink-0">
                          <FileText className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="truncate pr-4">
                          <p className="font-bold text-slate-700 truncate">{doc.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            {(doc.size / 1024).toFixed(1)} KB • {format(new Date(doc.createdAt), "dd/MM/yy")}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50" onClick={() => window.open(doc.fileUrl)}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDeleteDocument(doc.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-8">
          <Card className="rounded-[2.5rem] border-none shadow-xl bg-white">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-lg font-black text-slate-800 uppercase tracking-widest">Processo</CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
              <div className="p-5 bg-blue-50 rounded-3xl border border-blue-100">
                <p className="text-[10px] text-blue-600 font-black uppercase tracking-[0.2em] mb-2">Funil Atual</p>
                <p className="font-bold text-slate-800 text-lg">{lead.funnel?.name || "Nenhum"}</p>
              </div>
              <div className="p-5 bg-indigo-50 rounded-3xl border border-indigo-100">
                <p className="text-[10px] text-indigo-600 font-black uppercase tracking-[0.2em] mb-2">Etapa</p>
                <p className="font-bold text-slate-800 text-lg">{lead.stage?.name || "Nenhuma"}</p>
              </div>
              <div className="p-5 bg-amber-50 rounded-3xl border border-amber-100">
                <p className="text-[10px] text-amber-600 font-black uppercase tracking-[0.2em] mb-2">Valor Estimado</p>
                <p className="font-black text-slate-800 text-2xl">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(lead.value))}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2.5rem] border-none shadow-xl bg-slate-900 text-white">
             <CardHeader className="p-8 pb-4">
               <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center">
                 <Activity className="mr-2 h-5 w-5 text-blue-400" /> Próximos Passos
               </CardTitle>
             </CardHeader>
             <CardContent className="p-8 pt-0 space-y-4">
                {lead.tasks && lead.tasks.length > 0 ? (
                  lead.tasks.filter(t => t.status === 'PENDING').map(task => (
                    <div key={task.id} className="p-4 bg-white/10 rounded-2xl border border-white/5 flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-400" />
                      <div className="flex-1 overflow-hidden">
                        <p className="font-bold truncate">{task.title}</p>
                        <p className="text-[10px] text-white/50">{format(new Date(task.dueDate), "dd/MM/yy HH:mm")}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-white/40 font-bold text-sm text-center py-4 italic">Nenhuma tarefa pendente.</p>
                )}
                <Button className="w-full bg-white text-slate-900 hover:bg-blue-50 rounded-2xl font-black py-6 transition-all hover:scale-[1.02]" onClick={() => setIsTaskDialogOpen(true)}>
                  Agendar Tarefa
                </Button>
             </CardContent>
          </Card>
        </div>
      </div>

      {/* Task Creation Dialog */}
      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-800">Agendar Tarefa para {lead.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateTask} className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Título</label>
              <Input 
                required 
                value={taskFormData.title} 
                onChange={(e) => setTaskFormData({...taskFormData, title: e.target.value})} 
                placeholder="Ex: Ligar para confirmar interesse"
                className="rounded-xl border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Descrição</label>
              <Textarea 
                value={taskFormData.description} 
                onChange={(e) => setTaskFormData({...taskFormData, description: e.target.value})} 
                placeholder="Detalhes da tarefa..."
                className="rounded-xl border-slate-200"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Prioridade</label>
                <Select value={taskFormData.priority} onValueChange={(val) => setTaskFormData({...taskFormData, priority: val})}>
                  <SelectTrigger className="rounded-xl border-slate-200">
                    <SelectValue placeholder="Prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Baixa</SelectItem>
                    <SelectItem value="MEDIUM">Média</SelectItem>
                    <SelectItem value="HIGH">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Vencimento</label>
                <Input 
                  type="datetime-local" 
                  required
                  value={taskFormData.dueDate} 
                  onChange={(e) => setTaskFormData({...taskFormData, dueDate: e.target.value})}
                  className="rounded-xl border-slate-200"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Lembrete em</label>
                <Input 
                  type="datetime-local" 
                  value={taskFormData.reminderAt} 
                  onChange={(e) => setTaskFormData({...taskFormData, reminderAt: e.target.value})}
                  className="rounded-xl border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Tipo de Lembrete</label>
                <Select value={taskFormData.reminderType} onValueChange={(val) => setTaskFormData({...taskFormData, reminderType: val})}>
                  <SelectTrigger className="rounded-xl border-slate-200">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SYSTEM">Sistema</SelectItem>
                    <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                    <SelectItem value="BOTH">Ambos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 rounded-2xl">
                Agendar Agora
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
