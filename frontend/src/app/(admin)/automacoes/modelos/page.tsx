"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Facebook, MessageCircle, GitCommit, Save, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function MetaAutomationTemplatePage() {
    const [loading, setLoading] = useState(true);
    const [pages, setPages] = useState<any[]>([]);
    const [forms, setForms] = useState<any[]>([]);
    const [funnels, setFunnels] = useState<any[]>([]);
    const [connections, setConnections] = useState<any[]>([]);
    
    // Form State
    const [name, setName] = useState("Automação: Captura Meta Ads");
    const [selectedPageId, setSelectedPageId] = useState("");
    const [selectedFormId, setSelectedFormId] = useState("");
    
    // Actions State
    const [moveFunnel, setMoveFunnel] = useState(true);
    const [selectedFunnelId, setSelectedFunnelId] = useState("");
    const [selectedStageId, setSelectedStageId] = useState("");
    
    const [sendWhatsapp, setSendWhatsapp] = useState(false);
    const [selectedConnectionId, setSelectedConnectionId] = useState("");
    const [whatsappMessage, setWhatsappMessage] = useState("Olá! Recebemos seu interesse através do nosso anúncio.");

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [pagesRes, funnelsRes, connRes] = await Promise.all([
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/meta/pages`, { credentials: "include" }),
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/funnel`, { credentials: "include" }),
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/connections`, { credentials: "include" }) // Need active connections
                ]);

                if (pagesRes.ok) setPages(await pagesRes.json());
                if (funnelsRes.ok) setFunnels(await funnelsRes.json());
                if (connRes.ok) {
                    const allConn = await connRes.json();
                    // filter only connected whatsapp OR evolution providers
                    setConnections(allConn.filter((c: any) => c.status === "connected" && (c.provider === "EVOLUTION" || c.provider === "whatsapp")));
                }
            } catch (error) {
                toast.error("Erro ao carregar dados iniciais");
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    const handlePageChange = async (pageId: string) => {
        setSelectedPageId(pageId);
        setSelectedFormId("");
        
        if (pageId === "ALL") {
            setForms([]);
            return;
        }
        
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/meta/pages/${pageId}/forms`, { credentials: "include" });
            if (res.ok) {
                setForms(await res.json());
            }
        } catch (error) {
            toast.error("Erro ao carregar formulários da página");
        }
    };

    const handleSave = async () => {
        if (!selectedPageId || !selectedFormId) {
            return toast.error("Selecione a Página e o Formulário de origem.");
        }
        
        if (moveFunnel && (!selectedFunnelId || !selectedStageId)) {
            return toast.error("Selecione o Funil e a Etapa de destino.");
        }
        
        if (sendWhatsapp && (!selectedConnectionId || !whatsappMessage)) {
            return toast.error("Selecione a Conexão de WhatsApp e escreva a mensagem.");
        }

        const payload = {
            name,
            triggerEvent: "META_LEAD_RECEIVED",
            triggerConditions: {
                pageId: selectedPageId === "ALL" ? "ALL" : Number(selectedPageId),
                formId: selectedFormId
            },
            actionType: "META_LEAD_ROUTING",
            actionConfig: {
                moveFunnel,
                funnelId: moveFunnel ? Number(selectedFunnelId) : null,
                stageId: moveFunnel ? Number(selectedStageId) : null,
                sendWhatsapp,
                connectionId: sendWhatsapp ? Number(selectedConnectionId) : null,
                whatsappMessage: sendWhatsapp ? whatsappMessage : null
            },
            isActive: true
        };

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/automations`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                credentials: "include"
            });

            if (res.ok) {
                toast.success("Automação criada com sucesso!");
                // optionally redirect back to /automacoes
            } else {
                toast.error("Erro ao salvar automação");
            }
        } catch (error) {
            toast.error("Falha na comunicação com o servidor.");
        }
    };

    if (loading) return <div className="p-8">Carregando formulário de automação...</div>;

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-300">
            
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">Modelo: Lead Meta Ads</h1>
                    <p className="text-gray-500">Configure rotas e disparos automáticos quando um Lead entrar via Meta.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* TRIGGER SECTION */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-full"><Facebook className="text-blue-600 h-6 w-6" /></div>
                        <h2 className="text-xl font-bold">Gatilho da Automação</h2>
                    </div>
                    
                    <Card className="border-blue-100 shadow-sm bg-blue-50/10">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg">Origem do Lead</CardTitle>
                            <CardDescription>Qual formulário deve disparar esta automação?</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Nome da Automação</Label>
                                <input 
                                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    value={name} 
                                    onChange={(e) => setName(e.target.value)} 
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Página do Facebook</Label>
                                <Select value={selectedPageId} onValueChange={handlePageChange}>
                                    <SelectTrigger className="bg-white">
                                        <SelectValue placeholder="Selecione uma Página..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">Todas as Páginas (Qualquer)</SelectItem>
                                        {pages.map(p => (
                                            <SelectItem key={p.id} value={p.id.toString()}>{p.name} {!p.isConnected && "(Sincronização Inativa)"}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {selectedPageId && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                    <Label>Formulário de Lead Ads</Label>
                                    <Select value={selectedFormId} onValueChange={setSelectedFormId}>
                                        <SelectTrigger className="bg-white">
                                            <SelectValue placeholder="Selecione o Formulário..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {selectedPageId !== "ALL" && forms.map(f => (
                                                <SelectItem key={f.formId} value={f.formId.toString()}>{f.name}</SelectItem>
                                            ))}
                                            <SelectItem value="ALL">Qualquer Formulário</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* ACTIONS SECTION */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-emerald-100 p-2 rounded-full"><GitCommit className="text-emerald-600 h-6 w-6" /></div>
                        <h2 className="text-xl font-bold">Ações a Executar</h2>
                    </div>

                    <Card className="border-emerald-100 shadow-sm bg-emerald-50/10">
                        <CardContent className="space-y-6 pt-6">
                            
                            {/* ACTION 1: FUNNEL */}
                            <div className="relative p-4 border rounded-xl bg-white shadow-sm space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-base font-bold text-gray-800">Mover para o Funil</Label>
                                        <p className="text-xs text-gray-500">Adiciona o lead automaticamente no Kanban de vendas.</p>
                                    </div>
                                    <Switch checked={moveFunnel} onCheckedChange={setMoveFunnel} />
                                </div>
                                
                                {moveFunnel && (
                                    <div className="space-y-3 animate-in fade-in mt-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <Label className="text-xs text-gray-500">Funil</Label>
                                                <Select value={selectedFunnelId} onValueChange={(val) => { setSelectedFunnelId(val); setSelectedStageId(""); }}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Funil..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {funnels.map(f => (
                                                            <SelectItem key={f.id} value={f.id.toString()}>{f.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs text-gray-500">Etapa</Label>
                                                <Select value={selectedStageId} onValueChange={setSelectedStageId}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Etapa..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {funnels.find(f => f.id.toString() === selectedFunnelId)?.stages.map((s: any) => (
                                                            <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* ACTION 2: WHATSAPP */}
                            <div className="relative p-4 border rounded-xl bg-white shadow-sm space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <MessageCircle className="text-emerald-500 h-5 w-5" />
                                        <div>
                                            <Label className="text-base font-bold text-gray-800">Enviar WhatsApp</Label>
                                            <p className="text-xs text-gray-500">Dispara uma mensagem de saudação via WhatsApp.</p>
                                        </div>
                                    </div>
                                    <Switch checked={sendWhatsapp} onCheckedChange={setSendWhatsapp} />
                                </div>

                                {sendWhatsapp && (
                                    <div className="space-y-4 animate-in fade-in mt-4">
                                        <div className="space-y-1">
                                            <Label className="text-xs text-gray-500">Canal de Envio (Conexão)</Label>
                                            <Select value={selectedConnectionId} onValueChange={setSelectedConnectionId}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione um número de WhatsApp..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {connections.map(c => (
                                                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                                    ))}
                                                    {connections.length === 0 && (
                                                        <SelectItem value="null" disabled>Nenhuma conexão ativa encontrada</SelectItem>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs text-gray-500">Mensagem</Label>
                                            <Textarea 
                                                value={whatsappMessage} 
                                                onChange={(e) => setWhatsappMessage(e.target.value)} 
                                                className="min-h-[100px] text-sm"
                                                placeholder="Olá! Recebemos seu interesse..." 
                                            />
                                            <p className="text-[10px] text-gray-400">Dica: Use palavras neutras e não tente spam, pois Meta aplica bans severos.</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* ACTION FOOTER */}
            <div className="flex justify-end pt-4 border-t">
                <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 h-12 px-8 text-lg font-bold shadow-lg shadow-emerald-200">
                    <Save className="mr-2 h-5 w-5" />
                    Ativar Automação
                </Button>
            </div>
            
        </div>
    );
}
