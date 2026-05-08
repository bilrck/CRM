"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Facebook, 
  RefreshCw, 
  TrendingUp, 
  DollarSign, 
  MousePointerClick, 
  Target, 
  BarChart as BarChartIcon,
  ChevronLeft
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  AreaChart, 
  Area 
} from "recharts";
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

export default function MetaInsightsPage() {
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("last_30d");
  const [report, setReport] = useState<any>(null);

  const fetchReport = async (selectedRange = range) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/meta/report?range=${selectedRange}`, { credentials: "include" });
      if (res.ok) setReport(await res.json());
    } catch (e: any) {
      toast.error("Erro ao carregar insights");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReport(); }, []);

  const fmtMoney = (n: number) => `R$ ${(n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  // Prepare data for charts (mocking a timeline from current campaigns for visualization)
  const timelineData = report?.campaigns?.slice(0, 7).map((c: any, i: number) => ({
    name: c.name.slice(0, 10),
    spend: parseFloat(c.insights?.spend || 0),
    leads: parseInt(c.insights?.actions?.find((a: any) => a.action_type === "lead")?.value || 0),
    clicks: parseInt(c.insights?.clicks || 0),
  })) || [];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => window.location.href = '/relatorios/meta'} className="p-2">
            <ChevronLeft size={24} />
          </Button>
          <div className="bg-blue-600 p-2 rounded-xl shadow-lg">
            <TrendingUp className="text-white h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Insights Avançados</h1>
            <p className="text-gray-500">Análise de tendências e performance detalhada</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={range} onValueChange={(val) => { setRange(val); fetchReport(val); }}>
            <SelectTrigger className="w-44 h-10 border-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_RANGES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => fetchReport()} disabled={loading} className="h-10 bg-blue-600">
            <RefreshCw size={16} className={`mr-2 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Spend vs Leads Chart */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign size={18} className="text-blue-600" /> Gasto vs. Leads por Campanha
            </CardTitle>
            <CardDescription>Comparativo de investimento e retorno por campanha</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px] pt-4">
            {loading ? (
              <div className="h-full flex items-center justify-center text-gray-400">Carregando dados...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                  <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', border: '1px solid hsl(var(--border))', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="spend" fill="var(--primary-chart)" radius={[4, 4, 0, 0]} name="Gasto (R$)" />
                  <Bar dataKey="leads" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="Leads" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* CTR Trend */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MousePointerClick size={18} className="text-orange-600" /> Tendência de Cliques
            </CardTitle>
            <CardDescription>Volume de cliques nas principais campanhas</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px] pt-4">
             {loading ? (
              <div className="h-full flex items-center justify-center text-gray-400">Carregando dados...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData}>
                  <defs>
                    <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-4))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--chart-4))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                  <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', border: '1px solid hsl(var(--border))' }}
                  />
                  <Area type="monotone" dataKey="clicks" stroke="hsl(var(--chart-4))" fillOpacity={1} fill="url(#colorClicks)" name="Cliques" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Efficiency KPIs */}
        <Card className="border-2 lg:col-span-2">
           <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target size={18} className="text-emerald-600" /> Eficiência de Conversão
            </CardTitle>
            <CardDescription>Custo por Lead (CPL) e métricas de conversão estimadas</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="p-6 bg-gray-50 rounded-2xl space-y-2">
                    <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">CPL Médio</p>
                    <p className="text-4xl font-black text-emerald-600">
                        {report?.totalLeads > 0 ? fmtMoney(report.totalSpend / report.totalLeads) : "R$ 0,00"}
                    </p>
                    <p className="text-xs text-gray-400">Investimento por lead capturado</p>
                </div>
                <div className="p-6 bg-gray-50 rounded-2xl space-y-2">
                    <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">CPC Médio</p>
                    <p className="text-4xl font-black text-blue-600">
                        {report?.totalClicks > 0 ? fmtMoney(report.totalSpend / report.totalClicks) : "R$ 0,00"}
                    </p>
                    <p className="text-xs text-gray-400">Custo médio por clique</p>
                </div>
                <div className="p-6 bg-gray-50 rounded-2xl space-y-2">
                    <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">CPM Médio</p>
                    <p className="text-4xl font-black text-purple-600">
                        {report?.totalImpressions > 0 ? fmtMoney((report.totalSpend / report.totalImpressions) * 1000) : "R$ 0,00"}
                    </p>
                    <p className="text-xs text-gray-400">Custo por mil impressões</p>
                </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
