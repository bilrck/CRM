"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Clock, 
  CalendarClock,
  ExternalLink,
  CheckCircle2,
  Plus,
  ChevronLeft,
  ChevronRight,
  Search,
  MessageSquare,
  ArrowRightCircle,
  BellRing,
  Trash
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Lead {
  id: number;
  name: string;
  phone: string | null;
  status: string;
  nextFollowUpDate: string | null;
  lastContactDate: string | null;
  followUpAction: string | null;
  followUpConfig: {
    stageId?: string | number | null;
    message?: string | null;
    notify?: boolean;
    reminderTiming?: string;
  };
  workspaceId: number;
  owner?: { name: string };
  funnel?: { name: string };
  stage?: { name: string; color: string };
}

interface Funnel {
  id: number;
  name: string;
  stages: { id: number; name: string; color: string }[];
}

export default function FollowUpsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState("today");
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  
  // Creation/Edit States
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [followUpDate, setFollowUpDate] = useState("");
  const [leadSearch, setLeadSearch] = useState("");
  
  // Action Config States
  const [actionMoveFunnel, setActionMoveFunnel] = useState(false);
  const [actionReminder, setActionReminder] = useState(false);
  const [actionNotify, setActionNotify] = useState(false);
  const [targetStageId, setTargetStageId] = useState<string>("");
  const [reminderMessage, setReminderMessage] = useState("");
  const [reminderTiming, setReminderTiming] = useState("0"); // "0" means at the same time

  // Calendar States
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const fetchFollowUps = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads?hasFollowUp=true`, {
        credentials: "include",
      });
      const data = await res.json();
      setLeads(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar follow-ups");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAllLeads = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads`, {
        credentials: "include",
      });
      const data = await res.json();
      setAllLeads(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchFunnels = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/funnel`, {
        credentials: "include",
      });
      const data = await res.json();
      setFunnels(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchFollowUps();
    fetchAllLeads();
    fetchFunnels();
  }, [fetchFollowUps, fetchAllLeads, fetchFunnels]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateStr));
  };

  const getFilteredLeads = () => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    switch (currentTab) {
      case "overdue":
        return leads.filter(l => l.nextFollowUpDate && new Date(l.nextFollowUpDate) < todayStart);
      case "today":
        return leads.filter(l => {
          if (!l.nextFollowUpDate) return false;
          const d = new Date(l.nextFollowUpDate);
          return d >= todayStart && d <= todayEnd;
        });
      case "future":
        return leads.filter(l => l.nextFollowUpDate && new Date(l.nextFollowUpDate) > todayEnd);
      default:
        return leads;
    }
  };

  const deleteFollowUp = async (leadId: number) => {
    if (!confirm("Tem certeza que deseja excluir este follow-up?")) return;
    
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
        toast.success("Follow-up excluído!");
        fetchFollowUps();
      } else {
        toast.error("Erro ao excluir follow-up");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro na conexão");
    }
  };

  const handleSaveFollowUp = async () => {
    if (!selectedLead || !followUpDate) {
      toast.error("Selecione um lead e uma data");
      return;
    }

    const actions = [];
    if (actionMoveFunnel) actions.push("MOVE_FUNNEL");
    if (actionReminder) actions.push("REMINDER");
    if (actionNotify) actions.push("NOTIFY");

    const baseDate = new Date(followUpDate);
    let reminderDate: string | null = null;
    
    if (reminderTiming !== "none" && (actionReminder || actionNotify)) {
      const offsetMs = parseInt(reminderTiming) * 60 * 1000;
      reminderDate = new Date(baseDate.getTime() - offsetMs).toISOString();
    }

    const config = {
      stageId: actionMoveFunnel ? targetStageId : null,
      message: actionReminder ? reminderMessage : null,
      notify: actionNotify,
      reminderTiming: reminderTiming // Store for future reference
    };

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads/${selectedLead.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          nextFollowUpDate: baseDate.toISOString(),
          reminderDate: reminderDate,
          followUpAction: actions.join(","),
          followUpConfig: config
        }),
        credentials: "include",
      });

      if (res.ok) {
        toast.success("Follow-up agendado!");
        setIsUpdateDialogOpen(false);
        resetDialog();
        fetchFollowUps();
      } else {
        toast.error("Erro ao agendar follow-up");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const resetDialog = () => {
    setSelectedLead(null);
    setFollowUpDate("");
    setLeadSearch("");
    setActionMoveFunnel(false);
    setActionReminder(false);
    setActionNotify(false);
    setTargetStageId("");
    setReminderMessage("");
    setReminderTiming("0");
  };

  const openEdit = (lead: Lead) => {
    setSelectedLead(lead);
    if (lead.nextFollowUpDate) {
       // Format for datetime-local
       const d = new Date(lead.nextFollowUpDate);
       const pad = (n: number) => n.toString().padStart(2, '0');
       setFollowUpDate(`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
    }
    
    const actions = lead.followUpAction ? lead.followUpAction.split(",") : [];
    const config = lead.followUpConfig || {};
    
    setActionMoveFunnel(actions.includes("MOVE_FUNNEL"));
    setActionReminder(actions.includes("REMINDER"));
    setActionNotify(actions.includes("NOTIFY"));
    setTargetStageId(config.stageId ? config.stageId.toString() : "");
    setReminderMessage(config.message || "");
    setReminderTiming(config.reminderTiming || "0");
    
    setIsUpdateDialogOpen(true);
  };

  const filtered = getFilteredLeads();

  // Calendar Helpers
  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysCount = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);
    
    const days = [];
    for (let i = 0; i < startDay; i++) days.push(null);
    for (let i = 1; i <= daysCount; i++) days.push(i);
    
    return days;
  }, [currentMonth]);

  const hasFollowUpOnDay = (day: number) => {
    return leads.some(l => {
      if (!l.nextFollowUpDate) return false;
      const d = new Date(l.nextFollowUpDate);
      return d.getDate() === day && 
             d.getMonth() === currentMonth.getMonth() && 
             d.getFullYear() === currentMonth.getFullYear();
    });
  };

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const filteredSearchLeads = allLeads.filter(l => 
    l.name.toLowerCase().includes(leadSearch.toLowerCase())
  ).slice(0, 5);

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Follow-ups</h1>
          <p className="text-muted-foreground">Otimize seus contatos e automatize ações.</p>
        </div>
        
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => { resetDialog(); setIsUpdateDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Follow-up
        </Button>
      </div>

      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedLead ? "Configurar Follow-up" : "Agendar Novo Follow-up"}</DialogTitle>
            <DialogDescription>Defina o lead e as ações automáticas para o contato.</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-5 py-4 max-h-[70vh] overflow-y-auto px-1">
            {/* Lead Selection (Always by Name) */}
            <div className="space-y-2">
              <Label>Selecionar Lead (Busca por Nome)</Label>
              {!selectedLead ? (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Digite o nome..." 
                      className="pl-8" 
                      value={leadSearch}
                      onChange={(e) => setLeadSearch(e.target.value)}
                    />
                  </div>
                  {leadSearch.length > 1 && (
                    <div className="border border-border rounded-md divide-y overflow-hidden bg-background shadow-sm">
                      {filteredSearchLeads.map(l => (
                        <div 
                          key={l.id} 
                          className="p-2 text-sm hover:bg-muted cursor-pointer flex justify-between"
                          onClick={() => { setSelectedLead(l); setLeadSearch(""); }}
                        >
                          <span className="font-medium text-foreground">{l.name}</span>
                          <span className="text-xs text-muted-foreground">{l.phone}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex justify-between items-center p-2 border rounded-md bg-primary/10 border-primary/20">
                  <span className="font-medium text-primary">{selectedLead.name}</span>
                  <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => setSelectedLead(null)}>Trocar</Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Data e Hora</Label>
              <Input 
                type="datetime-local" 
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
              />
            </div>

            <div className="h-px bg-border my-2" />
            
            <h3 className="text-sm font-semibold text-foreground">Ações Automáticas</h3>
            
            {/* Dashboard Notification */}
            <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/50">
               <div className="flex items-center gap-3">
                  <BellRing className="w-4 h-4 text-primary" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Notificação no Painel</span>
                    <span className="text-[10px] text-muted-foreground">Aviso visual ao vencer</span>
                  </div>
               </div>
               <Switch checked={actionNotify} onCheckedChange={setActionNotify} />
            </div>

            {/* Funnel Move */}
            <div className="space-y-3 p-3 border border-border rounded-lg bg-muted/50">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ArrowRightCircle className="w-4 h-4 text-primary/70" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">Mover Funil</span>
                      <span className="text-[10px] text-muted-foreground">Trocar etapa do lead</span>
                    </div>
                  </div>
                  <Switch checked={actionMoveFunnel} onCheckedChange={setActionMoveFunnel} />
               </div>
               {actionMoveFunnel && (
                  <Select value={targetStageId} onValueChange={setTargetStageId}>
                    <SelectTrigger className="mt-2 h-8 text-xs">
                      <SelectValue placeholder="Escolher etapa..." />
                    </SelectTrigger>
                    <SelectContent>
                      {funnels.map(f => (
                        <div key={f.id}>
                          <div className="p-1 px-2 text-[10px] uppercase font-bold text-muted-foreground">{f.name}</div>
                          {f.stages.map(s => (
                            <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                          ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
               )}
            </div>

            {/* WhatsApp Reminder */}
            <div className="space-y-3 p-3 border border-border rounded-lg bg-muted/50">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">Mensagem de Lembrete</span>
                      <span className="text-[10px] text-muted-foreground">Enviar via WhatsApp</span>
                    </div>
                  </div>
                  <Switch checked={actionReminder} onCheckedChange={setActionReminder} />
               </div>
               {actionReminder && (
                  <Textarea 
                    placeholder="Sua mensagem automática..." 
                    className="mt-2 text-xs min-h-[80px]"
                    value={reminderMessage}
                    onChange={(e) => setReminderMessage(e.target.value)}
                  />
               )}
            </div>

            {/* Reminder Timing - New Section */}
            {(actionReminder || actionNotify) && (
              <div className="space-y-2 p-3 border rounded-lg bg-primary/10 border-primary/20">
                <Label className="text-xs font-semibold text-primary">Lembrete Antecipado</Label>
                <Select value={reminderTiming} onValueChange={setReminderTiming}>
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue placeholder="Quando avisar?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No horário exato</SelectItem>
                    <SelectItem value="5">5 minutos antes</SelectItem>
                    <SelectItem value="15">15 minutos antes</SelectItem>
                    <SelectItem value="30">30 minutos antes</SelectItem>
                    <SelectItem value="60">1 hora antes</SelectItem>
                    <SelectItem value="120">2 horas antes</SelectItem>
                    <SelectItem value="1440">1 dia antes</SelectItem>
                    <SelectItem value="2880">2 dias antes</SelectItem>
                    <SelectItem value="10080">1 semana antes</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[9px] text-muted-foreground italic">
                  As ações de notificação/mensagem serão disparadas neste momento. O &quot;Mover Funil&quot; permanece no horário principal.
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>Cancelar</Button>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleSaveFollowUp}>Salvar Configuração</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Card */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Calendário</CardTitle>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={prevMonth}><ChevronLeft className="w-4 h-4"/></Button>
                <Button variant="ghost" size="sm" onClick={nextMonth}><ChevronRight className="w-4 h-4"/></Button>
              </div>
            </div>
            <CardDescription className="capitalize">
              {currentMonth.toLocaleDateString("pt-BR", { month: 'long', year: 'numeric' })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-muted-foreground mb-2">
              <span>Dom</span><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, idx) => (
                <div 
                  key={idx} 
                  className={cn(
                    "h-8 flex items-center justify-center rounded-md text-xs relative",
                    day ? "hover:bg-muted cursor-pointer" : "",
                    day && hasFollowUpOnDay(day) ? "font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10" : ""
                  )}
                >
                  {day}
                  {day && hasFollowUpOnDay(day) && (
                    <span className="absolute bottom-1 w-1 h-1 bg-primary rounded-full" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* List Card */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="today" onValueChange={setCurrentTab} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="overdue" className="data-[state=active]:bg-destructive/10 data-[state=active]:text-destructive">
                Atrasados
              </TabsTrigger>
              <TabsTrigger value="today" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                Hoje
              </TabsTrigger>
              <TabsTrigger value="future" className="data-[state=active]:bg-muted data-[state=active]:text-foreground">
                Próximos
              </TabsTrigger>
            </TabsList>

            <Card className="mt-6">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CalendarClock className="w-5 h-5 text-primary" />
                  <CardTitle>
                    {currentTab === "overdue" ? "Atrasados" : 
                     currentTab === "today" ? "Para Hoje" : 
                     "Próximos"}
                  </CardTitle>
                </div>
                <CardDescription>
                  {filtered.length} lead(s) com ações configuradas.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-10">Carregando...</div>
                ) : filtered.length === 0 ? (
                  <div className="text-center py-20 text-muted-foreground">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>Nenhum compromisso encontrado.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Lead</TableHead>
                        <TableHead>Agendado Para</TableHead>
                        <TableHead>Ações</TableHead>
                        <TableHead className="text-right">Gerenciar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span>{lead.name}</span>
                              <span className="text-[10px] text-muted-foreground">{lead.phone}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Clock className={cn("w-3 h-3", currentTab === "overdue" ? "text-red-500" : "text-blue-500")} />
                              <span className={cn("text-xs", currentTab === "overdue" ? "text-red-600 font-medium" : "")}>
                                {formatDate(lead.nextFollowUpDate)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                             <div className="flex gap-1">
                                {lead.followUpAction?.includes("NOTIFY") && <BellRing className="w-3.5 h-3.5 text-primary/80" />}
                                {lead.followUpAction?.includes("MOVE_FUNNEL") && <ArrowRightCircle className="w-3.5 h-3.5 text-primary/60" />}
                                {lead.followUpAction?.includes("REMINDER") && <MessageSquare className="w-3.5 h-3.5 text-primary" />}
                             </div>
                          </TableCell>
                          <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-7 px-2 text-primary border-primary/20 hover:bg-primary/10 text-[10px]"
                                  onClick={() => deleteFollowUp(lead.id)}
                                >
                                  Done
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-7 px-2 text-destructive hover:bg-destructive/10" 
                                  onClick={() => deleteFollowUp(lead.id)}
                                >
                                  <Trash className="w-3 h-3" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => openEdit(lead)}>
                                  <ExternalLink className="w-3 h-3" />
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
          </Tabs>
        </div>
      </div>
    </div>
  );
}
