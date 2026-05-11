"use client";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Plus
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

interface Lead {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  source: string | null;
  status: string;
  value?: string;
  lastContact?: string;
  funnelId?: number;
  stageId?: number;
  customFields?: Record<string, any>;
}

interface Funnel {
  id: number;
  name: string;
  stages: { id: number; name: string }[];
}

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("Todos");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    source: "",
    status: "new",
    value: 0,
    funnelId: "",
    stageId: "",
    customFields: {} as Record<string, any>
  });
  const [customFields, setCustomFields] = useState<any[]>([]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const [leadsRes, funnelsRes, fieldsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads`, { credentials: 'include' }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/funnel`, { credentials: 'include' }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/custom-fields?entityType=LEAD`, { credentials: 'include' })
      ]);
      
      const leadsData = await leadsRes.json();
      const funnelsData = await funnelsRes.json();
      const fieldsData = await fieldsRes.json();
      
      setLeads(Array.isArray(leadsData) ? leadsData : []);
      setFunnels(Array.isArray(funnelsData) ? funnelsData : []);
      setCustomFields(Array.isArray(fieldsData) ? fieldsData : []);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleCreateOrUpdate = async () => {
    try {
      const url = editingLead 
        ? `${process.env.NEXT_PUBLIC_API_URL}/leads/${editingLead.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/leads`;
      
      const method = editingLead ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        funnelId: formData.funnelId ? Number(formData.funnelId) : null,
        stageId: formData.stageId ? Number(formData.stageId) : null,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });

      if (res.ok) {
        toast.success(editingLead ? "Lead atualizado!" : "Lead criado!");
        setIsDialogOpen(false);
        setEditingLead(null);
        setFormData({ name: "", email: "", phone: "", source: "", status: "new", value: 0, funnelId: "", stageId: "", customFields: {} });
        fetchLeads();
      } else {
        toast.error("Erro ao salvar lead");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro na requisição");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este lead?")) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        toast.success("Lead excluído");
        fetchLeads();
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao excluir");
    }
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.phone || "").includes(searchTerm);
    const matchesStatus =
      selectedStatus === "Todos" || (lead.status === selectedStatus || (selectedStatus === 'Novo' && lead.status === 'new'));
    return matchesSearch && matchesStatus;
  }) as Lead[];

  const statuses = [
    "Todos",
    "Novo",
    "Contato",
    "Qualificado",
    "Proposta",
    "Negociação",
    "Fechado",
  ];

  const activeFunnel = funnels.find(f => f.id.toString() === formData.funnelId);

  if (loading) return <div className="p-8">Carregando...</div>;

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl text-foreground mb-2">Leads</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Gerencie todos os seus leads em um só lugar
          </p>
        </div>
        <Button
          className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto"
          onClick={() => {
             setEditingLead(null);
              setFormData({ name: "", email: "", phone: "", source: "", status: "new", value: 0, funnelId: "", stageId: "", customFields: {} });
              if(funnels.length > 0) {
                  setFormData(prev => ({ ...prev, funnelId: funnels[0].id.toString() }));
              }
              setIsDialogOpen(true);
          }}
        >
          <Plus size={18} className="mr-2" />
          Novo Lead
        </Button>
      </div>

      {/* Filtros e Pesquisa */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                size={18}
              />
              <Input
                placeholder="Buscar por nome, email ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2 lg:mx-0 lg:px-0">
              {statuses.map((status) => (
                <Button
                  key={status}
                  variant={selectedStatus === status ? "default" : "outline"}
                  onClick={() => setSelectedStatus(status)}
                  className={cn(
                    "whitespace-nowrap transition-colors",
                    selectedStatus === status
                      ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl text-foreground mb-1">
              {leads.length}
            </div>
            <div className="text-sm text-muted-foreground">Total de Leads</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl text-primary mb-1">
              {leads.filter((l: Lead) => l.status === "closed").length}
            </div>
            <div className="text-sm text-muted-foreground">Leads Convertidos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl text-primary/80 mb-1">
              {leads.filter((l: Lead) => l.status === "new").length}
            </div>
            <div className="text-sm text-muted-foreground">Leads Novos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl text-primary font-bold mb-1">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                leads.reduce((sum, l) => sum + (Number(l.value) || 0), 0)
              )}
            </div>
            <div className="text-sm text-muted-foreground">Pipeline</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Leads */}
      <Card>
        <CardHeader>
          <CardTitle>Todos os Leads</CardTitle>
          <CardDescription>
            Mostrando {filteredLeads.length} de {leads.length} leads
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="min-w-[200px]">Nome</TableHead>
                  <TableHead className="min-w-[150px]">Contato</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead className="min-w-[140px]">Status / Etapa</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Contatado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => {
                   // Find funnel and stage name
                   const funnel = funnels.find(f => f.id === lead.funnelId);
                   const stage = funnel?.stages.find(s => s.id === lead.stageId);
                   
                   return (
                  <TableRow key={lead.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-bold">
                          {lead.name.charAt(0)}
                        </div>
                        <div className="max-w-[150px] sm:max-w-none">
                          <div className="text-foreground font-medium truncate">{lead.name}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {lead.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs sm:text-sm text-muted-foreground">{lead.phone}</div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="border-primary/20 text-primary whitespace-nowrap bg-primary/5"
                      >
                        {lead.source}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {stage ? (
                          <div className="flex flex-col gap-1">
                              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{funnel?.name}</span>
                              <Badge className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30 w-fit text-xs">
                                  {stage.name}
                              </Badge>
                          </div>
                      ) : ( 
                          <Badge className={`bg-muted-foreground hover:bg-muted-foreground/90 text-white text-xs`}>
                          {lead.status === 'new' ? 'Novo' : lead.status}
                          </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-foreground font-semibold text-xs sm:text-sm whitespace-nowrap">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(lead.value) || 0)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        Agora
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                         <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-3 sm:py-2"
                          onClick={() => {
                            setEditingLead(lead);
                            setFormData({
                              name: lead.name,
                              email: lead.email || "",
                              phone: lead.phone || "",
                              source: lead.source || "",
                              status: lead.status,
                              value: Number(lead.value) || 0,
                               funnelId: lead.funnelId?.toString() || "",
                               stageId: lead.stageId?.toString() || "",
                               customFields: lead.customFields || {}
                             });
                             setIsDialogOpen(true);
                          }}
                        >
                           Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-3 sm:py-2 hover:bg-destructive/10"
                          onClick={() => handleDelete(lead.id)}
                        >
                           Excluir
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )})}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog para Novo Lead / Edição */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingLead ? "Editar Lead" : "Adicionar Novo Lead"}</DialogTitle>
            <DialogDescription>
              Preencha as informações do lead
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                placeholder="João Silva"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="joao@email.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                placeholder="(11) 98765-4321"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Funil</Label>
                    <Select 
                      value={formData.funnelId || "_none"} 
                      onValueChange={v => setFormData({...formData, funnelId: v === "_none" ? "" : v, stageId: ""})}
                    >
                        <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="_none">Nenhum</SelectItem>
                            {funnels.map(f => (
                                <SelectItem key={f.id} value={f.id.toString()}>{f.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Etapa</Label>
                    <Select value={formData.stageId} onValueChange={v => setFormData({...formData, stageId: v})} disabled={!formData.funnelId}>
                        <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>
                            {activeFunnel?.stages.map(s => (
                                <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="source">Origem</Label>
              <Select
                value={formData.source || ""}
                onValueChange={(value) =>
                  setFormData({ ...formData, source: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a origem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Facebook Ads">Facebook Ads</SelectItem>
                  <SelectItem value="Instagram">Instagram</SelectItem>
                  <SelectItem value="Google Ads">Google Ads</SelectItem>
                  <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                  <SelectItem value="Orgânico">Orgânico</SelectItem>
                  <SelectItem value="Indicação">Indicação</SelectItem>
                </SelectContent>
              </Select>
            </div>
           
            <div className="space-y-2">
              <Label htmlFor="value">Valor Estimado (R$)</Label>
              <Input
                id="value"
                type="number"
                placeholder="2500"
                value={formData.value}
                onChange={(e) =>
                  setFormData({ ...formData, value: Number(e.target.value) })
                }
              />
            </div>

            {/* 🔥 Custom Fields */}
            {customFields.length > 0 && (
              <div className="pt-4 border-t space-y-4">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Informações Adicionais</p>
                <div className="grid grid-cols-1 gap-4">
                  {customFields.map(field => (
                    <div key={field.id} className="space-y-2">
                      <Label className="flex items-center gap-1">
                        {field.name}
                        {field.isRequired && <span className="text-red-500">*</span>}
                      </Label>
                      {field.type === "SELECT" ? (
                        <Select 
                          value={formData.customFields?.[field.name] || ""} 
                          onValueChange={val => setFormData(prev => ({ 
                            ...prev, 
                            customFields: { ...prev.customFields, [field.name]: val } 
                          }))}
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
                            checked={!!formData.customFields?.[field.name]}
                            onCheckedChange={val => setFormData(prev => ({ 
                              ...prev, 
                              customFields: { ...prev.customFields, [field.name]: val } 
                            }))}
                          />
                          <span className="text-sm text-muted-foreground">{formData.customFields?.[field.name] ? "Sim" : "Não"}</span>
                        </div>
                      ) : (
                        <Input 
                          type={field.type === "NUMBER" ? "number" : field.type === "DATE" ? "date" : "text"}
                          placeholder={field.placeholder || ""}
                          value={formData.customFields?.[field.name] || ""}
                          onChange={e => setFormData(prev => ({ 
                            ...prev, 
                            customFields: { ...prev.customFields, [field.name]: e.target.value } 
                          }))}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateOrUpdate}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {editingLead ? "Salvar Alterações" : "Criar Lead"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
