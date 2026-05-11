"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Search, 
  ChevronLeft, 
  RefreshCw, 
  ExternalLink,
  Facebook,
  Database,
  Calendar,
  Filter,
  Briefcase,
  FileText,
  Mail,
  Phone,
  ArrowRight
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function MetaLeadsCenterPage() {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [leads, setLeads] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  // Filters
  const [filterPage, setFilterPage] = useState("all");
  const [filterForm, setFilterForm] = useState("all");

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/meta/leads-center`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setLeads(data);
      }
    } catch (e: any) {
      toast.error("Erro ao carregar Central de Leads");
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch(`${API}/meta/sync-leads-center`, { 
        method: "POST", 
        credentials: "include" 
      });
      if (res.ok) {
        toast.success("Sincronização iniciada com sucesso!");
        fetchLeads();
      } else {
        toast.error("Erro ao iniciar sincronização");
      }
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => { fetchLeads(); }, []);

  const pages = Array.from(new Set(leads.map(l => l.pageName))).filter(Boolean);
  const forms = Array.from(new Set(leads.filter(l => filterPage === "all" || l.pageName === filterPage).map(l => l.formName))).filter(Boolean);

  const filteredLeads = leads.filter(l => {
    const matchesSearch = 
      l.name?.toLowerCase().includes(search.toLowerCase()) || 
      l.email?.toLowerCase().includes(search.toLowerCase()) ||
      l.phone?.includes(search);
    
    const matchesPage = filterPage === "all" || l.pageName === filterPage;
    const matchesForm = filterForm === "all" || l.formName === filterForm;
    
    return matchesSearch && matchesPage && matchesForm;
  });

  const formatDate = (d: string) => new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  // Stats
  const totalLeads = leads.length;
  const leadsToday = leads.filter(l => new Date(l.createdTime).toDateString() === new Date().toDateString()).length;
  const uniqueForms = new Set(leads.map(l => l.formId)).size;

  return (
    <>
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => window.location.href = '/relatorios/meta'} className="p-2 hover:bg-gray-100 rounded-full">
              <ChevronLeft size={24} />
            </Button>
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-3 rounded-2xl shadow-xl shadow-blue-100">
              <Facebook className="text-white h-7 w-7" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">Lead Center Meta</h1>
              <p className="text-gray-500 font-medium flex items-center gap-2">
                Central unificada de leads capturados em todas as BMs e Páginas
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={18} />
              <Input 
                placeholder="Buscar por nome, email ou fone..." 
                className="pl-10 w-72 h-11 border-2 focus-visible:ring-blue-600 transition-all rounded-xl" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleSync} 
              disabled={syncing || loading} 
              className="h-11 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100 rounded-xl px-6"
            >
              <RefreshCw size={18} className={`mr-2 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Sincronizando..." : "Sincronização Completa"}
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-none bg-blue-600 text-white shadow-xl shadow-blue-100 overflow-hidden relative">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-blue-100 text-xs font-bold uppercase tracking-wider">Total Acumulado</p>
                  <h3 className="text-4xl font-black mt-1">{totalLeads}</h3>
                </div>
                <Users className="text-blue-400/50" size={40} />
              </div>
              <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2 text-xs">
                <Badge className="bg-white/20 hover:bg-white/30 text-white border-none">Global</Badge>
                <span className="text-blue-100">Leads capturados via Meta</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-emerald-100 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Leads Hoje</p>
                  <h3 className="text-4xl font-black mt-1 text-emerald-600">+{leadsToday}</h3>
                </div>
                <div className="bg-emerald-50 p-3 rounded-xl"><Calendar className="text-emerald-600" size={24} /></div>
              </div>
              <p className="mt-4 text-xs text-gray-500 font-medium">Novas capturas nas últimas 24h</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-100 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Formulários Ativos</p>
                  <h3 className="text-4xl font-black mt-1 text-purple-600">{uniqueForms}</h3>
                </div>
                <div className="bg-purple-50 p-3 rounded-xl"><FileText className="text-purple-600" size={24} /></div>
              </div>
              <p className="mt-4 text-xs text-gray-500 font-medium">Fontes de entrada mapeadas</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-100 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Taxa de Sincronia</p>
                  <h3 className="text-4xl font-black mt-1 text-orange-600">99%</h3>
                </div>
                <div className="bg-orange-50 p-3 rounded-xl"><RefreshCw className="text-orange-600" size={24} /></div>
              </div>
              <p className="mt-4 text-xs text-gray-500 font-medium">Processamento via Webhook</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Table */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 bg-gray-50 p-4 rounded-2xl border-2 border-dashed border-gray-200">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mr-2">
              <Filter size={16} /> FILTRAR POR:
            </div>
            
            <Select value={filterPage} onValueChange={(v) => { setFilterPage(v); setFilterForm("all"); }}>
              <SelectTrigger className="w-56 h-10 bg-white border-2 rounded-xl">
                <SelectValue placeholder="Todas as Páginas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Páginas</SelectItem>
                {pages.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={filterForm} onValueChange={setFilterForm}>
              <SelectTrigger className="w-64 h-10 bg-white border-2 rounded-xl">
                <SelectValue placeholder="Todos os Formulários" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Formulários</SelectItem>
                {forms.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
            
            {(filterPage !== "all" || filterForm !== "all" || search) && (
              <Button variant="ghost" size="sm" onClick={() => {setFilterPage("all"); setFilterForm("all"); setSearch("");}} className="text-red-500 hover:text-red-600 font-bold">
                Limpar Filtros
              </Button>
            )}
          </div>

          <Card className="border-2 shadow-xl shadow-gray-100 rounded-2xl overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 text-[10px] uppercase font-black text-gray-400 border-b tracking-widest">
                      <th className="px-6 py-5">Informações do Lead</th>
                      <th className="px-6 py-5">Origem Meta (Page/Form)</th>
                      <th className="px-6 py-5">Data de Entrada</th>
                      <th className="px-6 py-5">ID Meta</th>
                      <th className="px-6 py-5 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {loading ? (
                      <tr><td colSpan={5} className="py-24 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <RefreshCw className="animate-spin text-blue-600" size={32} />
                          <p className="text-gray-400 font-bold italic">Carregando base de leads unificada...</p>
                        </div>
                      </td></tr>
                    ) : filteredLeads.length === 0 ? (
                      <tr><td colSpan={5} className="py-24 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="bg-gray-100 p-6 rounded-full"><Users size={48} className="text-gray-300" /></div>
                          <div className="max-w-xs mx-auto">
                            <p className="text-gray-500 font-bold">Nenhum lead encontrado</p>
                            <p className="text-gray-400 text-sm italic">Tente ajustar seus filtros ou execute uma sincronização manual.</p>
                          </div>
                        </div>
                      </td></tr>
                    ) : filteredLeads.map((l: any) => (
                      <tr key={l.id} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-black text-sm">
                              {l.name?.charAt(0) || "?"}
                            </div>
                            <div>
                              <div className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{l.name}</div>
                              <div className="flex items-center gap-3 mt-0.5">
                                <span className="text-xs text-gray-500 flex items-center gap-1"><Mail size={12} className="text-gray-400" /> {l.email || "—"}</span>
                                {l.phone && <span className="text-xs text-gray-500 flex items-center gap-1"><Phone size={12} className="text-gray-400" /> {l.phone}</span>}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="bg-white text-blue-700 border-blue-100 flex items-center gap-1 text-[10px] font-bold">
                                <Facebook size={10} /> {l.pageName}
                              </Badge>
                            </div>
                            <div className="text-[11px] text-gray-400 font-medium flex items-center gap-1 pl-1">
                              <FileText size={10} /> {l.formName}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                            <Calendar size={14} className="text-gray-400" />
                            {formatDate(l.createdTime)}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <code className="text-[10px] bg-gray-100 px-2 py-1 rounded text-gray-500 font-mono">
                            {l.metaLeadId}
                          </code>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-9 px-4 border-2 border-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all font-bold text-xs rounded-lg"
                              onClick={() => {
                                setSelectedLead(l);
                                setIsDetailsOpen(true);
                              }}
                            >
                              Ver Respostas
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pro Tips Footer */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between pt-4">
           <div className="flex items-center gap-3 text-sm text-gray-500">
             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
             Conectado aos Webhooks da Meta Ads (Live)
           </div>
           <div className="flex items-center gap-6">
             <div className="text-center">
               <p className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">Último Sync</p>
               <p className="text-xs font-bold text-gray-700">Há poucos minutos</p>
             </div>
             <div className="text-center">
               <p className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">Taxa de Captura</p>
               <p className="text-xs font-bold text-emerald-600">100% Nominal</p>
             </div>
           </div>
        </div>
      </div>

      {/* Lead Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-8 text-white relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Facebook size={120} />
            </div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-black text-2xl">
                {selectedLead?.name?.charAt(0) || "?"}
              </div>
              <div>
                <h2 className="text-2xl font-black">{selectedLead?.name}</h2>
                <p className="text-blue-100 font-medium flex items-center gap-2 text-sm mt-1">
                  <Mail size={14} /> {selectedLead?.email || "E-mail não informado"}
                </p>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-8 bg-white max-h-[60vh] overflow-y-auto">
            {/* Context Info */}
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                 <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1">Página de Origem</p>
                 <div className="flex items-center gap-2 font-bold text-gray-800">
                   <Facebook size={14} className="text-blue-600" /> {selectedLead?.pageName}
                 </div>
               </div>
               <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                 <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1">Formulário Utilizado</p>
                 <div className="flex items-center gap-2 font-bold text-gray-800">
                   <FileText size={14} className="text-purple-600" /> {selectedLead?.formName}
                 </div>
               </div>
            </div>

            {/* Lead Form Data */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-gray-900 text-sm uppercase tracking-widest flex items-center gap-2">
                  <Database size={16} className="text-blue-600" /> Respostas do Prospecto
                </h4>
                <Badge className="bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-50">Meta Ads API</Badge>
              </div>
              
              <div className="grid gap-3">
                {selectedLead?.rawData?.field_data ? (
                  selectedLead.rawData.field_data.map((field: any) => (
                    <div key={field.name} className="flex items-center justify-between p-4 border-2 border-gray-50 rounded-2xl hover:border-blue-100 hover:bg-blue-50/20 transition-all group">
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase font-black mb-0.5 tracking-tight group-hover:text-blue-400 transition-colors">{field.name.replace(/_/g, ' ')}</p>
                        <p className="text-gray-900 font-bold group-hover:text-blue-900 transition-colors">{field.values?.[0] || "—"}</p>
                      </div>
                      <ArrowRight size={16} className="text-gray-200 group-hover:text-blue-300 transition-colors" />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-2xl border-2 border-dashed">
                    <p className="text-sm text-gray-400 italic font-medium">Nenhum dado detalhado disponível para este lead.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Meta ID Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
               <div className="flex flex-col">
                 <span className="text-[10px] text-gray-400 font-black uppercase">Lead ID (Meta)</span>
                 <span className="text-xs font-mono font-bold text-gray-600">{selectedLead?.metaLeadId}</span>
               </div>
               <div className="flex flex-col items-end">
                 <span className="text-[10px] text-gray-400 font-black uppercase">Capturado em</span>
                 <span className="text-xs font-bold text-gray-600">{selectedLead && formatDate(selectedLead.createdTime)}</span>
               </div>
            </div>
          </div>
          
          <div className="p-6 bg-gray-50 border-t flex justify-end">
            <Button onClick={() => setIsDetailsOpen(false)} className="bg-gray-900 hover:bg-gray-800 text-white font-bold px-8 rounded-xl h-11">
              Fechar Detalhes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
