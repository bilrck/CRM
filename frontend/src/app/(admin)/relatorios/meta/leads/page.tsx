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
  Calendar
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

const API = process.env.NEXT_PUBLIC_API_URL;

export default function MetaLeadsRawPage() {
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      // Filter leads that have metaLeadFormId (they came from Meta)
      const res = await fetch(`${API}/leads`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        const metaLeads = data.filter((l: any) => l.metaLeadFormId || l.source?.toLowerCase().includes("facebook"));
        setLeads(metaLeads);
      }
    } catch (e: any) {
      toast.error("Erro ao carregar leads da Meta");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeads(); }, []);

  const filteredLeads = leads.filter(l => 
    l.name?.toLowerCase().includes(search.toLowerCase()) || 
    l.email?.toLowerCase().includes(search.toLowerCase()) ||
    l.phone?.includes(search)
  );

  const formatDate = (d: string) => new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  return (
    <>
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => window.location.href = '/relatorios/meta'} className="p-2">
              <ChevronLeft size={24} />
            </Button>
            <div className="bg-emerald-600 p-2 rounded-xl shadow-lg">
              <Users className="text-white h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900">Leads Raw Data</h1>
              <p className="text-gray-500">Listagem detalhada de leads capturados via Lead Ads</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <Input 
                placeholder="Buscar por nome, email..." 
                className="pl-10 w-64 h-10" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button onClick={fetchLeads} disabled={loading} variant="outline" className="h-10">
              <RefreshCw size={16} className={`mr-2 ${loading ? "animate-spin" : ""}`} />
              Sincronizar
            </Button>
          </div>
        </div>

        <Card className="border-2 shadow-sm overflow-hidden">
          <CardHeader className="bg-gray-50/50 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Facebook size={18} className="text-blue-600" /> Leads Identificados
                </CardTitle>
                <CardDescription>{filteredLeads.length} leads originados da Meta</CardDescription>
              </div>
              <Badge variant="outline" className="bg-white">{leads.length} totais</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-100/60 text-[11px] uppercase font-bold text-gray-500 border-b">
                    <th className="px-6 py-4">Lead / Contato</th>
                    <th className="px-6 py-4">Origem / Formulário</th>
                    <th className="px-6 py-4">Data de Entrada</th>
                    <th className="px-6 py-4">Status no CRM</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loading ? (
                    <tr><td colSpan={5} className="py-20 text-center text-gray-400">Carregando leads...</td></tr>
                  ) : filteredLeads.length === 0 ? (
                    <tr><td colSpan={5} className="py-20 text-center text-gray-400 italic">Nenhum lead encontrado para esta busca.</td></tr>
                  ) : filteredLeads.map((l: any) => (
                    <tr key={l.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{l.name}</div>
                        <div className="text-xs text-gray-500">{l.email || "Sem email"}</div>
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">{l.phone || "Sem telefone"}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-blue-700 flex items-center gap-1">
                             <Facebook size={12} /> {l.metaLeadForm?.page?.name || "Meta Page"}
                          </span>
                          <span className="text-xs text-gray-400 line-clamp-1">{l.metaLeadForm?.name || "Lead Ads Form"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Calendar size={14} className="text-gray-400" />
                          {formatDate(l.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <Badge className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50 w-fit text-[10px]">
                            {l.funnel?.name || "Sem Funil"}
                          </Badge>
                          <Badge variant="outline" className="w-fit text-[10px] text-gray-500">
                            {l.stage?.name || "Sem Etapa"}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {l.metadata && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100"
                              onClick={() => {
                                setSelectedLead(l);
                                setIsDetailsOpen(true);
                              }}
                            >
                              <Facebook size={14} className="mr-1" /> Ver Tudo
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                            onClick={() => window.open(`/leads/${l.id}`, "_blank")}
                          >
                            <ExternalLink size={16} />
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
        
        {/* Professional Footer / Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="bg-blue-600 p-3 rounded-2xl shadow-lg">
                <Database className="text-white" />
              </div>
              <div>
                <p className="text-sm text-blue-600 font-bold uppercase tracking-tight">Integridade de Dados</p>
                <h3 className="text-lg font-black text-blue-900 leading-tight">Sincronização Ativa</h3>
                <p className="text-sm text-blue-700/70">Todos os leads são capturados via Webhook e espelhados em tempo real.</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="bg-emerald-600 p-3 rounded-2xl shadow-lg">
                <RefreshCw className="text-white" />
              </div>
              <div>
                <p className="text-sm text-emerald-600 font-bold uppercase tracking-tight">Deduplicação</p>
                <h3 className="text-lg font-black text-emerald-900 leading-tight">Filtro Inteligente</h3>
                <p className="text-sm text-emerald-700/70">Leads duplicados são automaticamente bloqueados conforme sua configuração.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Lead Details Dialog (Lead Center Style) */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Facebook className="text-white h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl">Central de Dados: {selectedLead?.name}</DialogTitle>
                <DialogDescription>
                  Todos os dados capturados diretamente do formulário da Meta.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="py-6 space-y-6">
            {/* Header Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-xl border">
                <p className="text-[10px] text-gray-400 font-bold uppercase">ID do Lead (Meta)</p>
                <p className="text-sm font-mono text-gray-700">{selectedLead?.metadata?.fbLeadId}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border">
                <p className="text-[10px] text-gray-400 font-bold uppercase">Data de Entrada</p>
                <p className="text-sm text-gray-700">{selectedLead && formatDate(selectedLead.createdAt)}</p>
              </div>
            </div>

            {/* Custom Fields List */}
            <div className="space-y-4">
              <h4 className="font-black text-gray-900 text-sm uppercase tracking-wider flex items-center gap-2">
                <Database size={16} className="text-blue-600" /> Respostas do Formulário
              </h4>
              
              <div className="grid gap-3">
                {selectedLead?.metadata?.fields ? (
                  Object.entries(selectedLead.metadata.fields).map(([key, value]: [string, any]) => (
                    <div key={key} className="flex flex-col p-3 border rounded-xl hover:bg-gray-50 transition-colors">
                      <Label className="text-[10px] text-gray-400 uppercase font-bold mb-1">{key.replace(/_/g, ' ')}</Label>
                      <p className="text-gray-900 font-semibold">{String(value)}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400 italic">Nenhum dado extra disponível.</p>
                )}
              </div>
            </div>

            {/* Raw JSON Accordion (Optional for Tech Users) */}
            <div className="pt-4 border-t">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs text-gray-400 hover:text-gray-600"
                onClick={() => console.log(selectedLead?.metadata?.raw)}
              >
                Ver JSON Bruto no Console
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
