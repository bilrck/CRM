"use client";
import { useState, useEffect, useRef } from "react";
import { 
  Card, CardContent, CardHeader, CardTitle, CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  Settings2, 
  History, 
  BrainCircuit, 
  Key, 
  Cpu,
  Loader2,
  Trash2,
  AlertCircle
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
}

interface AiSettings {
  isEnabled: boolean;
  provider: string;
  apiKey: string;
  modelName: string;
  temperature: number;
  systemPrompt: string;
}

export default function AiPage() {
  const [settings, setSettings] = useState<AiSettings>({
    isEnabled: false,
    provider: "google",
    apiKey: "",
    modelName: "gemini-1.5-pro",
    temperature: 0.7,
    systemPrompt: ""
  });
  
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSettings();
    fetchHistory();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/settings`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (e) { toast.error("Erro ao carregar configurações"); }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/history`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (e) { console.error(e); }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
        credentials: 'include'
      });
      if (res.ok) toast.success("Configurações de IA salvas!");
      else toast.error("Erro ao salvar configurações");
    } catch (e) { toast.error("Erro no servidor"); }
    finally { setLoading(false); }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || chatLoading) return;
    
    const userMsg = input.trim();
    setInput("");
    setHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg }),
        credentials: 'include'
      });

      if (res.ok) {
        const data = await res.json();
        setHistory(prev => [...prev, data]);
      } else {
        const err = await res.json();
        toast.error(err.error || "A IA não conseguiu responder.");
      }
    } catch (e) {
      toast.error("Erro ao conectar com a IA");
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Badge variant="outline" className="mb-2 border-primary/20 text-primary bg-primary/5 uppercase tracking-widest text-[10px] px-3 py-1">
            Inteligência Artificial
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Assistente <span className="text-primary">Inteligente</span>
          </h1>
          <p className="text-muted-foreground">Potencialize seu CRM com o poder das principais IAs do mercado.</p>
        </div>
        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-2xl border border-border/50">
          <Switch 
            checked={settings.isEnabled} 
            onCheckedChange={async (val) => {
              const newSettings = {...settings, isEnabled: val};
              setSettings(newSettings);
              // Auto-save toggle
              try {
                await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/settings`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(newSettings),
                  credentials: 'include'
                });
                toast.success(val ? "IA Ativada!" : "IA Desativada");
              } catch (e) {
                toast.error("Erro ao alterar status da IA");
              }
            }} 
          />
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-wider">IA Ativa</span>
            <span className="text-[10px] text-muted-foreground">{settings.isEnabled ? "Processando dados do usuário" : "Desativada"}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Chat Interface */}
        <Card className="lg:col-span-8 flex flex-col h-[650px] overflow-hidden border-none shadow-xl bg-gradient-to-b from-background to-muted/20">
          <CardHeader className="border-b bg-background/50 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm border border-primary/20">
                    <Bot size={22} />
                 </div>
                 <div>
                    <CardTitle className="text-lg">Conversar com Rastreia AI</CardTitle>
                    <CardDescription className="text-xs">Acesso total aos seus leads e métricas.</CardDescription>
                 </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setHistory([])} title="Limpar conversa">
                <Trash2 size={16} className="text-muted-foreground hover:text-destructive" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin" ref={scrollRef}>
            {history.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                <BrainCircuit size={64} className="text-primary animate-pulse" />
                <div className="max-w-xs">
                  <p className="text-sm font-bold uppercase tracking-widest mb-1">Como posso ajudar?</p>
                  <p className="text-xs">Pergunte sobre seus leads recentes, performance de vendas ou dúvidas do sistema.</p>
                </div>
              </div>
            )}
            
            {history.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center border ${msg.role === 'user' ? 'bg-muted text-muted-foreground border-border' : 'bg-primary text-primary-foreground border-primary/20'}`}>
                    {msg.role === 'user' ? <User size={14} /> : <Sparkles size={14} />}
                  </div>
                  <div className={`p-4 rounded-2xl text-sm shadow-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-card text-foreground rounded-tl-none border border-border/50'}`}>
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    {msg.createdAt && (
                      <span className="text-[9px] opacity-50 mt-2 block">{new Date(msg.createdAt).toLocaleTimeString()}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {chatLoading && (
              <div className="flex justify-start">
                <div className="flex gap-3 items-center bg-muted/30 p-3 rounded-2xl text-xs text-muted-foreground border border-border/50">
                  <Loader2 className="animate-spin text-primary" size={14} />
                  <span>Rastreia AI está analisando seus dados...</span>
                </div>
              </div>
            )}
          </CardContent>
          <div className="p-4 bg-background border-t">
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}>
              <Input 
                placeholder={settings.isEnabled ? "Pergunte algo sobre seus leads..." : "Ative a IA nas configurações para começar"}
                className="flex-1 bg-muted/30 border-none rounded-xl focus:ring-2 focus:ring-primary h-12"
                value={input}
                onChange={e => setInput(e.target.value)}
                disabled={!settings.isEnabled || chatLoading}
              />
              <Button type="submit" size="icon" className="h-12 w-12 rounded-xl shadow-lg shadow-primary/20" disabled={!settings.isEnabled || chatLoading}>
                <Send size={18} />
              </Button>
            </form>
          </div>
        </Card>

        {/* Configuration Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings2 size={18} className="text-primary" />
                <CardTitle className="text-lg">Configurações</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Provedor de Inteligência</Label>
                <Select 
                  value={settings.provider} 
                  onValueChange={(val) => {
                    const defaultModels: Record<string, string> = {
                      google: "gemini-1.5-pro",
                      openai: "gpt-4o",
                      anthropic: "claude-3-5-sonnet-20240620"
                    };
                    setSettings({...settings, provider: val, modelName: defaultModels[val] || ""});
                  }}
                >
                  <SelectTrigger className="bg-muted/30 border-none rounded-xl h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="google">Google Gemini (Recomendado)</SelectItem>
                    <SelectItem value="openai">OpenAI (GPT-4 / 3.5)</SelectItem>
                    <SelectItem value="anthropic">Anthropic Claude</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-xs uppercase font-bold text-muted-foreground flex items-center gap-2">
                   <Key size={12} /> API Key do Provedor
                </Label>
                <Input 
                  type="password"
                  placeholder="Insira sua chave aqui..."
                  className="bg-muted/30 border-none rounded-xl h-11"
                  value={settings.apiKey}
                  onChange={e => setSettings({...settings, apiKey: e.target.value})}
                />
              </div>

              <div className="space-y-3">
                <Label className="text-xs uppercase font-bold text-muted-foreground flex items-center gap-2">
                   <Cpu size={12} /> Modelo do Sistema
                </Label>
                <Select 
                  value={settings.modelName} 
                  onValueChange={(val) => setSettings({...settings, modelName: val})}
                >
                  <SelectTrigger className="bg-muted/30 border-none rounded-xl h-11">
                    <SelectValue placeholder="Selecione o modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    {settings.provider === 'google' && (
                      <>
                        <SelectItem value="gemini-3.1-pro-preview">Gemini 3.1 Pro Preview (Mais Novo)</SelectItem>
                        <SelectItem value="gemini-3.1-flash-lite-preview">Gemini 3.1 Flash Lite Preview</SelectItem>
                        <SelectItem value="gemini-3-pro-preview">Gemini 3 Pro Preview</SelectItem>
                        <SelectItem value="gemini-3-flash-preview">Gemini 3 Flash Preview</SelectItem>
                        <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro (Estável)</SelectItem>
                        <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash (Performance)</SelectItem>
                        <SelectItem value="gemini-2.5-flash-lite">Gemini 2.5 Flash-Lite</SelectItem>
                        <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash</SelectItem>
                        <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
                        <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash</SelectItem>
                        <SelectItem value="gemini-pro-latest">Gemini Pro (Latest)</SelectItem>
                        <SelectItem value="gemini-flash-latest">Gemini Flash (Latest)</SelectItem>
                        <SelectItem value="deep-research-max-preview-04-2026">Deep Research Max Preview</SelectItem>
                        <SelectItem value="deep-research-preview-04-2026">Deep Research Preview</SelectItem>
                        <SelectItem value="deep-research-pro-preview-12-2025">Deep Research Pro Preview</SelectItem>
                        <SelectItem value="gemini-2.5-computer-use-preview-10-2025">Gemini 2.5 Computer Use</SelectItem>
                        <SelectItem value="aqa">AQA (Question Answering)</SelectItem>
                        <SelectItem value="gemma-4-31b-it">Gemma 4 31B IT</SelectItem>
                      </>
                    )}
                    {settings.provider === 'openai' && (
                      <>
                        <SelectItem value="gpt-4o">GPT-4o (Omni - Recomendado)</SelectItem>
                        <SelectItem value="gpt-4o-mini">GPT-4o Mini (Custo-benefício)</SelectItem>
                        <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                        <SelectItem value="gpt-4">GPT-4 (Clássico)</SelectItem>
                        <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                      </>
                    )}
                    {settings.provider === 'anthropic' && (
                      <>
                        <SelectItem value="claude-3-5-sonnet-20240620">Claude 3.5 Sonnet (Melhor Custo/Perf)</SelectItem>
                        <SelectItem value="claude-3-opus-20240229">Claude 3 Opus (Mais Inteligente)</SelectItem>
                        <SelectItem value="claude-3-sonnet-20240229">Claude 3 Sonnet</SelectItem>
                        <SelectItem value="claude-3-haiku-20240307">Claude 3 Haiku (Rápido)</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-xs uppercase font-bold text-muted-foreground">Criatividade (Temp)</Label>
                  <span className="text-xs font-bold text-primary">{settings.temperature}</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.1" 
                  className="w-full accent-primary" 
                  value={settings.temperature}
                  onChange={e => setSettings({...settings, temperature: parseFloat(e.target.value)})}
                />
              </div>

              <Button onClick={handleSaveSettings} disabled={loading} className="w-full shadow-lg shadow-primary/20 h-11 rounded-xl">
                {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : "Salvar Configurações"}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/10">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                 <AlertCircle size={14} /> Privacidade de Dados
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Esta IA possui acesso <strong>apenas aos seus dados</strong> (leads, métricas, conexões) e não compartilha informações com outros usuários. As chaves de API são armazenadas com criptografia.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
