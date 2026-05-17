"use client";
import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  Users,
  DollarSign,
  Activity
} from "lucide-react";
import { Card, CardHeader, CardDescription, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useWorkspace } from "@/app/api/userProvider";

interface StatusDistribution {
  name: string;
  value: number;
  color: string;
}

interface SourceData {
  name: string;
  count: number;
}

interface Lead {
  id: number;
  name: string;
  source: string | null;
  status: string;
  value: number;
}

interface DashboardStats {
  totalLeads: number;
  totalValue: number;
  statusDistribution: StatusDistribution[];
  sourceData: SourceData[];
  recentLeads: Lead[];
}

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export default function Dashboard() {
  const { currentWorkspace } = useWorkspace();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const headers: Record<string, string> = {};
        if (currentWorkspace?.id) {
          headers["x-workspace-id"] = currentWorkspace.id.toString();
        }

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/stats`, { 
          headers,
          credentials: 'include' 
        });
        
        const data = await res.json();
        
        if (!res.ok) {
          // If the API returns an error (e.g. 403 Subscription Expired), stop loading and don't set invalid stats
          toast.error(data.error || "Erro ao carregar dashboard");
          setStats(null);
          return;
        }

        setStats(data);
      } catch {
        toast.error("Erro ao carregar dashboard");
        setStats(null);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [currentWorkspace]);

  if (loading) return <div className="p-8 text-muted-foreground">Carregando métricas...</div>;
  if (!stats || !('totalValue' in stats)) return <div className="p-8 text-muted-foreground">Não foi possível carregar as métricas do Dashboard. Verifique sua assinatura.</div>;

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Métricas reais do seu sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-all rounded-2xl bg-card">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 font-semibold text-blue-600">
              <Users size={14} /> Total de Leads
            </CardDescription>
            <CardTitle className="text-3xl text-blue-600 font-bold">{stats.totalLeads}</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="text-xs text-muted-foreground font-medium">Desde o início</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-all rounded-2xl bg-card">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 font-semibold text-blue-600">
              <DollarSign size={14} /> Valor em Pipeline
            </CardDescription>
            <CardTitle className="text-3xl text-blue-600 font-bold">
              R$ {stats.totalValue.toLocaleString('pt-BR')}
            </CardTitle>
          </CardHeader>
          <CardContent>
             <div className="text-xs text-muted-foreground font-medium">Estimativa total no sistema</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-all rounded-2xl bg-card">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 font-semibold text-purple-600">
              <Activity size={14} /> Leads Convertidos
            </CardDescription>
            <CardTitle className="text-3xl text-purple-600 font-bold">
               {stats.statusDistribution.find((s) => s.name === 'Convertidos')?.value || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
             <div className="text-xs text-muted-foreground font-medium">Leads no estágio final</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-all rounded-2xl bg-card">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 font-semibold text-amber-600">
              <TrendingUp size={14} /> Taxa de Conversão
            </CardDescription>
            <CardTitle className="text-3xl text-amber-600 font-bold">
               {stats.totalLeads > 0 ? (((stats.statusDistribution.find((s) => s.name === 'Convertidos')?.value || 0) / stats.totalLeads) * 100).toFixed(1) : 0}%
            </CardTitle>
          </CardHeader>
          <CardContent>
             <div className="text-xs text-muted-foreground font-medium">Histórico global de fechamentos</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-foreground">Leads por Origem</CardTitle>
            <CardDescription>Visualização por canal de entrada</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.sourceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
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
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
                />
                <Bar dataKey="count" fill="var(--primary-chart)" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-foreground">Status da Base</CardTitle>
            <CardDescription>Distribuição de leads</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={stats.statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2 w-full">
                 {stats.statusDistribution.map((s, index) => (
                  <div key={s.name} className="flex justify-between items-center text-sm px-2 py-1 rounded-md hover:bg-muted/50 transition-colors">
                     <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}></div>
                        <span className="text-muted-foreground font-medium">{s.name}</span>
                     </div>
                     <span className="font-bold text-foreground">{s.value}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-foreground">Últimos Leads Registrados</CardTitle>
          <CardDescription>Acompanhamento em tempo real</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.recentLeads.map((lead) => (
              <div
                key={lead.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-border rounded-xl hover:bg-muted/30 transition-colors gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-bold shadow-sm">
                    {lead.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground tracking-tight">{lead.name}</div>
                    <div className="text-xs text-muted-foreground font-medium">{lead.source || "Direto"}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between w-full sm:w-auto gap-6 sm:justify-end">
                  <Badge variant="secondary" className="bg-muted text-muted-foreground hover:bg-muted border-transparent">
                    {lead.status === 'new' ? 'Novo' : lead.status}
                  </Badge>
                  <span className="font-bold text-foreground">
                    R$ {Number(lead.value || 0).toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
