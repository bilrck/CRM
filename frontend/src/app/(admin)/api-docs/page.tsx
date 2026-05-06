"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Book, Code, Shield, AlertCircle, Zap, Database, KeyRound, Clock, BarChart3, Users, Layout } from "lucide-react";

interface Param {
  name: string;
  type: string;
  required?: boolean;
  description?: string;
}

interface EndpointCardProps {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  description: string;
  queryParams?: Param[];
  bodyParams?: Param[];
  example?: string;
  response?: string;
}

function EndpointCard({ method, path, description, queryParams, bodyParams, example, response }: EndpointCardProps) {
  const methodColor = {
    GET: "bg-blue-50 text-blue-700 border-blue-200",
    POST: "bg-green-50 text-green-700 border-green-200",
    PUT: "bg-amber-50 text-amber-700 border-amber-200",
    DELETE: "bg-red-50 text-red-700 border-red-200",
  }[method];

  return (
    <Card className="overflow-hidden border-border bg-card">
      <div className="p-4 bg-muted/50 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge className={`${methodColor} font-bold px-3`}>{method}</Badge>
          <code className="text-sm font-semibold text-foreground">{path}</code>
        </div>
        <span className="text-xs text-muted-foreground">{description}</span>
      </div>
      <CardContent className="p-0">
        <Tabs defaultValue="params" className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent px-4">
            {(queryParams || bodyParams) && <TabsTrigger value="params" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none shadow-none text-muted-foreground data-[state=active]:text-foreground">Parâmetros</TabsTrigger>}
            {example && <TabsTrigger value="example" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none shadow-none text-muted-foreground data-[state=active]:text-foreground">Exemplo JSON</TabsTrigger>}
            {response && <TabsTrigger value="response" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none shadow-none text-muted-foreground data-[state=active]:text-foreground">Resposta</TabsTrigger>}
            <TabsTrigger value="curl" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none shadow-none text-muted-foreground data-[state=active]:text-foreground">cURL</TabsTrigger>
          </TabsList>
          
          <div className="p-4">
            <TabsContent value="params" className="m-0">
              <div className="space-y-4">
                {queryParams && (
                  <div>
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Query Parameters</h4>
                    <div className="grid gap-2">
                      {queryParams.map(p => (
                        <div key={p.name} className="flex items-start gap-2 text-sm border-l-2 border-primary/30 pl-3 py-1">
                          <code className="text-primary font-bold">{p.name}</code>
                          <span className="text-muted-foreground text-xs mt-0.5">({p.type})</span>
                          <span className="text-muted-foreground ml-2">{p.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {bodyParams && (
                  <div>
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Body Parameters (JSON)</h4>
                    <div className="grid gap-2">
                      {bodyParams.map(p => (
                        <div key={p.name} className="flex items-start gap-2 text-sm border-l-2 border-primary/30 pl-3 py-1">
                          <code className="text-primary font-bold">{p.name}</code>
                          {p.required && <Badge variant="outline" className="text-[10px] h-4 bg-destructive/10 text-destructive border-transparent">Obrigatório</Badge>}
                          <span className="text-muted-foreground text-xs mt-0.5">({p.type})</span>
                          <span className="text-muted-foreground ml-2">{p.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {!queryParams && !bodyParams && <p className="text-sm text-muted-foreground italic">Nenhum parâmetro necessário.</p>}
              </div>
            </TabsContent>

            {example && (
              <TabsContent value="example" className="m-0">
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-xs font-mono overflow-auto max-h-60">
                  {example}
                </pre>
              </TabsContent>
            )}

            {response && (
              <TabsContent value="response" className="m-0">
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-xs font-mono overflow-auto max-h-60">
                  {response}
                </pre>
              </TabsContent>
            )}

            <TabsContent value="curl" className="m-0">
              <pre className="bg-slate-950 text-slate-100 p-4 rounded-lg text-xs font-mono overflow-auto">
{`curl -X ${method} "https://api.rastreia.ai${path}" \\
  -H "x-api-key: SUA_CHAVE" \\
  ${method !== 'GET' ? '-H "Content-Type: application/json" \\\n  -d \'' + (example || '{}') + '\'' : ''}`}
              </pre>
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default function ApiDocsPage() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-12 pb-24">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-xl">
            <Code className="text-primary-foreground h-8 w-8" />
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight text-foreground">Documentação da API</h1>
        </div>
        <p className="text-muted-foreground text-xl max-w-2xl">
          Conecte seu CRM a qualquer plataforma. Automatize seus leads, funis e equipe via HTTP.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-foreground"><KeyRound size={16} className="text-primary" /> Autenticação</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-xs text-muted-foreground">Use o header <code className="bg-background border border-border px-1 rounded text-foreground">x-api-key</code> em todas as chamadas.</p>
            </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-foreground"><Zap size={16} className="text-primary" /> Base URL</CardTitle>
            </CardHeader>
            <CardContent>
                <code className="text-xs bg-background border border-border px-1 rounded text-foreground">{baseUrl}/api/v1</code>
            </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-foreground"><Clock size={16} className="text-primary" /> Rate Limit</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-xs text-muted-foreground">100 requisições por minuto por workspace.</p>
            </CardContent>
        </Card>
      </div>

      {/* Leads Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border pb-4">
            <Database className="text-primary h-6 w-6" />
            <h2 className="text-2xl font-bold text-foreground">Leads</h2>
        </div>
        <div className="grid gap-6">
            <EndpointCard 
                method="GET" 
                path="/api/v1/leads" 
                description="Retorna lista paginada de leads"
                queryParams={[
                    { name: "limit", type: "number", description: "Padrão 10" },
                    { name: "offset", type: "number", description: "Pulo para paginação" }
                ]}
                response={`{
  "data": [
    { "id": 1, "name": "Lead Exemplo", "phone": "5511...", "status": "new" }
  ],
  "meta": { "total": 1, "limit": 10, "offset": 0 }
}`}
            />
            <EndpointCard 
                method="POST" 
                path="/api/v1/leads" 
                description="Insere um Lead no workspace"
                bodyParams={[
                    { name: "name", type: "string", required: true },
                    { name: "phone", type: "string" },
                    { name: "email", type: "string" },
                    { name: "funnelId", type: "number" },
                    { name: "stageId", type: "number" },
                    { name: "tags", type: "string[]" }
                ]}
                example={`{
  "name": "João da Silva",
  "phone": "5511999999999",
  "tags": ["site", "orgânico"]
}`}
            />
            <EndpointCard method="PUT" path="/api/v1/leads/:id" description="Atualiza dados parciais do Lead" bodyParams={[{ name: "status", type: "string" }, { name: "stageId", type: "number" }]} />
            <EndpointCard method="DELETE" path="/api/v1/leads/:id" description="Exclui o Lead do banco de dados" />
        </div>
      </section>

      {/* Funnels Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border pb-4">
            <Layout className="text-primary h-6 w-6" />
            <h2 className="text-2xl font-bold text-foreground">Funis & Etapas</h2>
        </div>
        <div className="grid gap-6">
            <EndpointCard 
                method="GET" 
                path="/api/v1/funnels" 
                description="Listar pipelines configurados"
                response={`[
  { 
    "id": 1, 
    "name": "Vendas", 
    "stages": [{ "id": 10, "name": "Novo", "order": 0 }] 
  }
]`}
            />
            <EndpointCard 
                method="POST" 
                path="/api/v1/funnels" 
                description="Cria novo funil com estágios padrão"
                example={`{
  "name": "Novo Funil",
  "description": "Funil para parcerias",
  "stages": [{ "name": "Prospecção", "color": "#ff0000" }]
}`}
            />
            <EndpointCard method="PUT" path="/api/v1/funnels/:id" description="Atualiza metadados do funil" />
            <EndpointCard method="DELETE" path="/api/v1/funnels/:id" description="Remove funil e todas as etapas vinculadas" />
        </div>
      </section>

      {/* Users Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border pb-4">
            <Users className="text-primary h-6 w-6" />
            <h2 className="text-2xl font-bold text-foreground">Usuários (Membros)</h2>
        </div>
        <div className="grid gap-6">
            <EndpointCard 
                method="GET" 
                path="/api/v1/users" 
                description="Listar membros com acesso ao workspace"
                response={`[
  { "membershipId": 1, "name": "Admin", "email": "adm@crm.com", "role": "ADMIN" }
]`}
            />
            <EndpointCard 
                method="POST" 
                path="/api/v1/users" 
                description="Vincular usuário existente ao workspace"
                bodyParams={[
                    { name: "email", type: "string", required: true },
                    { name: "role", type: "string", description: "ADMIN, MEMBER, GESTOR, CLIENTE" }
                ]}
            />
            <EndpointCard method="PUT" path="/api/v1/users/:membershipId" description="Atualizar permissões e cargo" />
            <EndpointCard method="DELETE" path="/api/v1/users/:membershipId" description="Remover membro do workspace" />
        </div>
      </section>

      {/* Reports Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border pb-4">
            <BarChart3 className="text-primary h-6 w-6" />
            <h2 className="text-2xl font-bold text-foreground">Relatórios</h2>
        </div>
        <div className="grid gap-6">
            <EndpointCard 
                method="GET" 
                path="/api/v1/reports/dashboard" 
                description="Obter KPIs consolidados"
                queryParams={[
                    { name: "period", type: "string", description: "7d, 30d, 90d" }
                ]}
                response={`{
  "period": "30d",
  "stats": {
    "totalLeads": 150,
    "conversionRate": "12.5",
    "totalConversations": 89
  }
}`}
            />
        </div>
      </section>

      {/* Error Section */}
      <Card className="border-destructive/20 bg-destructive/10">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertCircle size={20} /> Tratamento de Erros
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-destructive font-medium space-y-2">
          <p>400: Parâmetros inconsistentes ou faltando.</p>
          <p>401: Erro de autenticação (Chave de API inválida).</p>
          <p>403: Ação proibida para o nível de acesso da chave.</p>
          <p>404: Recurso não encontrado no seu workspace.</p>
        </CardContent>
      </Card>
    </div>
  );
}
