"use client";
import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { 
  Plus, 
  Trash, 
  Pencil, 
  Download, 
  Layout, 
  Table2, 
  Loader2,
  Settings2, 
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface Lead {
  id: number;
  name: string;
  source: string | null;
  value: number;
  status: string;
  funnelId?: number;
  stageId?: number;
  updatedAt: string;
  email?: string;
  phone?: string;
}

interface Stage {
  id: number;
  name: string;
  color: string;
  order: number;
  leads?: Lead[];
}

interface Funnel {
  id: number;
  name: string;
  description?: string;
  stages: Stage[];
}

type ViewMode = "kanban" | "table";

export default function Funil() {
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [selectedFunnelId, setSelectedFunnelId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  
  // Funnel & Stage Management States
  const [isFunnelDialogOpen, setIsFunnelDialogOpen] = useState(false);
  const [funnelForm, setFunnelForm] = useState({ name: "", description: "" });
  const [isStageDialogOpen, setIsStageDialogOpen] = useState(false);
  const [stageForm, setStageForm] = useState({ name: "", color: "bg-primary", order: 0 });
  const [editingStage, setEditingStage] = useState<Stage | null>(null);
  const [isFunnelSettingsOpen, setIsFunnelSettingsOpen] = useState(false);
  
  // Add Lead States
  const [isAddLeadDialogOpen, setIsAddLeadDialogOpen] = useState(false);
  const [selectedStageForLead, setSelectedStageForLead] = useState<number | null>(null);
  const [leadForm, setLeadForm] = useState({ name: "", email: "", phone: "", value: "" });
  const [creatingLead, setCreatingLead] = useState(false);
  const [customFields, setCustomFields] = useState<any[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});

  const fetchFunnels = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/funnel`, { credentials: 'include' });
      const data = await res.json();
      
      if (Array.isArray(data)) {
        setFunnels(data);
        if (data.length > 0 && !selectedFunnelId) {
          setSelectedFunnelId(data[0].id.toString());
        }
      }
    } catch {
      toast.error("Erro ao carregar funis");
    } finally {
      setLoading(false);
    }
  }, [selectedFunnelId]);

  useEffect(() => {
    fetchFunnels();
    fetchCustomFields();
  }, [fetchFunnels]);

  const fetchCustomFields = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/custom-fields?entityType=LEAD`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setCustomFields(data);
      }
    } catch (err) {
      console.error("Erro ao carregar campos personalizados:", err);
    }
  };

  const selectedFunnel = funnels.find(f => f.id.toString() === selectedFunnelId);
  const stages = selectedFunnel?.stages || [];

  // 🔥 Export to CSV
  const handleExport = () => {
    if (!selectedFunnel) return;
    
    const allLeads = stages.flatMap(stage => 
      (stage.leads || []).map(lead => ({
        ...lead,
        stageName: stage.name,
        stageColor: stage.color
      }))
    );

    const headers = ["Nome", "Email", "Telefone", "Estágio", "Fonte", "Valor", "Data de Atualização"];
    const csvContent = [
      headers.join(","),
      ...allLeads.map(lead => [
        lead.name,
        lead.email || "",
        lead.phone || "",
        lead.stageName,
        lead.source || "Manual",
        lead.value,
        new Date(lead.updatedAt).toLocaleDateString('pt-BR')
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `funil-${selectedFunnel.name}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast.success("Funil exportado com sucesso!");
  };

  const handleDragStart = (lead: Lead) => {
    setDraggedLead(lead);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (toStageId: number) => {
    if (!draggedLead || !selectedFunnel) return;
    if (draggedLead.stageId === toStageId) return;

    const updatedFunnels = funnels.map(f => {
      if (f.id === selectedFunnel.id) {
        return {
          ...f,
          stages: f.stages.map(s => {
            if (s.id === draggedLead.stageId) {
              return { ...s, leads: s.leads?.filter(l => l.id !== draggedLead.id) };
            }
            if (s.id === toStageId) {
              return { ...s, leads: [...(s.leads || []), { ...draggedLead, stageId: toStageId }] };
            }
            return s;
          })
        };
      }
      return f;
    });

    setFunnels(updatedFunnels);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/funnel/leads/${draggedLead.id}/move`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            funnelId: selectedFunnel.id, 
            stageId: toStageId 
        }),
        credentials: 'include'
      });

      if (!res.ok) throw new Error();
      toast.success("Lead movido");
    } catch {
      toast.error("Erro ao atualizar status");
      fetchFunnels();
    } finally {
      setDraggedLead(null);
    }
  };

  const createFunnel = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/funnel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(funnelForm),
        credentials: 'include'
      });
      if (!res.ok) throw new Error();
      toast.success("Funil criado!");
      setIsFunnelDialogOpen(false);
      setFunnelForm({ name: "", description: "" });
      fetchFunnels();
    } catch {
      toast.error("Erro ao criar funil");
    }
  };

  const saveStage = async () => {
    if (!selectedFunnel) return;
    
    try {
        const url = editingStage 
            ? `${process.env.NEXT_PUBLIC_API_URL}/funnel/stages/${editingStage.id}`
            : `${process.env.NEXT_PUBLIC_API_URL}/funnel/${selectedFunnel.id}/stages`;
            
        const method = editingStage ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...stageForm, funnelId: selectedFunnel.id }),
            credentials: 'include'
        });

        if (!res.ok) throw new Error();
        toast.success(editingStage ? "Estágio atualizado!" : "Estágio criado!");
        setIsStageDialogOpen(false);
        setEditingStage(null);
        setStageForm({ name: "", color: "bg-primary", order: stages.length });
        fetchFunnels();
    } catch {
        toast.error("Erro ao salvar estágio");
    }
  };

  const deleteFunnel = async () => {
    if (!selectedFunnel) return;
    if (!confirm(`Tem certeza que deseja excluir o funil "${selectedFunnel.name}"?`)) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/funnel/${selectedFunnel.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!res.ok) throw new Error();
      toast.success("Funil excluído!");
      setIsFunnelSettingsOpen(false);
      setSelectedFunnelId("");
      fetchFunnels();
    } catch {
      toast.error("Erro ao excluir funil");
    }
  };

  const updateFunnel = async () => {
    if (!selectedFunnel) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/funnel/${selectedFunnel.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(funnelForm),
        credentials: 'include'
      });
      if (!res.ok) throw new Error();
      toast.success("Funil atualizado!");
      setIsFunnelSettingsOpen(false);
      fetchFunnels();
    } catch {
      toast.error("Erro ao atualizar funil");
    }
  };

  const moveStage = async (index: number, direction: 'up' | 'down') => {
    if (!selectedFunnel) return;
    const newStages = [...stages];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newStages.length) return;
    
    const [moved] = newStages.splice(index, 1);
    newStages.splice(targetIndex, 0, moved);
    
    // Update local state first
    const updatedFunnels = funnels.map(f => {
      if (f.id === selectedFunnel.id) {
        return { ...f, stages: newStages };
      }
      return f;
    });
    setFunnels(updatedFunnels);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/funnel/stages/reorder/${selectedFunnel.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stages: newStages.map((s, idx) => ({ id: s.id, order: idx })) }),
        credentials: 'include'
      });
      if (!res.ok) throw new Error();
    } catch {
      toast.error("Erro ao reordenar");
      fetchFunnels();
    }
  };

  const deleteStage = async (id: number) => {
    if(!confirm("Tem certeza? Os leads serão desvinculados desta etapa.")) return;
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/funnel/stages/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        if (!res.ok) throw new Error();
        toast.success("Estágio excluído");
        fetchFunnels();
    } catch {
        toast.error("Erro ao excluir estágio");
    }
  }

  const openStageDialog = (stage?: Stage) => {
    if (stage) {
        setEditingStage(stage);
        setStageForm({ name: stage.name, color: stage.color, order: stage.order });
    } else {
        setEditingStage(null);
        setStageForm({ name: "", color: "bg-primary", order: stages.length });
    }
    setIsStageDialogOpen(true);
  }

  const deleteFollowUp = async (leadId: number) => {
    if (!confirm("Tem certeza que deseja limpar os dados de follow-up deste lead?")) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads/${leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          nextFollowUpDate: null,
          reminderDate: null,
          followUpAction: null,
          followUpConfig: null,
          followUpTriggered: false,
          reminderTriggered: false
        }),
        credentials: "include",
      });

      if (res.ok) {
        toast.success("Follow-up removido!");
        fetchFunnels();
      } else {
        toast.error("Erro ao remover follow-up");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro na conexão");
    }
  };

  const handleAddLead = async () => {
    if (!selectedFunnel || !selectedStageForLead) return;
    if (!leadForm.name) return toast.error("Nome é obrigatório");

    try {
      setCreatingLead(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...leadForm,
          funnelId: selectedFunnel.id,
          stageId: selectedStageForLead,
          status: "new",
          source: "manual",
          customFields: customFieldValues
        }),
        credentials: "include",
      });

      if (res.ok) {
        toast.success("Lead adicionado com sucesso!");
        setIsAddLeadDialogOpen(false);
        setLeadForm({ name: "", email: "", phone: "", value: "" });
        setCustomFieldValues({});
        fetchFunnels();
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao adicionar lead");
      }
    } catch {
      toast.error("Erro na conexão");
    } finally {
      setCreatingLead(false);
    }
  };

  if (loading && funnels.length === 0) return <div className="p-8">Carregando...</div>;

  return (
    <div className="p-4 sm:p-8 space-y-6 h-full flex flex-col bg-background min-h-screen transition-colors duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card/40 backdrop-blur-md p-6 rounded-2xl border border-border/50 shadow-sm transition-all duration-300">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <Layout className="w-3 h-3" />
            Processos de Vendas
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-10 px-3 pl-0 hover:bg-transparent text-foreground flex items-center gap-3 group transition-all">
                  <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <Layout className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-2xl font-bold tracking-tight">{selectedFunnel?.name || "Selecionar Funil"}</span>
                  <ChevronDown className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[280px] p-2 backdrop-blur-xl bg-popover/80 border-border/50 transition-all animate-in fade-in zoom-in-95 duration-200">
                <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Processos Ativos</div>
                {funnels.map(f => (
                  <DropdownMenuItem key={f.id} onClick={() => setSelectedFunnelId(f.id.toString())} className="justify-between cursor-pointer">
                    {f.name}
                    {f.id.toString() === selectedFunnelId && <Badge variant="secondary" className="h-4 text-[8px] px-1">Ativo</Badge>}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsFunnelDialogOpen(true)} className="text-primary font-medium cursor-pointer">
                  <Plus className="w-3.5 h-3.5 mr-2" /> Novo Funil
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="h-8 w-px bg-border mx-1 hidden sm:block" />

            <div className="flex gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                disabled={!selectedFunnel}
                onClick={() => {
                  if (selectedFunnel) {
                    setFunnelForm({ name: selectedFunnel.name, description: selectedFunnel.description || "" });
                    setIsFunnelSettingsOpen(true);
                  }
                }}
                className="text-muted-foreground hover:text-foreground font-medium bg-secondary/50 border-none hover:bg-secondary"
              >
                <Settings2 className="w-4 h-4 mr-2" />
                Gerenciar
              </Button>
            </div>
          </div>
        </div>
        
        {selectedFunnel && (
          <div className="flex gap-3">
            <div className="flex bg-muted/50 p-1 rounded-xl backdrop-blur-sm border border-border/20">
              <Button
                variant={viewMode === "kanban" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("kanban")}
                className={`rounded-lg transition-all duration-200 ${viewMode === "kanban" ? "shadow-md bg-background text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Layout className="w-4 h-4 mr-2" />
                Kanban
              </Button>
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
                className={`rounded-lg transition-all duration-200 ${viewMode === "table" ? "shadow-md bg-background text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Table2 className="w-4 h-4 mr-2" />
                Tabela
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={handleExport} className="rounded-xl border-border hover:bg-accent transition-all">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        )}
      </div>

      {!selectedFunnel ? (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground border-2 border-border border-dashed rounded-xl p-12">
            <p>Nenhum funil selecionado ou criado.</p>
            <Button className="mt-4" onClick={() => setIsFunnelDialogOpen(true)}>Criar meu primeiro funil</Button>
        </div>
      ) : viewMode === "kanban" ? (
        <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
             <div className="flex gap-4 h-full min-w-max items-start">
                {stages.map((stage) => {
                    const leads = stage.leads || []; 
                    const totalValue = leads.reduce((acc, lead) => acc + (Number(lead.value) || 0), 0);

                    return (
                        <div
                            key={stage.id}
                            className="flex flex-col gap-3 w-[280px] h-full"
                            onDragOver={handleDragOver}
                            onDrop={() => handleDrop(stage.id)}
                        >
                            <div className={`p-4 rounded-2xl shadow-lg border-none flex flex-col gap-2 relative overflow-hidden transition-all hover:scale-[1.02] duration-300 group/stage bg-card`}>
                                <div className={`absolute top-0 left-0 w-full h-1 ${stage.color || 'bg-primary'}`} />
                                <div className="flex justify-between items-start">
                                    <span className="font-bold text-card-foreground tracking-tight">{stage.name}</span>
                                    <div className="flex gap-1 items-center">
                                        <button 
                                          onClick={() => { setSelectedStageForLead(stage.id); setIsAddLeadDialogOpen(true); }} 
                                          className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold"
                                        >
                                          <Plus className="w-3.5 h-3.5" /> ADD
                                        </button>
                                        <div className="flex gap-1 opacity-0 group-hover/stage:opacity-100 transition-opacity">
                                            <button onClick={() => openStageDialog(stage)} className="p-1.5 text-muted-foreground hover:text-primary bg-muted rounded-lg transition-colors"><Pencil className="w-3 h-3" /></button>
                                            <button onClick={() => deleteStage(stage.id)} className="p-1.5 text-muted-foreground hover:text-destructive bg-muted rounded-lg transition-colors"><Trash className="w-3 h-3" /></button>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-between text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">
                                    <span className="bg-muted px-2 py-0.5 rounded-full">{leads.length} leads</span>
                                    <span className="text-primary">R$ {totalValue.toLocaleString('pt-BR')}</span>
                                </div>
                            </div>

                            <div className="flex-1 bg-muted/20 backdrop-blur-[2px] rounded-2xl border border-dashed border-border/50 p-3 space-y-3 overflow-y-auto">
                                {leads.map(lead => (
                                    <Card
                                        key={lead.id}
                                        draggable
                                        onDragStart={() => handleDragStart(lead)}
                                        className={`p-4 shadow-md hover:shadow-xl cursor-grab active:cursor-grabbing border-none transition-all duration-300 bg-card hover:scale-[1.03] group/card relative overflow-hidden`}
                                    >
                                        <div className={`absolute top-0 left-0 w-1 h-full ${stage.color || 'bg-primary'}`} />
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-start">
                                              <p className="text-sm font-bold text-card-foreground leading-tight flex-1 pr-4">{lead.name}</p>
                                              <button 
                                                className="opacity-0 group-hover/card:opacity-100 p-1.5 text-muted-foreground hover:text-destructive bg-muted rounded-lg transition-all shadow-sm"
                                                title="Limpar Follow-up"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  deleteFollowUp(lead.id);
                                                }}
                                              >
                                                <Trash className="w-3 h-3" />
                                              </button>
                                            </div>
                                            <div className="flex justify-between items-center text-[10px]">
                                                <Badge variant="secondary" className="bg-secondary text-secondary-foreground font-bold border-none px-2 rounded-full h-5 text-[8px] uppercase tracking-wider">{lead.source || "Manual"}</Badge>
                                                <span className="font-extrabold text-primary text-xs">R$ {Number(lead.value).toLocaleString('pt-BR')}</span>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <div className="bg-card rounded-lg border border-border">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Lead</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Estágio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Fonte</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Valor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Atualizado</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {stages.flatMap(stage => 
                  (stage.leads || []).map(lead => (
                    <tr key={lead.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-foreground">{lead.name}</div>
                        {lead.email && <div className="text-sm text-muted-foreground">{lead.email}</div>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={`${stage.color} text-white`}>
                          {stage.name}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {lead.source || "Manual"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-foreground">
                        R$ {Number(lead.value).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {new Date(lead.updatedAt).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Funnel Dialog */}
      <Dialog open={isFunnelDialogOpen} onOpenChange={setIsFunnelDialogOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle>Criar Novo Funil</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
                <Label>Nome</Label>
                <Input value={funnelForm.name} onChange={e => setFunnelForm({...funnelForm, name: e.target.value})} placeholder="Ex: Vendas 2024" />
                <Label>Descrição</Label>
                <Input value={funnelForm.description} onChange={e => setFunnelForm({...funnelForm, description: e.target.value})} placeholder="Opcional" />
            </div>
            <DialogFooter>
                <Button onClick={createFunnel}>Criar Funil</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stage Dialog */}
      <Dialog open={isStageDialogOpen} onOpenChange={setIsStageDialogOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle>{editingStage ? 'Editar Estágio' : 'Novo Estágio'}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
                <Label>Nome</Label>
                <Input value={stageForm.name} onChange={e => setStageForm({...stageForm, name: e.target.value})} placeholder="Ex: Negociação" />
                
                <Label>Cor</Label>
                <div className="flex flex-wrap gap-2">
                    {['bg-primary', 'bg-emerald-400', 'bg-emerald-600', 'bg-emerald-800', 'bg-cyan-500', 'bg-purple-500', 'bg-amber-500', 'bg-orange-500', 'bg-red-500'].map(color => (
                         <button key={color} onClick={() => setStageForm({...stageForm, color})} className={`w-6 h-6 rounded-full ${color} ${stageForm.color === color ? 'ring-2 ring-offset-2 ring-primary' : ''}`} />
                    ))}
                </div>
            </div>
            <DialogFooter>
                <Button onClick={saveStage}>Salvar</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Funnel Settings Dialog */}
      <Dialog open={isFunnelSettingsOpen} onOpenChange={setIsFunnelSettingsOpen}>
        <DialogContent>
            <DialogHeader>
              <DialogTitle>Configurações do Funil</DialogTitle>
              <DialogDescription>Edite as informações básicas ou exclua este funil.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Nome do Funil</Label>
                  <Input value={funnelForm.name} onChange={e => setFunnelForm({...funnelForm, name: e.target.value})} placeholder="Ex: Vendas Internas" />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input value={funnelForm.description} onChange={e => setFunnelForm({...funnelForm, description: e.target.value})} placeholder="Ex: Leads vindos do Facebook" />
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Etapas do Funil</Label>
                    <Button variant="outline" size="sm" className="h-7 px-2 text-[10px]" onClick={() => openStageDialog()}>
                      <Plus className="w-3 h-3 mr-1" /> Novo Estágio
                    </Button>
                  </div>
                  
                  <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                    {stages.map((stage, idx) => (
                      <div key={stage.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg border border-border group animate-in slide-in-from-right-2 duration-300">
                        <div className={`w-1 h-6 rounded-full ${stage.color}`} />
                        <span className="flex-1 text-sm font-medium text-foreground">{stage.name}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => moveStage(idx, 'up')} disabled={idx === 0}>
                            <ChevronUp className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => moveStage(idx, 'down')} disabled={idx === stages.length - 1}>
                            <ChevronDown className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-primary" onClick={() => openStageDialog(stage)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteStage(stage.id)}>
                            <Trash className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
            </div>
            <DialogFooter className="flex justify-between sm:justify-between items-center">
                <Button variant="destructive" size="sm" onClick={deleteFunnel}>
                  <Trash className="w-4 h-4 mr-2" /> Excluir Funil
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsFunnelSettingsOpen(false)}>Cancelar</Button>
                  <Button onClick={updateFunnel}>Salvar Alterações</Button>
                </div>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Lead Dialog */}
      <Dialog open={isAddLeadDialogOpen} onOpenChange={setIsAddLeadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Lead</DialogTitle>
            <DialogDescription>
              Adicionar lead manualmente ao estágio: <strong className="text-primary">{stages.find(s => s.id === selectedStageForLead)?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome do Lead</Label>
                <Input 
                  placeholder="Ex: João Silva" 
                  value={leadForm.name} 
                  onChange={e => setLeadForm({...leadForm, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Valor Estimado</Label>
                <Input 
                  type="number" 
                  placeholder="0.00" 
                  value={leadForm.value} 
                  onChange={e => setLeadForm({...leadForm, value: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input 
                type="email" 
                placeholder="email@exemplo.com" 
                value={leadForm.email} 
                onChange={e => setLeadForm({...leadForm, email: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input 
                placeholder="(00) 00000-0000" 
                value={leadForm.phone} 
                onChange={e => setLeadForm({...leadForm, phone: e.target.value})}
              />
            </div>

            {/* 🔥 Custom Fields */}
            {customFields.length > 0 && (
              <div className="pt-4 border-t space-y-4">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Informações Adicionais</p>
                <div className="grid grid-cols-2 gap-4">
                  {customFields.map(field => (
                    <div key={field.id} className="space-y-2">
                      <Label className="flex items-center gap-1">
                        {field.name}
                        {field.isRequired && <span className="text-red-500">*</span>}
                      </Label>
                      {field.type === "SELECT" ? (
                        <Select 
                          value={customFieldValues[field.name] || ""} 
                          onValueChange={val => setCustomFieldValues(prev => ({ ...prev, [field.name]: val }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={field.placeholder || "Selecione..."} />
                          </SelectTrigger>
                          <SelectContent>
                            {field.options?.map((opt: string) => (
                              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : field.type === "BOOLEAN" ? (
                        <div className="flex items-center space-x-2 h-10">
                          <Switch 
                            checked={!!customFieldValues[field.name]}
                            onCheckedChange={val => setCustomFieldValues(prev => ({ ...prev, [field.name]: val }))}
                          />
                          <span className="text-sm text-muted-foreground">{customFieldValues[field.name] ? "Sim" : "Não"}</span>
                        </div>
                      ) : (
                        <Input 
                          type={field.type === "NUMBER" ? "number" : field.type === "DATE" ? "date" : "text"}
                          placeholder={field.placeholder || ""}
                          value={customFieldValues[field.name] || ""}
                          onChange={e => setCustomFieldValues(prev => ({ ...prev, [field.name]: e.target.value }))}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddLeadDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddLead} disabled={creatingLead}>
              {creatingLead ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Criar Lead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
