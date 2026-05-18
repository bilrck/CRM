"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, DollarSign, Users, Target, Calendar, Loader2, Facebook, Printer, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useCallback } from "react";
import { useWorkspace, useSystemConfig } from "@/app/api/userProvider";

interface DashboardStats {
  kpis: {
    totalLeads: number;
    conversionRate: string;
    totalRevenue: string;
    ticketMedio: string;
  };
  sources: Array<{ source: string; leads: number }>;
  timeline: Array<{
    month: string;
    leads: number;
    conversoes: number;
    receita: number;
  }>;
}

export default function Relatorios() {
  const { currentWorkspace } = useWorkspace();
  const { modules } = useSystemConfig();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  
  // Filter States
  const [period, setPeriod] = useState('30d');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [source, setSource] = useState('all');
  const [availableSources, setAvailableSources] = useState<string[]>([]);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (currentWorkspace?.id) {
        headers["x-workspace-id"] = currentWorkspace.id.toString();
      }

      let url = `${process.env.NEXT_PUBLIC_API_URL}/reports/dashboard?period=${period}`;
      if (period === 'custom') {
        url = `${process.env.NEXT_PUBLIC_API_URL}/reports/dashboard?period=custom&startDate=${startDate}&endDate=${endDate}`;
      }
      if (source && source !== 'all') {
        url += `&source=${encodeURIComponent(source)}`;
      }

      const res = await fetch(url, {
        headers,
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);

        // Collect unique sources to populate filter dropdown dynamically
        if (data.sources) {
          const fetchedSources = data.sources.map((s: any) => s.source);
          setAvailableSources(prev => {
            const merged = new Set([...prev, ...fetchedSources]);
            return Array.from(merged);
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  }, [period, startDate, endDate, source, currentWorkspace]);

  useEffect(() => {
    // Auto-fetch when period (unless custom and missing dates) or source changes
    if (period === 'custom' && (!startDate || !endDate)) {
      return;
    }
    fetchStats();
  }, [period, source, currentWorkspace]);

  const handleApplyCustomDates = (e: React.FormEvent) => {
    e.preventDefault();
    if (startDate && endDate) {
      fetchStats();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Erro ao carregar relatórios. Tente novamente.</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 print:p-0">
      {/* CSS customizado para garantir impressão perfeita */}
      <style jsx global>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          aside, nav, header, button, .print-hidden, [role="button"], [data-sidebar="sidebar-wrapper"] {
            display: none !important;
          }
          main, .print\\:p-0 {
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .card {
            border: 1px solid #e2e8f0 !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      {/* Header com Ações */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 print-hidden">
        <div>
          <h1 className="text-2xl sm:text-3xl text-foreground mb-2 font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Análises detalhadas do seu desempenho em tempo real</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button 
            variant="outline" 
            onClick={handlePrint}
            className="flex-1 sm:flex-none border-primary text-primary hover:bg-primary/10"
          >
            <Printer size={18} className="mr-2" />
            Imprimir Relatório
          </Button>
        </div>
      </div>

      {/* Barra de Filtros Premium */}
      <Card className="print-hidden border-border/50 shadow-sm bg-card/60 backdrop-blur-md">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            {/* Seletor de Período */}
            <div className="flex-1 space-y-1.5 w-full">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Período</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="7d">Últimos 7 dias</option>
                <option value="30d">Últimos 30 dias</option>
                <option value="90d">Últimos 90 dias</option>
                <option value="custom">Período Personalizado</option>
              </select>
            </div>

            {/* Seletor de Origem */}
            <div className="flex-1 space-y-1.5 w-full">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Origem/Fonte</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">Todas as origens</option>
                {availableSources.map((src) => (
                  <option key={src} value={src}>{src}</option>
                ))}
              </select>
            </div>

            {/* Custom Dates Inputs */}
            {period === 'custom' && (
              <form onSubmit={handleApplyCustomDates} className="flex flex-col sm:flex-row gap-4 w-full md:w-auto items-end">
                <div className="space-y-1.5 w-full sm:w-auto">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">De</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1.5 w-full sm:w-auto">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Até</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <Button type="submit" variant="default" className="w-full sm:w-auto">
                  <Filter size={16} className="mr-2" />
                  Filtrar
                </Button>
              </form>
            )}
          </div>
        </CardContent>
      </Card>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-primary bg-card transition-all hover:shadow-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-muted-foreground font-semibold">Total de Leads</CardDescription>
              <Users className="text-primary" size={20} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-foreground mb-1 font-bold">{stats.kpis.totalLeads}</div>
            <p className="text-sm text-primary/80">Período selecionado</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary/60 bg-card transition-all hover:shadow-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-muted-foreground font-semibold">Taxa de Conversão</CardDescription>
              <Target className="text-primary/70" size={20} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-foreground mb-1 font-bold">{stats.kpis.conversionRate}</div>
            <p className="text-sm text-primary/70">Leads fechados</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary/40 bg-card transition-all hover:shadow-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-muted-foreground font-semibold">Receita Real</CardDescription>
              <DollarSign className="text-primary/50" size={20} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-foreground mb-1 font-bold">{stats.kpis.totalRevenue}</div>
            <p className="text-sm text-primary/50">Baseado em conversões reais</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary/30 bg-card transition-all hover:shadow-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-muted-foreground font-semibold">Ticket Médio Real</CardDescription>
              <TrendingUp className="text-primary/40" size={20} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-foreground mb-1 font-bold">{stats.kpis.ticketMedio}</div>
            <p className="text-sm text-primary/40">Por conversão real</p>
          </CardContent>
        </Card>
      </div>

      {/* Atalho para Relatórios Específicos */}
      {modules.meta && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print-hidden">
          <Card 
            className="cursor-pointer hover:border-blue-500 transition-all border-2 border-transparent bg-gradient-to-br from-blue-50 to-white"
            onClick={() => window.location.href = '/relatorios/meta'}
          >
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Facebook className="text-white" size={24} />
              </div>
              <div>
                <CardTitle>Relatório Meta Ads</CardTitle>
                <CardDescription>Performance de campanhas, gastos e leads</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-blue-600 font-semibold text-sm">
                Ver relatório detalhado <TrendingUp size={16} className="ml-2" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Performance por Origem */}
      {stats.sources && stats.sources.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Performance por Origem de Tráfego</CardTitle>
            <CardDescription>Distribuição de leads por fonte</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.sources} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" hide />
                <YAxis dataKey="source" type="category" width={120} stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    borderRadius: '12px', 
                    border: '1px solid hsl(var(--border))', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    color: 'hsl(var(--foreground))',
                    backdropFilter: 'blur(8px)'
                  }}
                  itemStyle={{ color: 'var(--primary-chart)', fontWeight: 'bold' }}
                />
                <Legend />
                <Bar dataKey="leads" fill="var(--primary-chart)" name="Leads" radius={[0, 8, 8, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Linha do Tempo e Evolução */}
      {stats.timeline && stats.timeline.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Evolução de Leads e Conversões</CardTitle>
            <CardDescription>Acompanhe seu desempenho ao longo do tempo</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    borderRadius: '12px', 
                    border: '1px solid hsl(var(--border))', 
                    color: 'hsl(var(--foreground))',
                  }}
                />
                <Legend />
                <Bar dataKey="leads" fill="hsl(var(--primary))" name="Leads" radius={[4, 4, 0, 0]} />
                <Bar dataKey="conversoes" fill="var(--primary-chart)" name="Conversões" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Resumo Executivo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Melhor Fonte de Leads</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.sources && stats.sources.length > 0 ? (
              <>
                <div className="text-2xl text-primary font-bold mb-2">
                  {stats.sources[0]?.source || 'N/A'}
                </div>
                <p className="text-sm text-muted-foreground">
                  {stats.sources[0]?.leads || 0} leads no período
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-500">Sem dados disponíveis</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Período Analisado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-primary/80 font-bold mb-2">
              {period === '7d' ? 'Últimos 7 dias' : period === '90d' ? 'Últimos 90 dias' : period === 'custom' ? 'Personalizado' : 'Últimos 30 dias'}
            </div>
            <p className="text-sm text-muted-foreground">{stats.kpis.totalLeads} leads filtrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status dos Dados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-primary/60 font-bold mb-2">
              {stats.kpis.totalLeads > 0 ? 'Dados Reais' : 'Aguardando'}
            </div>
            <p className="text-sm text-muted-foreground">
              {stats.kpis.totalLeads > 0 ? 'Métricas 100% precisas' : 'Nenhum lead encontrado'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
