"use client";

import { useState, useEffect } from "react";
import { useWorkspace } from "@/app/api/userProvider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle, Clock, MoreVertical, Plus, Trash2, Edit2, Bell, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function TasksPage() {
  const { currentWorkspace } = useWorkspace();
  const [tasks, setTasks] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "PENDING",
    priority: "MEDIUM",
    dueDate: "",
    reminderAt: "",
    reminderType: "SYSTEM",
    leadId: "none",
  });

  const fetchTasks = async () => {
    if (!currentWorkspace?.id) return;
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks`, {
        headers: {
          "x-workspace-id": currentWorkspace.id.toString(),
        },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erro ao carregar tarefas");
      const data = await res.json();
      setTasks(data);
    } catch (error) {
      toast.error("Não foi possível carregar as tarefas");
    } finally {
      setLoading(false);
    }
  };

  const fetchLeads = async () => {
    if (!currentWorkspace?.id) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads`, {
        headers: { "x-workspace-id": currentWorkspace.id.toString() },
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setLeads(data);
      }
    } catch (error) {
      console.error("Erro ao carregar leads", error);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchLeads();
  }, [currentWorkspace]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingTask 
        ? `${process.env.NEXT_PUBLIC_API_URL}/tasks/${editingTask.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/tasks`;
      
      const method = editingTask ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-workspace-id": currentWorkspace.id.toString(),
        },
        body: JSON.stringify({
          ...formData,
          leadId: formData.leadId === "none" ? null : formData.leadId
        }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Erro ao salvar tarefa");

      toast.success(editingTask ? "Tarefa atualizada!" : "Tarefa criada!");
      setOpen(false);
      setEditingTask(null);
      setFormData({
        title: "",
        description: "",
        status: "PENDING",
        priority: "MEDIUM",
        dueDate: "",
        reminderAt: "",
        reminderType: "SYSTEM",
        leadId: "none",
      });
      fetchTasks();
    } catch (error) {
      toast.error("Erro ao salvar tarefa");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Tem certeza que deseja excluir esta tarefa?")) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks/${id}`, {
        method: "DELETE",
        headers: {
          "x-workspace-id": currentWorkspace.id.toString(),
        },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erro ao excluir");
      toast.success("Tarefa removida");
      fetchTasks();
    } catch (error) {
      toast.error("Erro ao excluir tarefa");
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : "",
      reminderAt: task.reminderAt ? new Date(task.reminderAt).toISOString().slice(0, 16) : "",
      reminderType: task.reminderType,
      leadId: task.leadId ? task.leadId.toString() : "none",
    });
    setOpen(true);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "HIGH": return "bg-red-500 text-white";
      case "MEDIUM": return "bg-amber-500 text-white";
      case "LOW": return "bg-blue-500 text-white";
      default: return "bg-slate-500 text-white";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "COMPLETED": return "bg-blue-100 text-blue-700 border-blue-200";
      case "PENDING": return "bg-amber-100 text-amber-700 border-amber-200";
      case "CANCELED": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center bg-gradient-to-r from-blue-600 to-indigo-600 p-8 rounded-3xl shadow-xl text-white">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Tarefas</h1>
          <p className="text-blue-50 opacity-90 mt-2 font-medium">Gerencie suas atividades e lembretes</p>
        </div>
        <Dialog open={open} onOpenChange={(val) => { setOpen(val); if(!val) setEditingTask(null); }}>
          <DialogTrigger asChild>
            <Button className="bg-white text-blue-600 hover:bg-blue-50 font-bold px-6 rounded-2xl shadow-lg transition-all hover:scale-105">
              <Plus className="mr-2 h-5 w-5" /> Nova Tarefa
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">{editingTask ? "Editar Tarefa" : "Criar Nova Tarefa"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Título</label>
                <Input 
                  required 
                  value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})} 
                  placeholder="O que precisa ser feito?"
                  className="rounded-xl border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Descrição</label>
                <Textarea 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})} 
                  placeholder="Detalhes da tarefa..."
                  className="rounded-xl border-slate-200 min-h-[100px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Prioridade</label>
                  <Select value={formData.priority} onValueChange={(val) => setFormData({...formData, priority: val})}>
                    <SelectTrigger className="rounded-xl border-slate-200">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Baixa</SelectItem>
                      <SelectItem value="MEDIUM">Média</SelectItem>
                      <SelectItem value="HIGH">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Status</label>
                  <Select value={formData.status} onValueChange={(val) => setFormData({...formData, status: val})}>
                    <SelectTrigger className="rounded-xl border-slate-200">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Pendente</SelectItem>
                      <SelectItem value="COMPLETED">Concluída</SelectItem>
                      <SelectItem value="CANCELED">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Vencimento</label>
                  <Input 
                    type="datetime-local" 
                    value={formData.dueDate} 
                    onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                    className="rounded-xl border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Lembrete em</label>
                  <Input 
                    type="datetime-local" 
                    value={formData.reminderAt} 
                    onChange={(e) => setFormData({...formData, reminderAt: e.target.value})}
                    className="rounded-xl border-slate-200"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Tipo de Lembrete</label>
                <Select value={formData.reminderType} onValueChange={(val) => setFormData({...formData, reminderType: val})}>
                  <SelectTrigger className="rounded-xl border-slate-200">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SYSTEM">Sistema</SelectItem>
                    <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                    <SelectItem value="BOTH">Ambos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Vincular a um Lead (Opcional)</label>
                <Select value={formData.leadId || "none"} onValueChange={(val) => setFormData({...formData, leadId: val})}>
                  <SelectTrigger className="rounded-xl border-slate-200">
                    <SelectValue placeholder="Selecione um lead..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {leads.map(lead => (
                      <SelectItem key={lead.id} value={lead.id.toString()}>{lead.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 rounded-2xl">
                  {editingTask ? "Salvar Alterações" : "Criar Tarefa"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map(i => <div key={i} className="h-48 bg-slate-100 rounded-3xl" />)}
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
          <div className="inline-flex p-4 rounded-full bg-white shadow-sm mb-4">
            <CheckCircle className="h-10 w-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-600">Nenhuma tarefa por aqui</h3>
          <p className="text-slate-400 mt-1 font-medium">Suas atividades aparecerão aqui quando você criá-las.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task) => (
            <Card key={task.id} className="group overflow-hidden rounded-3xl border-none shadow-sm hover:shadow-xl transition-all duration-300 bg-white">
              <div className={`h-2 ${getPriorityColor(task.priority)}`} />
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <Badge variant="outline" className={`rounded-lg font-bold px-3 py-1 ${getStatusColor(task.status)}`}>
                    {task.status === "PENDING" ? "Pendente" : task.status === "COMPLETED" ? "Concluída" : "Cancelada"}
                  </Badge>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400 hover:text-blue-600 hover:bg-blue-50" onClick={() => handleEdit(task)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(task.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="text-xl font-bold text-slate-800 line-clamp-1 mt-3">{task.title}</CardTitle>
                <CardDescription className="line-clamp-2 min-h-[40px] text-slate-500 font-medium">
                  {task.description || "Sem descrição"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div className="flex flex-col gap-2">
                  {task.dueDate && (
                    <div className="flex items-center text-sm font-semibold text-slate-600 bg-slate-50 p-3 rounded-2xl">
                      <Calendar className="mr-3 h-4 w-4 text-blue-500" />
                      {format(new Date(task.dueDate), "dd 'de' MMMM, HH:mm", { locale: ptBR })}
                    </div>
                  )}
                  {task.reminderAt && (
                    <div className="flex items-center text-sm font-semibold text-slate-600 bg-blue-50 p-3 rounded-2xl">
                      <Bell className="mr-3 h-4 w-4 text-blue-500" />
                      Lembrete: {format(new Date(task.reminderAt), "dd/MM, HH:mm")}
                      <Badge variant="secondary" className="ml-auto text-[10px] bg-blue-100 text-blue-700">
                        {task.reminderType === "WHATSAPP" ? "WhatsApp" : task.reminderType === "BOTH" ? "Ambos" : "Sistema"}
                      </Badge>
                    </div>
                  )}
                  {task.lead && (
                    <div className="flex items-center text-sm font-bold text-blue-600 bg-blue-50/30 p-3 rounded-2xl border border-blue-100">
                      <MessageCircle className="mr-3 h-4 w-4" />
                      Lead: {task.lead.name}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
