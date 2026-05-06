"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash, Plus, ArrowRight, MessageSquare, Smile, Settings2, CheckCheck } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface Stage {
    id: number;
    name: string;
    color: string;
    order: number;
}
  
  interface Funnel {
    id: number;
    name: string;
    stages: Stage[];
}

interface Rule {
    id: number;
    keywords: string;
    targetStatus: string | null;
    funnelId: number | null;
    stageId: number | null;
    isActive: boolean;
    replyMessage: string | null;
    replyMediaUrl: string | null;
    replyMediaType: string | null; // text, image, document, video
    funnel?: Funnel;
    stage?: Stage;
}

export default function Rastreamento() {
    const [rules, setRules] = useState<Rule[]>([]);
    const [funnels, setFunnels] = useState<Funnel[]>([]);
    
    // Form States
    const [keywords, setKeywords] = useState("");
    const [targetType, setTargetType] = useState<"legacy" | "funnel">("funnel");
    const [selectedFunnelId, setSelectedFunnelId] = useState("");
    const [selectedStageId, setSelectedStageId] = useState("");
    const [legacyStatus, setLegacyStatus] = useState("");
    
    // Auto Reply States
    const [replyMessage, setReplyMessage] = useState("");
    const [replyMediaUrl, setReplyMediaUrl] = useState("");
    const [replyMediaType, setReplyMediaType] = useState<"text" | "image" | "document" | "video">("text");
    const [showAutoReply, setShowAutoReply] = useState(false);
    const [createLead, setCreateLead] = useState(true); // 🔥 NEW: Auto-create lead toggle
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const emojis = ["👋", "✅", "🚀", "💰", "📞", "🤝", "💡", "⚠️", "📊", "🏠", "🕒", "✨"];
    const variables = ["{pushname}", "{telefone}", "{nome_user}", "{empresa}", "{saudacao}"];

    const fetchData = useCallback(async () => {
        try {
            // setLoading(true);
            const [rulesRes, funnelsRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/tracking/rules`, { credentials: "include" }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/funnel`, { credentials: "include" })
            ]);
            
            setRules(await rulesRes.json());
            setFunnels(await funnelsRes.json());
        } catch (error) {
            console.error(error);
            toast.error("Erro ao carregar dados");
        }
    }, []);

    useEffect(() => {
        const interval = setTimeout(() => {
            fetchData();
        }, 100);
        return () => clearTimeout(interval);
    }, [fetchData]);

    const handleCreate = async () => {
        if (!keywords) return toast.error("Digite as palavras-chave");

        const data: {
            keywords: string;
            funnelId?: number;
            stageId?: number;
            targetStatus?: string;
            replyMessage?: string;
            replyMediaUrl?: string;
            replyMediaType?: string;
            createLead: boolean;
        } = { keywords, createLead };

        if (targetType === "funnel") {
            if (!selectedFunnelId || !selectedStageId) return toast.error("Selecione um funil e um estágio");
            data.funnelId = parseInt(selectedFunnelId);
            data.stageId = parseInt(selectedStageId);
        } else {
             data.targetStatus = legacyStatus;
        }

        if (showAutoReply) {
            data.replyMessage = replyMessage;
            data.replyMediaUrl = replyMediaUrl;
            data.replyMediaType = replyMediaType;
        }

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tracking/rules`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
                credentials: "include"
            });

            if (res.ok) {
                toast.success("Regra criada!");
                setKeywords("");
                setSelectedFunnelId("");
                setSelectedStageId("");
                setLegacyStatus("");
                setReplyMessage("");
                setReplyMediaUrl("");
                setShowAutoReply(false);
                setCreateLead(true);
                fetchData();
            } else {
                toast.error("Erro ao criar regra");
            }
        } catch {
            toast.error("Erro de conexão");
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        try {
            setIsUploading(true);
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload`, {
                method: "POST",
                body: formData,
                credentials: "include",
            });

            if (res.ok) {
                const data = await res.json();
                setReplyMediaUrl(data.url);
                toast.success("Arquivo carregado com sucesso!");
            } else {
                toast.error("Erro ao carregar arquivo");
            }
        } catch {
            toast.error("Erro de conexão no upload");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tracking/rules/${id}`, {
                method: "DELETE",
                credentials: "include"
            });
            toast.success("Regra removida");
            const newRules = rules.filter(r => r.id !== id);
            setRules(newRules);
        } catch {
            toast.error("Erro ao remover");
        }
    };

    // Filter stages based on selected funnel
    const activeFunnelStages = funnels.find(f => f.id.toString() === selectedFunnelId)?.stages || [];

    return (
        <div className="p-8 space-y-6">
            <div>
                <h1 className="text-3xl text-foreground mb-2 font-bold tracking-tight">Rastreamento de Leads</h1>
                <p className="text-muted-foreground">Automatize a classificação dos leads baseado nas mensagens recebidas.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Form Card */}
                <Card className="md:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle>Nova Regra</CardTitle>
                        <CardDescription>Quando o cliente disser...</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Palavras-Chave (separadas por vírgula)</Label>
                                <Input 
                                    placeholder="Ex: preço, valor, quanto custa" 
                                    value={keywords}
                                    onChange={(e) => setKeywords(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                           <Label>Tipo de Ação</Label>
                           <Select value={targetType} onValueChange={(v: "legacy" | "funnel") => setTargetType(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="funnel">Mover para Funil</SelectItem>
                                    <SelectItem value="legacy">Alterar Status (Simples)</SelectItem>
                                </SelectContent>
                           </Select>
                        </div>

                        {targetType === "funnel" ? (
                             <>
                                <div className="space-y-2">
                                    <Label>Funil</Label>
                                    <Select value={selectedFunnelId} onValueChange={setSelectedFunnelId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione o funil" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {funnels.map(f => (
                                                <SelectItem key={f.id} value={f.id.toString()}>{f.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Estágio</Label>
                                    <Select value={selectedStageId} onValueChange={setSelectedStageId} disabled={!selectedFunnelId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione o estágio" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {activeFunnelStages.map(s => (
                                                <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                             </>
                        ) : (
                            <div className="space-y-2">
                                <Label>Status Alvo</Label>
                                <Select value={legacyStatus} onValueChange={setLegacyStatus}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Novo">Novo</SelectItem>
                                        <SelectItem value="Frio">Frio</SelectItem>
                                        <SelectItem value="Aquecido">Aquecido</SelectItem>
                                        <SelectItem value="Fechado">Fechado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Configurações Adicionais */}
                        <div className="pt-4 border-t space-y-4">
                            {/* Auto Create Lead Toggle */}
                            <div className="flex items-center justify-between">
                                <Label className="flex items-center gap-2 cursor-pointer" onClick={() => setCreateLead(!createLead)}>
                                    <div className={`w-4 h-4 rounded-sm border flex items-center justify-center transition-colors ${createLead ? 'bg-primary border-primary text-primary-foreground' : 'border-border'}`}>
                                        {createLead && <CheckCheck className="w-3 h-3" />}
                                    </div>
                                    <span className="text-sm font-medium">Criar Lead Automaticamente</span>
                                </Label>
                                <span className="text-[10px] text-muted-foreground">
                                    Se desativado, apenas a mensagem será respondida.
                                </span>
                            </div>

                            {/* Auto Reply Section */}
                            <div className="flex items-center justify-between mt-2">
                                <Label className="flex items-center gap-2 cursor-pointer" onClick={() => setShowAutoReply(!showAutoReply)}>
                                    <MessageSquare className="w-4 h-4 text-primary" />
                                    <span className="text-sm font-medium">Resposta Automática</span>
                                </Label>
                                <div className="flex items-center gap-2">
                                    {showAutoReply && (
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="h-7 px-2 text-[10px] border-primary/20 text-primary hover:bg-primary/5"
                                            onClick={() => setIsConfigModalOpen(true)}
                                        >
                                            <Settings2 className="w-3 h-3 mr-1" />
                                            Configurar
                                        </Button>
                                    )}
                                    <Button 
                                        variant={showAutoReply ? "default" : "outline"} 
                                        size="sm" 
                                        className={`h-7 text-[10px] ${showAutoReply ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}`}
                                        onClick={() => setShowAutoReply(!showAutoReply)}
                                    >
                                        {showAutoReply ? "Ativado" : "Desativado"}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Modal de Configuração */}
                        <Dialog open={isConfigModalOpen} onOpenChange={setIsConfigModalOpen}>
                            <DialogContent className="max-w-md bg-card">
                                <DialogHeader>
                                    <DialogTitle>Configurar Resposta Automática</DialogTitle>
                                    <DialogDescription>
                                        Configure a mensagem que será enviada automaticamente.
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label>Mensagem de Resposta</Label>
                                            <div className="flex gap-1">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6">
                                                            <Smile className="h-4 w-4 text-muted-foreground/60" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent className="w-fit p-2 grid grid-cols-4 gap-1 bg-popover">
                                                        {emojis.map(e => (
                                                            <button 
                                                                key={e} 
                                                                className="p-2 hover:bg-muted rounded text-xl"
                                                                onClick={() => setReplyMessage(prev => prev + e)}
                                                            >
                                                                {e}
                                                            </button>
                                                        ))}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                        <textarea 
                                            className="w-full p-2 border border-border rounded-xl text-sm min-h-[120px] focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-muted/50 text-foreground"
                                            placeholder="Olá {pushname}, recebemos sua mensagem sobre..."
                                            value={replyMessage}
                                            onChange={(e) => setReplyMessage(e.target.value)}
                                        />
                                        
                                        {/* Variables UI */}
                                        <div className="space-y-1.5">
                                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Variáveis Disponíveis</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {variables.map(v => (
                                                    <button 
                                                        key={v}
                                                        onClick={() => setReplyMessage(prev => prev + v)}
                                                        className="px-2 py-0.5 bg-muted hover:bg-primary/10 text-primary-foreground/70 rounded text-[11px] font-mono border border-border transition-colors text-foreground"
                                                    >
                                                        {v}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Mídia de Anexo (Opcional)</Label>
                                        <div className="grid grid-cols-1 gap-2">
                                            <Select value={replyMediaType || "text"} onValueChange={(v: "text" | "image" | "document" | "video") => setReplyMediaType(v)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Tipo de Mídia" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="text">Apenas Texto</SelectItem>
                                                    <SelectItem value="image">Imagem (JPG/PNG)</SelectItem>
                                                    <SelectItem value="video">Vídeo (MP4)</SelectItem>
                                                    <SelectItem value="document">Documento (PDF/DocX)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {replyMediaType !== "text" && (
                                                <div className="space-y-2">
                                                    <div className="flex gap-2">
                                                        <Input 
                                                            type="file" 
                                                            className="hidden" 
                                                            ref={fileInputRef}
                                                            onChange={handleUpload}
                                                            accept={
                                                                replyMediaType === "image" ? "image/*" :
                                                                replyMediaType === "video" ? "video/*" :
                                                                ".pdf,.doc,.docx"
                                                            }
                                                        />
                                                        <div className="flex-1 overflow-hidden border border-dashed border-border rounded-md p-2 flex items-center justify-between bg-muted/30">
                                                            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                                {replyMediaUrl ? replyMediaUrl.split('/').pop() : "Nenhum arquivo selecionado"}
                                                            </span>
                                                            <Button 
                                                                type="button"
                                                                variant="outline" 
                                                                size="sm" 
                                                                className="h-7 text-[10px]"
                                                                onClick={() => fileInputRef.current?.click()}
                                                                disabled={isUploading}
                                                            >
                                                                {isUploading ? "Enviando..." : "Selecionar"}
                                                            </Button>
                                                        </div>
                                                        {replyMediaUrl && (
                                                            <Button 
                                                                type="button"
                                                                variant="ghost" 
                                                                size="sm" 
                                                                className="h-8 w-8 p-0 text-red-500"
                                                                onClick={() => setReplyMediaUrl("")}
                                                            >
                                                                <Trash className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <Label className="text-[10px] text-muted-foreground">Ou cole uma URL pública</Label>
                                                        <Input 
                                                            placeholder="https://..." 
                                                            value={replyMediaUrl}
                                                            onChange={(e) => setReplyMediaUrl(e.target.value)}
                                                            className="h-8 text-xs"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <DialogFooter>
                                    <Button onClick={() => setIsConfigModalOpen(false)} className="bg-blue-600 hover:bg-blue-700">
                                        Salvar Configuração
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mt-4" onClick={handleCreate}>
                            <Plus className="mr-2 h-4 w-4" /> Adicionar Regra
                        </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* List Card */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Regras Ativas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Palavras-Chave</TableHead>
                                    <TableHead>Ação</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rules.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                                            Nenhuma regra criada.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    rules.map((rule) => (
                                        <TableRow key={rule.id}>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {rule.keywords.split(',').map((k, i) => (
                                                        <span key={i} className="px-2 py-1 bg-muted rounded-md text-xs font-medium text-foreground border border-border">
                                                            {k.trim()}
                                                        </span>
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {rule.funnel ? (
                                                        <div className="flex items-center gap-2">
                                                            <ArrowRight className="w-4 h-4 text-muted-foreground/40" />
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant="outline">{rule.funnel.name}</Badge>
                                                                <span>/</span>
                                                                <Badge className={`${rule.stage?.color || 'bg-primary'} text-primary-foreground border-none`}>
                                                                    {rule.stage?.name || 'Estágio'}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <Badge variant="secondary">{rule.targetStatus || "Status"}</Badge>
                                                    )}
                                                    {rule.replyMessage && (
                                                        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 flex items-center gap-1 shadow-none">
                                                            <MessageSquare className="w-3 h-3" />
                                                            Auto-reply
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={() => handleDelete(rule.id)}>
                                                    <Trash className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

