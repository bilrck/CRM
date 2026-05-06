"use client";

import { useEffect, useState } from "react";
import { useUser } from "../../../api/userProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Copy, Plus, Trash2, ShieldCheck, FileText, Code, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ApiKeyData {
  id: number;
  name: string;
  key: string;
  isActive: boolean;
  createdAt: string;
}

export default function ApiSettingsPage() {
  const user = useUser();
  const [keys, setKeys] = useState<ApiKeyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState("");

  const fetchKeys = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/apikeys`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setKeys(data);
      }
    } catch {
      toast.error("Erro ao carregar chaves");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleCreateKey = async () => {
    if (!newKeyName) return toast.error("Dê um nome para a chave");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/apikeys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName, scopes: ["all"] }),
        credentials: "include",
      });
      if (res.ok) {
        toast.success("Chave gerada com sucesso!");
        setNewKeyName("");
        fetchKeys();
      }
    } catch {
      toast.error("Erro ao criar chave");
    }
  };

  const handleRevoke = async (id: number) => {
    if (!confirm("Deseja realmente revogar esta chave? ela parará de funcionar imediatamente.")) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/apikeys/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        toast.success("Chave revogada");
        fetchKeys();
      }
    } catch {
      toast.error("Erro ao revogar");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência");
  };

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Configurações de API</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Gerencie suas chaves de acesso para integração com sistemas externos e visualize a documentação.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Gestão de Chaves */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Chaves de Acesso</CardTitle>
                <CardDescription>Suas chaves Sk_live para integração via Header x-api-key.</CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Input 
                  placeholder="Nome (ex: Zapier)" 
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="w-full sm:w-48"
                />
                <Button onClick={handleCreateKey} className="w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" /> Nova Chave
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            <div className="overflow-x-auto">
              {loading ? (
                <p className="p-8 text-center text-muted-foreground">Carregando chaves...</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="min-w-[150px]">Nome</TableHead>
                      <TableHead className="min-w-[120px]">Chave</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="min-w-[120px]">Criado em</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {keys.map((key) => (
                      <TableRow key={key.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-medium text-foreground">{key.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 font-mono text-[10px] sm:text-xs">
                            {key.isActive ? `••••••••${key.key.slice(-4)}` : "REVOCADA"}
                            {key.isActive && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6" 
                                onClick={() => copyToClipboard(key.key)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={key.isActive ? "default" : "secondary"} className="text-[10px] px-1 h-5">
                            {key.isActive ? "Ativa" : "Inativa"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(key.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {key.isActive && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-red-500 hover:text-red-700 h-8 w-8" 
                              onClick={() => handleRevoke(key.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {keys.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-sm">
                          Nenhuma chave de API gerada.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Resumo/Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" /> Segurança
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-4 text-foreground">
            <p>
              Suas chaves de API dão acesso completo ao seu Workspace <strong>{user?.workspaceName}</strong>. 
            </p>
            <ul className="list-disc pl-4 space-y-2 text-muted-foreground">
              <li>Nunca compartilhe chaves secretas.</li>
              <li>Revogue chaves que não estão mais em uso.</li>
              <li>Utilize o Header <code className="bg-muted px-1.5 py-0.5 rounded text-foreground">x-api-key</code> em suas requisições.</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground">
            <FileText className="h-6 w-6 text-primary" /> Documentação da API
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Endpoint Leads */}
              <Card>
                  <CardHeader>
                    <Badge className="w-fit mb-2">v1</Badge>
                    <CardTitle className="text-lg">Gerenciamento de Leads</CardTitle>
                    <CardDescription>Envie ou busque leads externamente.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <p className="text-sm font-semibold">GET /leads</p>
                        <div className="bg-slate-950 text-slate-100 p-3 rounded-md text-xs font-mono">
                            curl -H &quot;x-api-key: SUA_CHAVE&quot; {process.env.NEXT_PUBLIC_API_URL}/api/v1/leads
                        </div>
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm font-semibold">POST /leads</p>
                        <div className="bg-slate-950 text-slate-100 p-3 rounded-md text-xs font-mono">
                            curl -X POST -H &quot;Content-Type: application/json&quot; \<br/>
                            -H &quot;x-api-key: SUA_CHAVE&quot; \<br/>
                            -d &apos;{"{"}&quot;name&quot;: &quot;Nome&quot;, &quot;phone&quot;: &quot;5511...&quot;, &quot;email&quot;: &quot;test@mail.com&quot;{"}"}&apos; \<br/>
                            {process.env.NEXT_PUBLIC_API_URL}/api/v1/leads
                        </div>
                    </div>
                  </CardContent>
              </Card>

              {/* Endpoint Contexto */}
              <Card>
                  <CardHeader>
                    <Badge className="w-fit mb-2">v1</Badge>
                    <CardTitle className="text-lg">Workspace Me</CardTitle>
                    <CardDescription>Verifique o contexto da chave.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">Utilize este endpoint para validar se sua chave está ativa e a qual workspace ela pertence.</p>
                    <div className="bg-slate-950 text-slate-100 p-3 rounded-md text-xs font-mono">
                        GET /workspaces/me<br/>
                        Response: {"{"} &quot;id&quot;: 1, &quot;name&quot;: &quot;Workspace Name&quot; {"}"}
                    </div>
                  </CardContent>
              </Card>



              {/* Endpoint Conversas */}
              <Card>
                  <CardHeader>
                    <Badge className="w-fit mb-2">v1</Badge>
                    <CardTitle className="text-lg">Conversas & Mensagens</CardTitle>
                    <CardDescription>Extraia dados ou envie mensagens.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <p className="text-sm font-semibold">GET /conversations</p>
                        <div className="bg-slate-950 text-slate-100 p-3 rounded-md text-xs font-mono text-emerald-400">
                            curl -H &quot;x-api-key: KEY&quot; {process.env.NEXT_PUBLIC_API_URL}/api/v1/conversations
                        </div>
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm font-semibold">POST /messages/send</p>
                        <div className="bg-slate-950 text-slate-100 p-3 rounded-md text-xs font-mono">
                            curl -X POST -H &quot;Content-Type: application/json&quot; -H &quot;x-api-key: KEY&quot; \<br/>
                            -d &apos;{"{"}&quot;phone&quot;: &quot;5511...&quot;, &quot;body&quot;: &quot;Olá!&quot;{"}"}&apos; \<br/>
                            {process.env.NEXT_PUBLIC_API_URL}/api/v1/messages/send
                        </div>
                    </div>
                  </CardContent>
              </Card>

              {/* Endpoint Funis */}
              <Card>
                  <CardHeader>
                    <Badge className="w-fit mb-2">v1</Badge>
                    <CardTitle className="text-lg">Funis</CardTitle>
                    <CardDescription>Liste seus funis e etapas.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <p className="text-sm font-semibold">GET /funnels</p>
                        <div className="bg-slate-950 text-slate-100 p-3 rounded-md text-xs font-mono text-emerald-400">
                            curl -H &quot;x-api-key: KEY&quot; {process.env.NEXT_PUBLIC_API_URL}/api/v1/funnels
                        </div>
                    </div>
                  </CardContent>
              </Card>

              {/* Snippet Exemplo Node.js */}
              <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Code className="h-5 w-5" /> Exemplo de Integração (Node.js)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-slate-950 text-slate-100 p-4 rounded-md text-xs overflow-x-auto">
{`const axios = require('axios');

async function getLeads() {
  const response = await axios.get('https://api.seusistema.com/api/v1/leads', {
    headers: { 'x-api-key': 'SUA_CHAVE_AQUI' }
  });
  console.log(response.data);
}

getLeads();`}
                    </pre>
                  </CardContent>
              </Card>
          </div>

          {/* Link para documentação completa */}
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 mt-6 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <FileText className="h-5 w-5" /> Documentação Completa da API
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-foreground/80">
                  Para uma documentação detalhada com todos os endpoints CRUD (Create, Read, Update, Delete), 
                  parâmetros completos, tratamento de erros e exemplos em múltiplas linguagens, acesse nossa documentação completa.
                </p>
                <div className="flex gap-3">
                  <Button 
                    onClick={() => window.location.href = '/api-docs'} 
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <FileText className="h-4 w-4 mr-2" /> Ver Documentação Completa
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => window.open('/api-docs', '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" /> Abrir em Nova Aba
                  </Button>
                </div>
              </CardContent>
          </Card>
      </div>

    </div>
  );
}
