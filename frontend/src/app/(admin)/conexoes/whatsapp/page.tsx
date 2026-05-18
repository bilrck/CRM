"use client";
import { useState, useEffect } from "react";
import { 
    Server, 
    QrCode, 
    Trash, 
    Plus, 
    Smartphone,
    RefreshCw,
    ArrowLeft,
    Settings,
    MessageSquare,
    CheckSquare,
    Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    Card, 
    CardContent, 
    CardDescription, 
    CardHeader, 
    CardTitle,
    CardFooter
} from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useSystemConfig, useUser } from "@/app/api/userProvider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface Connection {
    id: number;
    name: string;
    provider: string;
    status: string;
    config: any;
}

export default function WhatsappManagerPage() {
    const { modules } = useSystemConfig();
    const user = useUser();
    
    const [instanceName, setInstanceName] = useState("");
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [connections, setConnections] = useState<Connection[]>([]);
    
    // Notification channel preferences
    const [notifSettings, setNotifSettings] = useState({
        whatsapp: false,
        whatsappNotificationConnectionId: "",
        whatsappNotificationTargetType: "self",
        whatsappNotificationTargetValue: "",
        newLead: true,
        conversion: true,
        message: true,
        dailyReport: false,
        weeklyReport: true
    });

    useEffect(() => {
        if (user && user.notificationSettings) {
            setNotifSettings({
                whatsapp: false,
                whatsappNotificationConnectionId: "",
                whatsappNotificationTargetType: "self",
                whatsappNotificationTargetValue: "",
                newLead: true,
                conversion: true,
                message: true,
                dailyReport: false,
                weeklyReport: true,
                ...user.notificationSettings
            });
        }
    }, [user]);

    if (modules.whatsapp === false) {
        return (
            <div className="p-8 max-w-4xl mx-auto flex h-[calc(100vh-theme(spacing.16))] items-center justify-center">
                <Card className="border-red-200 bg-red-50 p-16 text-center max-w-md w-full shadow-lg shadow-red-50">
                    <CardContent className="flex flex-col items-center py-0">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                            <Smartphone className="h-8 w-8 text-red-600" />
                        </div>
                        <h3 className="text-xl font-bold text-red-800 mb-2">Módulo Desativado</h3>
                        <p className="text-red-700">
                            O módulo de gerenciamento de WhatsApp está desativado pelo administrador do sistema.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    useEffect(() => {
        fetchConnections();
    }, []);

    const fetchConnections = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/connections`, { credentials: "include" });
            const data = await response.json();
            // Filter only evolution connections
            setConnections(data.filter((c: Connection) => c.provider === 'evolution'));
        } catch (error) {
            console.error("Erro ao buscar conexões", error);
        }
    }

    const handleCreateInstance = async () => {
        if (!instanceName) return;
        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/connections/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    name: instanceName, 
                    provider: 'evolution',
                    autoSync: true 
                }),
                credentials: 'include'
            });
            const data = await res.json();
            
            if (res.ok) {
                toast.success(`Instância ${instanceName} criada!`);
                setInstanceName("");
                
                // Se retornou QRcode direto
                if(data.qrcode) {
                    setQrCode(data.qrcode);
                }
                
                fetchConnections();
            } else {
                toast.error(data.error || "Erro ao criar instância");
            }
        } catch (error) {
            toast.error("Erro ao conectar com servidor");
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = async (id: number) => {
        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/connections/${id}/qrcode`, {
                credentials: 'include'
            });
            const data = await res.json();
            
            if (data.base64) {
                setQrCode(data.base64);
            } else if (data.qrcode && data.qrcode.base64) {
                setQrCode(data.qrcode.base64);
            } else {
                // Se conectou ou deu outro status
                if(data.instance?.state === 'open') {
                    toast.success("Instância já conectada!");
                    fetchConnections(); // Refresh status check ideally
                } else {
                    toast.info("Status: " + (data.instance?.state || "Desconhecido"));
                }
            }

        } catch (error) {
            toast.error("Erro ao buscar QR Code");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number, name: string) => {
        if(!confirm(`Deletar conexão ${name}?`)) return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/connections/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            
            if(res.ok) {
                toast.success("Conexão removida");
                setConnections(connections.filter(c => c.id !== id));
            } else {
                toast.error("Erro ao deletar");
            }
        } catch (error) {
            toast.error("Erro ao deletar");
        }
    };

    const handleSaveNotifSettings = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/notifications`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notifications: notifSettings }),
                credentials: "include"
            });
            if (res.ok) {
                toast.success("Configurações do canal de notificações atualizadas!");
            } else {
                toast.error("Erro ao salvar configurações");
            }
        } catch (error) {
            toast.error("Erro no servidor");
        } finally {
            setLoading(false);
        }
    };

    const activeConnections = connections.filter(c => c.status === 'connected');

    return (
        <div className="p-8 space-y-8 bg-background text-foreground min-h-screen">
             <div className="flex items-center gap-4">
                 <Link href="/conexoes">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                 </Link>
                <div>
                    <h1 className="text-2xl font-bold">Gerenciador de WhatsApp</h1>
                    <p className="text-muted-foreground">Conecte seus números de WhatsApp e configure canais de disparo</p>
                </div>
            </div>

            <Tabs defaultValue="conexoes" className="w-full space-y-6">
                <TabsList className="grid grid-cols-2 max-w-md h-auto p-1 bg-muted rounded-xl">
                    <TabsTrigger value="conexoes" className="py-2 rounded-lg">
                        Conexões Ativas
                    </TabsTrigger>
                    <TabsTrigger value="canal_notif" className="py-2 rounded-lg flex items-center gap-2">
                        <Settings size={14} />
                        Canal de Notificação
                    </TabsTrigger>
                </TabsList>

                {/* TAB 1: CONNECTIONS */}
                <TabsContent value="conexoes" className="space-y-8 focus-visible:outline-none">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Criar Instância */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Nova Conexão</CardTitle>
                                <CardDescription>Adicione um novo número para automação</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Nome de Identificação</label>
                                    <Input 
                                        placeholder="ex: Suporte N1" 
                                        value={instanceName}
                                        onChange={(e) => setInstanceName(e.target.value)}
                                        className="bg-muted/50"
                                    />
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button 
                                    className="w-full bg-[#00a884] hover:bg-[#008f6f] text-white" 
                                    onClick={handleCreateInstance}
                                    disabled={loading}
                                >
                                    {loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                                    Criar e Conectar
                                </Button>
                            </CardFooter>
                        </Card>

                         {/* QR Code Display */}
                         <Card className="flex flex-col items-center justify-center min-h-[300px]">
                            {qrCode ? (
                                <div className="text-center space-y-4 p-6">
                                    <h3 className="font-semibold text-lg text-emerald-700">Escaneie com seu WhatsApp</h3>
                                    <div className="bg-white p-2 border rounded-lg shadow-sm mx-auto w-fit">
                                        <img src={qrCode} alt="QR Code" className="w-64 h-64" />
                                    </div>
                                    <Button variant="outline" onClick={() => setQrCode(null)}>Fechar / Concluído</Button>
                                </div>
                            ) : (
                                <div className="text-center text-muted-foreground p-6">
                                    <QrCode className="h-16 w-16 mx-auto mb-4 opacity-30" />
                                    <p>Crie uma nova conexão ou clique em "Ver QR Code" ao lado.</p>
                                </div>
                            )}
                         </Card>
                    </div>

                    {/* Lista de Instâncias */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            Conexões Ativas
                            <Badge variant="secondary">{connections.length}</Badge>
                        </h2>
                        
                        {connections.length === 0 && (
                            <div className="text-muted-foreground italic">Nenhuma conexão ativa.</div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {connections.map((conn) => (
                                <Card key={conn.id} className="border-l-4 border-l-[#00a884] bg-card hover:shadow-md transition-shadow">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-base font-medium truncate max-w-[80%]" title={conn.name}>
                                            {conn.name}
                                        </CardTitle>
                                        <Smartphone className={`h-4 w-4 ${conn.status === 'connected' ? 'text-green-500' : 'text-amber-500'}`} />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-xs text-muted-foreground pt-2 font-mono">
                                            STATUS: <span className="uppercase font-bold">{conn.status}</span>
                                        </div>
                                        {conn.config?.instanceName && (
                                            <div className="text-[10px] text-muted-foreground/80 truncate mt-1">
                                                ID: {conn.config.instanceName}
                                            </div>
                                        )}
                                    </CardContent>
                                    <CardFooter className="flex justify-between gap-2 pt-2 flex-wrap sm:flex-nowrap">
                                        <Button variant="outline" size="sm" onClick={() => handleConnect(conn.id)} className="w-full sm:w-auto">
                                            <QrCode className="mr-2 h-3.5 w-3.5" />
                                            Ver QR Code
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={async () => {
                                            toast.info("Atualizando status...");
                                            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/connections/${conn.id}/refresh`, { method: 'POST', credentials: 'include' });
                                            fetchConnections();
                                        }} className="w-full sm:w-auto">
                                            <RefreshCw className="mr-2 h-3.5 w-3.5" />
                                            Sync Status
                                        </Button>
                                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50 w-full sm:w-auto flex justify-center" onClick={() => handleDelete(conn.id, conn.name)}>
                                            <Trash className="h-4 w-4" />
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    </div>
                </TabsContent>

                {/* TAB 2: NOTIFICATION CHANNEL SETTINGS */}
                <TabsContent value="canal_notif" className="space-y-6 focus-visible:outline-none">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle>Canal de Notificações via WhatsApp</CardTitle>
                                <CardDescription>Configure como e onde o sistema dispara alertas automatizados</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Habilitar WhatsApp Global */}
                                <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-muted/20">
                                    <div>
                                        <Label className="text-base font-semibold block mb-0.5">Ativar Canal de WhatsApp</Label>
                                        <p className="text-xs text-muted-foreground">Habilita ou desabilita alertas automáticos via bot do WhatsApp</p>
                                    </div>
                                    <Switch 
                                        checked={notifSettings.whatsapp}
                                        onCheckedChange={(val) => setNotifSettings({ ...notifSettings, whatsapp: val })}
                                    />
                                </div>

                                {notifSettings.whatsapp && (
                                    <>
                                        {/* Instancia de Disparo */}
                                        <div className="space-y-2">
                                            <Label>Instância de WhatsApp para Envio</Label>
                                            <Select 
                                                value={notifSettings.whatsappNotificationConnectionId?.toString()} 
                                                onValueChange={(val) => setNotifSettings({ ...notifSettings, whatsappNotificationConnectionId: val })}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Selecione uma instância ativa..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {activeConnections.length === 0 ? (
                                                        <SelectItem value="none" disabled>Nenhuma instância conectada</SelectItem>
                                                    ) : (
                                                        activeConnections.map(c => (
                                                            <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                                        ))
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            <p className="text-[11px] text-muted-foreground">Esta será a instância utilizada para disparar as mensagens de alertas.</p>
                                        </div>

                                        {/* Tipo de Destinatário */}
                                        <div className="space-y-2">
                                            <Label>Destinatário das Notificações</Label>
                                            <Select 
                                                value={notifSettings.whatsappNotificationTargetType} 
                                                onValueChange={(val) => setNotifSettings({ ...notifSettings, whatsappNotificationTargetType: val })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="self">Meu próprio número cadastrado</SelectItem>
                                                    <SelectItem value="custom">Outro número de WhatsApp específico</SelectItem>
                                                    <SelectItem value="group">Grupo de WhatsApp</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Campo Condicional */}
                                        {notifSettings.whatsappNotificationTargetType === "custom" && (
                                            <div className="space-y-2">
                                                <Label>Número do WhatsApp com DDI (apenas números)</Label>
                                                <Input 
                                                    placeholder="ex: 5511999999999"
                                                    value={notifSettings.whatsappNotificationTargetValue}
                                                    onChange={(e) => setNotifSettings({ ...notifSettings, whatsappNotificationTargetValue: e.target.value })}
                                                />
                                            </div>
                                        )}

                                        {notifSettings.whatsappNotificationTargetType === "group" && (
                                            <div className="space-y-2">
                                                <Label>ID do Grupo (JID)</Label>
                                                <Input 
                                                    placeholder="ex: 1203630248593@g.us"
                                                    value={notifSettings.whatsappNotificationTargetValue}
                                                    onChange={(e) => setNotifSettings({ ...notifSettings, whatsappNotificationTargetValue: e.target.value })}
                                                />
                                                <p className="text-[11px] text-muted-foreground">Insira o JID completo do grupo do WhatsApp onde as mensagens serão enviadas.</p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full bg-[#00a884] hover:bg-[#008f6f] text-white" onClick={handleSaveNotifSettings}>
                                    <Save className="mr-2 h-4 w-4" />
                                    Salvar Canal de Notificação
                                </Button>
                            </CardFooter>
                        </Card>

                        <Card className="md:col-span-1">
                            <CardHeader>
                                <CardTitle>Eventos Ativos</CardTitle>
                                <CardDescription>Selecione quais ações enviam WhatsApp</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {[
                                    { id: "newLead", label: "Novo Lead Capturado" },
                                    { id: "conversion", label: "Lead Ganho / Conversão" },
                                    { id: "message", label: "Nova Mensagem" },
                                ].map(item => (
                                    <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/10">
                                        <span className="text-sm font-medium">{item.label}</span>
                                        <Switch 
                                            checked={notifSettings[item.id as keyof typeof notifSettings] as boolean}
                                            onCheckedChange={(val) => setNotifSettings({ ...notifSettings, [item.id]: val })}
                                            disabled={!notifSettings.whatsapp}
                                        />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
