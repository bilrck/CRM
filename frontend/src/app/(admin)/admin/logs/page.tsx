"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RefreshCw, ShieldAlert, Activity, Users, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface Log {
  id: number;
  level: string;
  category: string;
  message: string;
  data: Record<string, unknown> | null;
  createdAt: string;
  user?: { name: string; email: string };
  workspace?: { name: string };
}

export default function LogsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>("all");
  const [level, setLevel] = useState<string>("all");
  const [total, setTotal] = useState(0);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category !== "all") params.append("category", category);
      if (level !== "all") params.append("level", level);
      params.append("limit", "50");

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/logs?${params.toString()}`, {
          credentials: 'include'
      });
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao carregar logs");
      }
      
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Erro ao carregar logs");
    } finally {
      setLoading(false);
    }
  }, [category, level]);

  useEffect(() => {
    if (user?.role === "ADMIN") {
      fetchLogs();
    }
  }, [user, fetchLogs]);

  if (user?.role !== "ADMIN") {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center space-y-4">
          <ShieldAlert className="h-12 w-12 text-red-500 mx-auto" />
          <h1 className="text-2xl font-bold">Acesso Negado</h1>
          <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    );
  }

  const getLevelBadge = (level: string) => {
    switch (level) {
      case "ERROR": return <Badge variant="destructive">ERRO</Badge>;
      case "WARN": return <Badge className="bg-amber-500 hover:bg-amber-600">AVISO</Badge>;
      default: return <Badge variant="secondary">INFO</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "WHATSAPP": return <MessageSquare className="h-4 w-4 mr-2 text-emerald-500" />;
      case "LEAD": return <Users className="h-4 w-4 mr-2 text-blue-500" />;
      case "AUTH": return <ShieldAlert className="h-4 w-4 mr-2 text-purple-500" />;
      default: return <Activity className="h-4 w-4 mr-2 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Logs do Sistema</h1>
          <p className="text-muted-foreground">
            Monitore a atividade do sistema e comunicações em tempo real.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Eventos</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
            <p className="text-xs text-muted-foreground">Registros armazenados</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros de Auditoria</CardTitle>
          <CardDescription>Refine a busca para encontrar eventos específicos.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="w-full md:w-[200px] space-y-1.5">
              <label className="text-xs font-medium uppercase text-muted-foreground">Categoria</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                  <SelectItem value="LEAD">Leads</SelectItem>
                  <SelectItem value="AUTH">Autenticação</SelectItem>
                  <SelectItem value="SYSTEM">Sistema</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-[200px] space-y-1.5">
              <label className="text-xs font-medium uppercase text-muted-foreground">Nivel</label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Nivel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="INFO">Informação</SelectItem>
                  <SelectItem value="WARN">Aviso</SelectItem>
                  <SelectItem value="ERROR">Erro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Data/Hora</TableHead>
                <TableHead className="w-[120px]">Nível</TableHead>
                <TableHead className="w-[150px]">Categoria</TableHead>
                <TableHead>Mensagem</TableHead>
                <TableHead className="w-[150px]">Usuário</TableHead>
                <TableHead className="w-[150px]">Workspace</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Carregando logs...
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Nenhum log encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} className="group hover:bg-muted/50 transition-colors">
                    <TableCell className="font-mono text-xs">
                      {new Intl.DateTimeFormat('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      }).format(new Date(log.createdAt))}
                    </TableCell>
                    <TableCell>{getLevelBadge(log.level)}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {getCategoryIcon(log.category)}
                        <span className="text-xs font-medium">{log.category}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[400px]">
                        <div className="font-medium">{log.message}</div>
                        {log.data && (
                            <details className="mt-1 text-[10px] text-muted-foreground cursor-pointer">
                                <summary className="hover:text-primary">Ver dados brutos</summary>
                                <pre className="mt-2 p-2 bg-muted rounded overflow-x-auto">
                                    {JSON.stringify(log.data, null, 2)}
                                </pre>
                            </details>
                        )}
                    </TableCell>
                    <TableCell className="text-xs">
                      {log.user?.name || "Sistema"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {log.workspace?.name || "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
