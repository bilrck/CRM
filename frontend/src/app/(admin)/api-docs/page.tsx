"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Code, 
  Shield, 
  AlertCircle, 
  Zap, 
  Database, 
  KeyRound, 
  Clock, 
  BarChart3, 
  Users, 
  Layout, 
  Smartphone,
  CheckCircle2,
  MessageSquare,
  Home
} from "lucide-react";

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
    GET: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
    POST: "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
    PUT: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
    DELETE: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
  }[method];

  return (
    <Card className="overflow-hidden border-border bg-card">
      <div className="p-4 bg-muted/50 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <Badge className={`${methodColor} font-bold px-3`}>{method}</Badge>
          <code className="text-sm font-semibold text-foreground break-all">{path}</code>
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
    <div className="p-8 max-w-6xl mx-auto space-y-12 pb-24 bg-background text-foreground">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-xl">
            <Code className="text-primary-foreground h-8 w-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Documentação da API</h1>
        </div>
        <p className="text-muted-foreground text-lg md:text-xl max-w-2xl">
          Conecte seu CRM a qualquer plataforma. Automatize seus leads, funis, canais de disparo do WhatsApp e lembretes via HTTP.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><KeyRound size={16} className="text-primary" /> Autenticação</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-xs text-muted-foreground">Use o header <code className="bg-muted border border-border px-1 rounded">x-api-key</code> em todas as chamadas.</p>
            </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><Zap size={16} className="text-primary" /> Base URL</CardTitle>
            </CardHeader>
            <CardContent>
                <code className="text-xs bg-muted border border-border px-1 rounded break-all">{baseUrl}/api/v1</code>
            </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><Clock size={16} className="text-primary" /> Rate Limit</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-xs text-muted-foreground">100 requisições por minuto por workspace.</p>
            </CardContent>
        </Card>
      </div>

      {/* Workspace Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border pb-4">
            <Home className="text-primary h-6 w-6" />
            <h2 className="text-2xl font-bold">Workspace</h2>
        </div>
        <div className="grid gap-6">
            <EndpointCard 
                method="GET" 
                path="/api/v1/workspaces/me" 
                description="Obtém detalhes do workspace vinculado a chave de API"
                response={`{
  "id": 1,
  "name": "Workspace Principal",
  "plan": "PRO",
  "createdAt": "2026-05-18T10:00:00.000Z"
}`}
            />
        </div>
      </section>

      {/* Leads Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border pb-4">
            <Database className="text-primary h-6 w-6" />
            <h2 className="text-2xl font-bold">Leads</h2>
        </div>
        <div className="grid gap-6">
            <EndpointCard 
                method="GET" 
                path="/api/v1/leads" 
                description="Retorna lista de leads do workspace"
                queryParams={[
                    { name: "limit", type: "number", description: "Limite de registros retornados (padrão 10)" },
                    { name: "offset", type: "number", description: "Registros pulados para paginação (padrão 0)" },
                    { name: "funnelId", type: "number", description: "Filtrar leads por ID de Funil" },
                    { name: "stageId", type: "number", description: "Filtrar leads por ID da Etapa" }
                ]}
                response={`{
  "data": [
    {
      "id": 42,
      "name": "João da Silva",
      "phone": "5511999999999",
      "email": "joao@email.com",
      "funnelId": 2,
      "stageId": 5,
      "status": "new",
      "tags": ["site", "whatsapp"],
      "fields": {
        "cidade": "São Paulo",
        "empresa": "TechCorp"
      }
    }
  ],
  "meta": { "total": 1, "limit": 10, "offset": 0 }
}`}
            />
            <EndpointCard 
                method="POST" 
                path="/api/v1/leads" 
                description="Cria e insere um novo Lead no CRM"
                bodyParams={[
                    { name: "name", type: "string", required: true, description: "Nome completo do lead" },
                    { name: "phone", type: "string", description: "Número de celular (apenas dígitos)" },
                    { name: "email", type: "string", description: "Endereço de e-mail" },
                    { name: "funnelId", type: "number", description: "ID do Funil de destino" },
                    { name: "stageId", type: "number", description: "ID da Etapa/Estágio do Funil" },
                    { name: "tags", type: "array", description: "Lista de tags personalizadas (ex: ['site', 'google'])" },
                    { name: "fields", type: "object", description: "Chave-valor de campos customizados adicionais" }
                ]}
                example={`{
  "name": "João da Silva",
  "phone": "5511999999999",
  "email": "joao@email.com",
  "tags": ["site", "landing-page"],
  "fields": {
    "empresa": "TechCorp",
    "cargo": "Diretor"
  }
}`}
            />
            <EndpointCard 
                method="PUT" 
                path="/api/v1/leads/:id" 
                description="Atualiza dados parciais ou altera a etapa do Lead"
                bodyParams={[
                    { name: "name", type: "string", description: "Novo nome" },
                    { name: "phone", type: "string", description: "Novo telefone" },
                    { name: "email", type: "string", description: "Novo e-mail" },
                    { name: "funnelId", type: "number", description: "Alterar Funil" },
                    { name: "stageId", type: "number", description: "Alterar Etapa" },
                    { name: "status", type: "string", description: "Altera status do negócio ('new', 'won', 'lost')" },
                    { name: "tags", type: "array", description: "Substitui lista de tags" },
                    { name: "fields", type: "object", description: "Campos customizados a serem atualizados" }
                ]}
                example={`{
  "stageId": 6,
  "status": "won",
  "fields": {
    "valor_fechado": "1500"
  }
}`}
            />
            <EndpointCard 
                method="DELETE" 
                path="/api/v1/leads/:id" 
                description="Remove permanentemente o Lead do workspace"
            />
        </div>
      </section>

      {/* WhatsApp Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border pb-4">
            <Smartphone className="text-primary h-6 w-6" />
            <h2 className="text-2xl font-bold">WhatsApp & Mensagens</h2>
        </div>
        <div className="grid gap-6">
            <EndpointCard 
                method="GET" 
                path="/api/v1/connections" 
                description="Lista todas as instâncias ativas do WhatsApp vinculadas ao workspace"
                response={`[
  {
    "id": 3,
    "name": "Suporte Comercial",
    "provider": "evolution",
    "status": "connected"
  }
]`}
            />
            <EndpointCard 
                method="GET" 
                path="/api/v1/conversations" 
                description="Lista todas as conversas/chats do WhatsApp no workspace"
                queryParams={[
                    { name: "limit", type: "number", description: "Limite de conversas a retornar" },
                    { name: "offset", type: "number", description: "Número de registros a pular" }
                ]}
                response={`[
  {
    "id": 15,
    "remoteJid": "5511999999999@s.whatsapp.net",
    "pushName": "João Silva",
    "unreadCount": 0,
    "lastMessage": "Olá, qual valor do plano?"
  }
]`}
            />
            <EndpointCard 
                method="GET" 
                path="/api/v1/messages/:conversationId" 
                description="Obtém a lista de mensagens de um chat específico"
                queryParams={[
                    { name: "limit", type: "number", description: "Limite de mensagens" },
                    { name: "offset", type: "number", description: "Mensagens a pular" }
                ]}
                response={`[
  {
    "id": 148,
    "fromMe": false,
    "body": "Olá, qual valor do plano?",
    "timestamp": 1782390234
  }
]`}
            />
            <EndpointCard 
                method="POST" 
                path="/api/v1/messages/send" 
                description="Dispara uma mensagem de WhatsApp corporativo para um contato ou conversa ativa"
                bodyParams={[
                    { name: "body", type: "string", required: true, description: "Conteúdo textual da mensagem a enviar" },
                    { name: "phone", type: "string", description: "Número de telefone com DDI (ex: 5511999999999)" },
                    { name: "conversationId", type: "number", description: "ID de uma conversa existente no banco de dados" }
                ]}
                example={`{
  "phone": "5511999999999",
  "body": "Olá! Seu boleto de faturamento está pronto. Segue o link..."
}`}
            />
        </div>
      </section>

      {/* Funnels Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border pb-4">
            <Layout className="text-primary h-6 w-6" />
            <h2 className="text-2xl font-bold">Funis & Etapas</h2>
        </div>
        <div className="grid gap-6">
            <EndpointCard 
                method="GET" 
                path="/api/v1/funnels" 
                description="Lista os funis cadastrados e suas respectivas etapas ordenadas"
                response={`[
  {
    "id": 2,
    "name": "Funil Comercial",
    "stages": [
      {
        "id": 5,
        "name": "Novo Lead",
        "color": "#3b82f6",
        "order": 1
      },
      {
        "id": 6,
        "name": "Proposta Enviada",
        "color": "#eab308",
        "order": 2
      }
    ]
  }
]`}
            />
            <EndpointCard 
                method="POST" 
                path="/api/v1/funnels" 
                description="Cria um novo funil com etapas padrão"
                bodyParams={[
                    { name: "name", type: "string", required: true, description: "Nome identificador do funil" },
                    { name: "description", type: "string", description: "Breve descrição sobre o pipeline" }
                ]}
                example={`{
  "name": "Funil Parcerias B2B",
  "description": "Estágios para atração e fechamento de grandes corporações"
}`}
            />
            <EndpointCard 
                method="PUT" 
                path="/api/v1/funnels/:id" 
                description="Atualiza as propriedades estruturais de um funil"
                bodyParams={[
                    { name: "name", type: "string", description: "Novo nome" },
                    { name: "description", type: "string", description: "Nova descrição" }
                ]}
                example={`{
  "name": "Parcerias Estratégicas B2B"
}`}
            />
            <EndpointCard 
                method="DELETE" 
                path="/api/v1/funnels/:id" 
                description="Exclui o funil e desvincula os leads"
            />
        </div>
      </section>

      {/* Tasks Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border pb-4">
            <CheckCircle2 className="text-primary h-6 w-6" />
            <h2 className="text-2xl font-bold">Tarefas & Lembretes</h2>
        </div>
        <div className="grid gap-6">
            <EndpointCard 
                method="GET" 
                path="/api/v1/tasks" 
                description="Lista todas as tarefas ativas do usuário do workspace"
                response={`[
  {
    "id": 10,
    "title": "Apresentação da Proposta",
    "description": "Ligar via WhatsApp para esclarecer dúvidas",
    "status": "PENDING",
    "priority": "HIGH",
    "dueDate": "2026-05-20T14:00:00.000Z",
    "reminderAt": "2026-05-20T13:45:00.000Z",
    "reminderType": "BOTH"
  }
]`}
            />
            <EndpointCard 
                method="POST" 
                path="/api/v1/tasks" 
                description="Cria uma nova tarefa com gatilhos de agendamento de lembrete"
                bodyParams={[
                    { name: "title", type: "string", required: true, description: "Título da atividade" },
                    { name: "description", type: "string", description: "Notas e explicações" },
                    { name: "status", type: "string", description: "Estado inicial ('PENDING', 'COMPLETED', 'CANCELED')" },
                    { name: "priority", type: "string", description: "Prioridade de urgência ('LOW', 'MEDIUM', 'HIGH')" },
                    { name: "dueDate", type: "string", description: "Vencimento da atividade (ISO-8601, ex: 2026-05-20T14:00:00Z)" },
                    { name: "reminderAt", type: "string", description: "Horário para disparo do lembrete automático (ISO-8601)" },
                    { name: "reminderType", type: "string", description: "Canal de alerta do lembrete ('SYSTEM', 'WHATSAPP', 'BOTH')" },
                    { name: "leadId", type: "number", description: "Vincular a tarefa a um ID de Lead específico" }
                ]}
                example={`{
  "title": "Enviar minuta do contrato",
  "description": "Revisar cláusula 4 antes de disparar",
  "priority": "HIGH",
  "reminderType": "BOTH",
  "reminderAt": "2026-05-22T09:00:00.000Z",
  "leadId": 42
}`}
            />
        </div>
      </section>

      {/* Users Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border pb-4">
            <Users className="text-primary h-6 w-6" />
            <h2 className="text-2xl font-bold">Usuários & Equipe</h2>
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
                    { name: "email", type: "string", required: true, description: "E-mail do usuário cadastrado na plataforma" },
                    { name: "role", type: "string", required: true, description: "Nível de acesso ('ADMIN', 'MEMBER', 'GESTOR', 'CLIENTE')" }
                ]}
                example={`{
  "email": "consultor@empresa.com",
  "role": "MEMBER"
}`}
            />
            <EndpointCard 
                method="PUT" 
                path="/api/v1/users/:id" 
                description="Atualizar cargo e privilégios de acesso do membro"
                bodyParams={[
                    { name: "role", type: "string", required: true, description: "Novo nível de acesso ('ADMIN', 'MEMBER', 'GESTOR', 'CLIENTE')" }
                ]}
                example={`{
  "role": "GESTOR"
}`}
            />
            <EndpointCard 
                method="DELETE" 
                path="/api/v1/users/:id" 
                description="Revoga acesso e desvincula o membro do workspace"
            />
        </div>
      </section>

      {/* Reports Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border pb-4">
            <BarChart3 className="text-primary h-6 w-6" />
            <h2 className="text-2xl font-bold">Relatórios</h2>
        </div>
        <div className="grid gap-6">
            <EndpointCard 
                method="GET" 
                path="/api/v1/reports/dashboard" 
                description="Obter estatísticas de desempenho consolidadas"
                queryParams={[
                    { name: "period", type: "string", description: "Período temporal de apuração: '7d', '30d', '90d' (padrão '30d')" }
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
