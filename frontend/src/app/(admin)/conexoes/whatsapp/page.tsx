"use client";
import { useState, useEffect } from "react";
import { 
    Server, 
    QrCode, 
    Trash, 
    Plus, 
    Smartphone,
    RefreshCw,
    ArrowLeft
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
import { useSystemConfig } from "@/app/api/userProvider";

interface Connection {
    id: number;
    name: string;
    provider: string;
    status: string;
    config: any;
}

export default function WhatsappManagerPage() {
    const { modules } = useSystemConfig();
    const [instanceName, setInstanceName] = useState("");
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [connections, setConnections] = useState<Connection[]>([]);

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
    
    // Limits (mocked or fetched from user profile)
    // Ideally we should fetch user limits. For now we rely on backend error 403.
    
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

    return (
        <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
             <div className="flex items-center gap-4">
                 <Link href="/conexoes">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                 </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gerenciador de WhatsApp</h1>
                    <p className="text-gray-500">Conecte e gerencie seus números de WhatsApp</p>
                </div>
            </div>

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
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button 
                            className="w-full bg-[#00a884] hover:bg-[#008f6f]" 
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
                            <div className="bg-white p-2 border rounded-lg shadow-sm">
                                <img src={qrCode} alt="QR Code" className="w-64 h-64" />
                            </div>
                            <Button variant="outline" onClick={() => setQrCode(null)}>Fechar / Concluído</Button>
                        </div>
                    ) : (
                        <div className="text-center text-gray-400 p-6">
                            <QrCode className="h-16 w-16 mx-auto mb-4 opacity-30" />
                            <p>Crie uma nova conexão ou clique em "Ver QR Code" ao lado.</p>
                        </div>
                    )}
                 </Card>
            </div>

            {/* Lista de Instâncias */}
            <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    Conexões Ativas
                    <Badge variant="secondary">{connections.length}</Badge>
                </h2>
                
                {connections.length === 0 && (
                    <div className="text-gray-500 italic">Nenhuma conexão ativa.</div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {connections.map((conn) => (
                        <Card key={conn.id} className="border-l-4 border-l-emerald-500">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-base font-medium truncate" title={conn.name}>
                                    {conn.name}
                                </CardTitle>
                                <Smartphone className={`h-4 w-4 ${conn.status === 'connected' ? 'text-green-500' : 'text-amber-500'}`} />
                            </CardHeader>
                            <CardContent>
                                <div className="text-xs text-gray-500 pt-2 font-mono">
                                    STATUS: <span className="uppercase">{conn.status}</span>
                                </div>
                                {conn.config?.instanceName && (
                                    <div className="text-[10px] text-gray-400 truncate mt-1">
                                        ID: {conn.config.instanceName}
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter className="flex justify-between pt-2">
                                <Button variant="outline" size="sm" onClick={() => handleConnect(conn.id)}>
                                    <QrCode className="mr-2 h-4 w-4" />
                                    Ver QR Code
                                </Button>
                                <Button variant="outline" size="sm" onClick={async () => {
                                    toast.info("Atualizando status...");
                                    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/connections/${conn.id}/refresh`, { method: 'POST', credentials: 'include' });
                                    fetchConnections();
                                }}>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Sync Status
                                </Button>
                                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(conn.id, conn.name)}>
                                    <Trash className="h-4 w-4" />
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
