"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Settings, 
  Facebook,
  Chrome,
  Globe,
  Smartphone,
  Webhook
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Connection {
  id: number;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  status: string;
  lastSync: string | null;
  webhookUrl?: string; // Add webhookUrl to interface
  metrics: {
    leads: number;
    gastos: string;
    conversoes: number;
  } | null;
  provider: string; // Added provider
}

const integrations = [
  {
    id: 1,
    name: "Meta Ads (Facebook & Instagram)",
    description: "Conecte suas campanhas do Facebook e Instagram Ads",
    icon: Facebook,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    provider: "facebook",
    metrics: {
      leads: 0,
      gastos: "R$ 0",
      conversoes: 0
    }
  },
  {
    id: 2,
    name: "Google Ads",
    description: "Importe leads das suas campanhas do Google Ads",
    icon: Chrome,
    color: "text-red-600",
    bgColor: "bg-red-100",
    provider: "google",
    metrics: {
      leads: 0,
      gastos: "R$ 0",
      conversoes: 0
    }
  },
  {
    id: 3,
    name: "WhatsApp",
    description: "Conecte seu WhatsApp via QR Code",
    icon: Smartphone,
    color: "text-emerald-600",
    bgColor: "bg-emerald-100",
    provider: "evolution",
    metrics: {
      leads: 0,
      gastos: "R$ 0",
      conversoes: 0
    }
  },
  {
    id: 5,
    name: "Webhook de Entrada",
    description: "URL para receber leads de qualquer plataforma",
    icon: Globe,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    provider: "custom", 
    metrics: null
  }
];

export default function Conexoes() {
  const [selectedIntegration, setSelectedIntegration] = useState<{ provider: string; name: string } | null>(null);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [autoSync, setAutoSync] = useState(true);
  const [connectionName, setConnectionName] = useState("");
  
  // New State for QR Code
  const [qrCode, setQrCode] = useState<string | null>(null);

  const handleConfigureIntegration = (integration: { provider: string; name: string }) => {
    setSelectedIntegration(integration);
    // Reset form
    setApiKey("");
    setApiSecret("");
    setWebhookUrl("");
    setConnectionName(integration.name); // Default name
    setQrCode(null);
    setIsConfigDialogOpen(true);
  };

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/connections`,
          { credentials: "include" }
        );
        const data = await response.json();
        setConnections(data);

        // 🔥 Poll Status for Evolution connections
        data.forEach(async (conn: { id: number; provider: string; status: string }) => {
            if (conn.provider === 'evolution' && conn.status !== 'connected') {
                try {
                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/connections/${conn.id}/refresh`, { 
                        method: 'POST', 
                        credentials: 'include' 
                    });
                    const statusData = await res.json();
                    if (statusData.status && statusData.status !== conn.status) {
                        setConnections(prev => prev.map(c => c.id === conn.id ? { ...c, status: statusData.status } : c));
                    }
                } catch (e) {
                    console.error(`Erro sync conexao ${conn.id}`, e);
                }
            }
        });

      } catch (error) {
        console.error("Erro ao buscar conexões:", error);
      }
    };
    fetchConnections();
  }, []);

  async function handleSaveConfiguration(): Promise<void> {
    if (!selectedIntegration) {
        toast.error("Nenhuma integração selecionada");
        return;
    }

    try {
        // Validação básica cliente side
        if (selectedIntegration?.provider === 'facebook' && !apiSecret) {
             toast.error("Token necessário");
             return;
        }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/connections/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", 
        body: JSON.stringify({ 
            apiKey, 
            apiSecret, 
            webhookUrl, 
            autoSync,
            name: connectionName,
            provider: selectedIntegration.provider 
        }),
      });
      const data = await response.json();

      if (!response.ok) {
          toast.error("Erro ao salvar", { description: data.error || "Tente novamente" });
          return;
      }

      toast.success("Conexão salva com sucesso!");
      
      // Se for evolution, pode ter vindo QR Code
      if (data.qrcode) {
          setQrCode(data.qrcode);
          toast.info("Escaneie o QR Code");
          // Não fecha dialog
      } else {
        setIsConfigDialogOpen(false);
      }
      
      // 🔥 Atualiza a lista após salvar
      const fetchConnections = async () => {
          try {
            const res = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/connections`,
              { credentials: "include" }
            );
            const newData = await res.json();
            setConnections(newData);
          } catch (error) {
            console.error("Erro ao recarregar conexões:", error);
          }
        };
        fetchConnections();

    }catch(error){
      console.error("Erro ao salvar configuração:", error);
      toast.error("Erro de conexão");
    }
  };

  const handleSync = async (integrationId: number) => {
    // ...
  };

  // 🔥 Contadores reais
  const connectedCount = connections.length;

  return (
    <div className="p-8 space-y-6 bg-background min-h-screen">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Conexões Profissionais</h1>
        <p className="text-muted-foreground">Gerencie suas integrações de forma simples.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrations.map((integration) => {
          const Icon = integration.icon;
          
          const realConnection = connections.find((c) => 
            c.provider === integration.provider || 
            (integration.provider === 'custom' && c.provider === 'webhook') ||
            (integration.provider === 'custom' && c.provider === 'custom')
          );

          const isConnected = !!realConnection && realConnection.status === "connected";
          
          return (
            <Card key={integration.id} className={`bg-card transition-all hover:shadow-md border border-border border-l-4 ${isConnected ? "border-l-primary" : "border-l-muted"}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 ${integration.bgColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <Icon className={integration.color} size={24} />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold text-foreground mb-1">{integration.name}</CardTitle>
                      <CardDescription className="text-muted-foreground">{integration.description}</CardDescription>
                    </div>
                  </div>
                  <Badge className={isConnected ? "bg-primary/10 text-primary hover:bg-primary/20 border-transparent shadow-none" : "bg-muted text-muted-foreground hover:bg-muted border-transparent shadow-none"}>
                    {isConnected ? (
                      <><CheckCircle2 size={14} className="mr-1" /> Conectado</>
                    ) : realConnection && realConnection.status === 'connecting' ? (
                       <><RefreshCw size={14} className="mr-1 animate-spin" /> Conectando</>
                    ) : (
                      <><XCircle size={14} className="mr-1" /> Desconectado</>
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                 {/* Exibição de Webhook URL */}
                 {isConnected && (integration.provider === 'custom') && realConnection.webhookUrl && (
                    <div className="p-3 bg-muted/50 rounded-xl border border-border">
                        <Label className="text-xs text-muted-foreground font-semibold uppercase mb-1 block">Sua URL:</Label>
                        <code className="text-xs break-all block bg-background border border-border p-2 rounded-lg text-foreground font-mono">{realConnection.webhookUrl}</code>
                    </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                        if (integration.provider === 'evolution') {
                            window.location.href = "/conexoes/whatsapp"; 
                        } else if (integration.provider === 'facebook') {
                            window.location.href = "/conexoes/meta";
                        } else {
                            handleConfigureIntegration(integration);
                        }
                    }}
                    className={isConnected ? "flex-1 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm" : "flex-1 bg-primary/80 hover:bg-primary text-primary-foreground shadow-sm"}
                  >
                    <Settings size={16} className="mr-2" />
                    {isConnected ? "Gerenciar" : "Conectar"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Dialog de Configuração Simplificado */}
      <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Configurar {selectedIntegration?.name}</DialogTitle>
            <DialogDescription>
              {selectedIntegration?.provider === 'evolution' 
                ? "Conecte seu WhatsApp escaneando o QR Code abaixo."
                : "Insira suas credenciais."
              }
            </DialogDescription>
          </DialogHeader>

          {qrCode ? (
               <div className="flex flex-col items-center justify-center p-4">
                   <img src={qrCode} alt="QR Code" className="w-64 h-64 border rounded-xl" />
                   <p className="text-sm text-muted-foreground mt-2">Leia o código com seu WhatsApp</p>
                   <Button variant="outline" className="mt-4" onClick={() => setQrCode(null)}>Voltar</Button>
               </div>
          ) : (
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label>Nome da Conexão</Label>
                    <Input 
                        value={connectionName} 
                        onChange={(e) => setConnectionName(e.target.value)} 
                    />
                </div>

                {selectedIntegration?.provider === 'facebook' && (
                    <div className="space-y-2">
                        <Label>Token de Acesso (Meta)</Label>
                        <Input 
                            type="password"
                            placeholder="EAAG..." 
                            value={apiSecret} 
                            onChange={(e) => setApiSecret(e.target.value)} 
                        />
                    </div>
                )}
                
                {/* Evolution e Custom não pedem chaves técnicas mais! */}

                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border">
                    <div className="space-y-1">
                        <Label>Sincronização Automática</Label>
                        <p className="text-xs text-muted-foreground">Sincroniza automaticamente a cada hora.</p>
                    </div>
                    <Switch checked={autoSync} onCheckedChange={setAutoSync} />
                </div>
            </div>
          )}

          {!qrCode && (
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsConfigDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveConfiguration} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
                  {selectedIntegration?.provider === 'custom' ? 'Gerar URL' : 'Salvar e Conectar'}
                </Button>
              </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
