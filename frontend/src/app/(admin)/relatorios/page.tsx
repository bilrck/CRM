"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, DollarSign, Users, Target, Calendar, Loader2, Facebook } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useCallback } from "react";
import { useWorkspace } from "@/app/api/userProvider";

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
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [period, setPeriod] = useState('30d');

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (currentWorkspace?.id) {
        headers["x-workspace-id"] = currentWorkspace.id.toString();
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/dashboard?period=${period}`, {
        headers,
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  }, [period, currentWorkspace]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

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
    <div className="p-4 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl text-foreground mb-2 font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Análises detalhadas do seu desempenho</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button 
            variant={period === '7d' ? 'default' : 'outline'}
            onClick={() => setPeriod('7d')}
            className="flex-1 sm:flex-none"
          >
            <Calendar size={18} className="mr-2" />
            <span className="whitespace-nowrap">7 dias</span>
          </Button>
          <Button 
            variant={period === '30d' ? 'default' : 'outline'}
            onClick={() => setPeriod('30d')}
            className="flex-1 sm:flex-none"
          >
            <Calendar size={18} className="mr-2" />
            <span className="whitespace-nowrap">30 dias</span>
          </Button>
        </div>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-primary bg-card transition-all hover:shadow-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-muted-foreground">Total de Leads</CardDescription>
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
              <CardDescription className="text-muted-foreground">Taxa de Conversão</CardDescription>
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
              <CardDescription className="text-muted-foreground">Receita Estimada</CardDescription>
              <DollarSign className="text-primary/50" size={20} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-foreground mb-1 font-bold">{stats.kpis.totalRevenue}</div>
            <p className="text-sm text-primary/50">Baseado em conversões</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary/30 bg-card transition-all hover:shadow-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-muted-foreground">Ticket Médio</CardDescription>
              <TrendingUp className="text-primary/40" size={20} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-foreground mb-1 font-bold">{stats.kpis.ticketMedio}</div>
            <p className="text-sm text-primary/40">Por conversão</p>
          </CardContent>
        </Card>
      </div>

      {/* Atalho para Relatórios Específicos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

      {/* Performance por Origem */}
      {stats.sources && stats.sources.length > 0 && (
        <Card>
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
              {period === '7d' ? 'Últimos 7 dias' : 'Últimos 30 dias'}
            </div>
            <p className="text-sm text-muted-foreground">{stats.kpis.totalLeads} leads capturados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-primary/60 font-bold mb-2">
              {stats.kpis.totalLeads > 0 ? 'Ativo' : 'Aguardando'}
            </div>
            <p className="text-sm text-muted-foreground">
              {stats.kpis.totalLeads > 0 ? 'Sistema operacional' : 'Aguardando primeiros leads'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
