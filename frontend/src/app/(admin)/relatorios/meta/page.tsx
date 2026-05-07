"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Facebook, RefreshCw, TrendingUp, DollarSign, MousePointerClick, Eye, Users, FileText, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const API = process.env.NEXT_PUBLIC_API_URL;

const DATE_RANGES = [
  { value: "today", label: "Hoje" },
  { value: "yesterday", label: "Ontem" },
  { value: "last_7d", label: "Últimos 7 dias" },
  { value: "last_30d", label: "Últimos 30 dias" },
  { value: "this_month", label: "Este mês" },
  { value: "last_month", label: "Mês passado" },
];

function StatCard({ icon: Icon, label, value, sub, color = "blue" }: any) {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
  };
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">{label}</p>
            <p className="text-3xl font-black text-gray-900 mt-1">{value}</p>
            {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
          </div>
          <div className={`p-3 rounded-xl ${colors[color]}`}>
            <Icon size={22} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MetaReportPage() {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [range, setRange] = useState("last_30d");
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async (selectedRange = range) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/meta/report?range=${selectedRange}`, { credentials: "include" });
      if (res.status === 404) {
        setError("Nenhuma conta Meta conectada. Conecte sua conta em Conexões > Meta.");
        return;
      }
      if (!res.ok) throw new Error("Erro ao carregar relatório");
      setReport(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const syncData = async () => {
    setSyncing(true);
    try {
      const res = await fetch(`${API}/meta/sync`, { method: "POST", credentials: "include" });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Sincronizado: ${data.syncedPages} páginas, ${data.syncedForms} formulários`);
        fetchReport();
      } else {
        toast.error(data.error || "Erro ao sincronizar");
      }
    } catch {
      toast.error("Erro de conexão ao sincronizar");
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => { fetchReport(); }, []);

  const handleRangeChange = (val: string) => {
    setRange(val);
    fetchReport(val);
  };

  const fmt = (n: number) => n?.toLocaleString("pt-BR") ?? "0";
  const fmtMoney = (n: number) => `R$ ${(n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  const ctr = report?.totalImpressions > 0
    ? ((report.totalClicks / report.totalImpressions) * 100).toFixed(2) + "%"
    : "0%";

  if (error) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-blue-600 p-3 rounded-xl"><Facebook className="text-white h-7 w-7" /></div>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Relatório Meta Ads</h1>
            <p className="text-gray-500">Performance de campanhas e leads</p>
          </div>
        </div>
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
            <h3 className="text-xl font-bold text-amber-800 mb-2">Conta não conectada</h3>
            <p className="text-amber-700 max-w-md">{error}</p>
            <Button className="mt-6 bg-blue-600" onClick={() => window.location.href = "/conexoes/meta"}>
              Conectar Conta Meta
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-600 to-blue-400 p-3 rounded-2xl shadow-lg shadow-blue-200">
            <Facebook className="text-white h-7 w-7" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Relatório Meta Ads</h1>
            <p className="text-gray-500">
              {report?.connectionName && <span className="font-medium text-blue-600">{report.connectionName}</span>}
              {" · "}Performance de campanhas e leads
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={range} onValueChange={handleRangeChange}>
            <SelectTrigger className="w-44 h-10 border-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_RANGES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={syncData} disabled={syncing} className="h-10 border-2">
            <RefreshCw size={16} className={`mr-2 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Sincronizando..." : "Sincronizar"}
          </Button>
          <Button onClick={() => fetchReport()} disabled={loading} className="h-10 bg-blue-600">
            <RefreshCw size={16} className={`mr-2 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Gasto Total" value={loading ? "..." : fmtMoney(report?.totalSpend)} sub={DATE_RANGES.find(r => r.value === range)?.label} color="blue" />
        <StatCard icon={Eye} label="Impressões" value={loading ? "..." : fmt(report?.totalImpressions)} color="purple" />
        <StatCard icon={MousePointerClick} label="Cliques" value={loading ? "..." : fmt(report?.totalClicks)} sub={`CTR: ${loading ? "..." : ctr}`} color="orange" />
        <StatCard icon={Users} label="Leads (Meta)" value={loading ? "..." : fmt(report?.totalLeads)} color="green" />
      </div>

      {/* Campaigns Table */}
      <Card className="border-2">
        <CardHeader className="border-b bg-gray-50/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><TrendingUp size={18} className="text-blue-600" /> Campanhas</CardTitle>
              <CardDescription>{report?.campaigns?.length ?? 0} campanhas encontradas</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center text-gray-400">Carregando campanhas...</div>
          ) : !report?.campaigns?.length ? (
            <div className="py-16 text-center space-y-2">
              <TrendingUp className="h-10 w-10 text-gray-300 mx-auto" />
              <p className="text-gray-400">Nenhuma campanha encontrada para o período</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-100/60 text-[11px] uppercase font-bold text-gray-500 border-b">
                    <th className="px-5 py-3">Campanha</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Objetivo</th>
                    <th className="px-5 py-3 text-right">Gasto</th>
                    <th className="px-5 py-3 text-right">Impressões</th>
                    <th className="px-5 py-3 text-right">Cliques</th>
                    <th className="px-5 py-3 text-right">CTR</th>
                    <th className="px-5 py-3 text-right">Leads</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {report.campaigns.map((c: any) => {
                    const ins = c.insights;
                    const campaignCtr = ins?.impressions > 0
                      ? ((ins.clicks / ins.impressions) * 100).toFixed(2) + "%"
                      : "—";
                    const leads = ins?.actions?.find((a: any) => a.action_type === "lead")?.value ?? "—";
                    return (
                      <tr key={c.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-5 py-4">
                          <div className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">{c.name}</div>
                          <div className="text-[10px] text-gray-400">{c.adAccountName}</div>
                        </td>
                        <td className="px-5 py-4">
                          <Badge className={c.status === "ACTIVE" ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-600"}>
                            {c.status}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 text-xs text-gray-500">{c.objective ?? "—"}</td>
                        <td className="px-5 py-4 text-right font-semibold text-gray-800">{ins ? fmtMoney(parseFloat(ins.spend || 0)) : "—"}</td>
                        <td className="px-5 py-4 text-right text-gray-600">{ins ? fmt(parseInt(ins.impressions || 0)) : "—"}</td>
                        <td className="px-5 py-4 text-right text-gray-600">{ins ? fmt(parseInt(ins.clicks || 0)) : "—"}</td>
                        <td className="px-5 py-4 text-right text-gray-600">{ins ? campaignCtr : "—"}</td>
                        <td className="px-5 py-4 text-right font-semibold text-blue-600">{leads}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pages & Forms */}
      <Card className="border-2">
        <CardHeader className="border-b bg-gray-50/50">
          <CardTitle className="flex items-center gap-2"><FileText size={18} className="text-blue-600" /> Páginas & Formulários</CardTitle>
          <CardDescription>Leads capturados por formulário de Lead Ads</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-gray-400">Carregando...</div>
          ) : !report?.pages?.length ? (
            <div className="py-12 text-center text-gray-400">Nenhuma página encontrada</div>
          ) : (
            <div className="divide-y">
              {report.pages.map((page: any) => (
                <div key={page.id} className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {page.pictureUrl
                        ? <img src={page.pictureUrl} className="w-9 h-9 rounded-lg object-cover border" alt={page.name} />
                        : <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold text-sm">{page.name.charAt(0)}</div>
                      }
                      <div>
                        <div className="font-bold text-gray-800">{page.name}</div>
                        <div className="text-xs text-gray-400">{page.category}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-blue-600">{page.totalLeads} leads totais</span>
                      <Badge variant={page.isConnected ? "default" : "secondary"} className={page.isConnected ? "bg-emerald-500" : ""}>
                        {page.isConnected ? "Sincronizado" : "Pausado"}
                      </Badge>
                    </div>
                  </div>
                  {page.forms?.length > 0 && (
                    <div className="ml-12 space-y-1">
                      {page.forms.map((f: any) => (
                        <div key={f.id} className="flex items-center justify-between text-sm py-1.5 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <span className="text-gray-700">{f.name}</span>
                          <div className="flex items-center gap-3">
                            <Badge variant={f.status === "ACTIVE" ? "outline" : "secondary"} className={f.status === "ACTIVE" ? "border-emerald-200 text-emerald-700 text-[10px]" : "text-[10px]"}>
                              {f.status}
                            </Badge>
                            <span className="font-bold text-blue-600">{f.leadCount} leads</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {!page.forms?.length && (
                    <p className="ml-12 text-xs text-gray-400 italic">Nenhum formulário mapeado. Ative a sincronização na página de Conexões.</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ad Accounts Summary */}
      {report?.adAccounts?.length > 0 && (
        <Card className="border-2">
          <CardHeader className="border-b bg-gray-50/50">
            <CardTitle className="flex items-center gap-2"><DollarSign size={18} className="text-blue-600" /> Contas de Anúncios</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-100/60 text-[11px] uppercase font-bold text-gray-500 border-b">
                    <th className="px-5 py-3">Conta</th>
                    <th className="px-5 py-3">ID</th>
                    <th className="px-5 py-3">Moeda</th>
                    <th className="px-5 py-3 text-right">Gasto Total (Vitalício)</th>
                    <th className="px-5 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {report.adAccounts.map((acc: any) => (
                    <tr key={acc.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-4 font-semibold text-gray-800">{acc.name}</td>
                      <td className="px-5 py-4 text-xs text-gray-400 font-mono">{acc.account_id}</td>
                      <td className="px-5 py-4 text-gray-600">{acc.currency}</td>
                      <td className="px-5 py-4 text-right font-bold text-gray-800">
                        {acc.amount_spent ? fmtMoney(parseFloat(acc.amount_spent) / 100) : "—"}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Badge className={acc.account_status === 1 ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-600"}>
                          {acc.account_status === 1 ? "Ativo" : "Inativo"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
