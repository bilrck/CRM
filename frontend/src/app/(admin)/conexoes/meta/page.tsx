"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Facebook, 
    Settings, 
    RefreshCw, 
    AlertTriangle,
    Database,
    ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function MetaIntegrationPage() {
    const [loading, setLoading] = useState(true);
    const [pages, setPages] = useState<any[]>([]);
    const [funnels, setFunnels] = useState<any[]>([]);
    const [selectedPage, setSelectedPage] = useState<any>(null);
    const [selectedPageForms, setSelectedPageForms] = useState<any[]>([]);
    const [isMappingDialogOpen, setIsMappingDialogOpen] = useState(false);
    const [activeMappingForm, setActiveMappingForm] = useState<any>(null);
    const [mappingConfig, setMappingConfig] = useState({ funnelId: "", stageId: "" });
    const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false);
    const [connectForm, setConnectForm] = useState({ accessToken: "", fbUserId: "", name: "Minha Conta Facebook" });

    // Fetch initial data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [pagesRes, funnelsRes] = await Promise.all([
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/meta/pages`, { credentials: "include" }),
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/funnel`, { credentials: "include" })
                ]);

                if (pagesRes.ok) setPages(await pagesRes.json());
                if (funnelsRes.ok) setFunnels(await funnelsRes.json());
            } catch (error) {
                console.error("Erro loading meta space:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleConnect = () => {
        setConnectForm({ accessToken: "", fbUserId: "", name: "Minha Conta Facebook" });
        setIsConnectDialogOpen(true);
    };

    const onConnectSubmit = async () => {
        if (!connectForm.accessToken || !connectForm.fbUserId) {
            toast.error("Preencha todos os campos obrigatórios");
            return;
        }
        await saveConnection(connectForm.accessToken, connectForm.fbUserId, connectForm.name);
    };

    const saveConnection = async (accessToken: string, fbUserId: string, name: string = "Minha Conta Facebook") => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/meta/connect`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ accessToken, fbUserId, name }),
                credentials: "include"
            });

            if (res.ok) {
                toast.success("Conectado com sucesso!");
                window.location.reload();
            } else {
                toast.error("Erro ao conectar");
            }
        } catch (error) {
            toast.error("Erro no servidor");
        }
    };

    const togglePageSync = async (pageId: number, isConnected: boolean) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/meta/pages/${pageId}/sync`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isConnected }),
                credentials: "include"
            });

            if (res.ok) {
                setPages(pages.map(p => p.id === pageId ? { ...p, isConnected } : p));
                toast.success(isConnected ? "Sincronização ativada" : "Sincronização desativada");
            } else {
                const err = await res.json();
                toast.error(err.error || "Erro ao atualizar sincronização da página");
            }
        } catch (error) {
            toast.error("Erro na comunicação com o servidor");
        }
    };

    const handleManageForms = async (page: any) => {
        setLoading(true);
        setSelectedPage(page);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/meta/pages/${page.id}/forms`, { credentials: "include" });
            if (res.ok) {
                setSelectedPageForms(await res.json());
            }
        } catch (error) {
            toast.error("Erro ao buscar formulários");
        } finally {
            setLoading(false);
        }
    };

    const openMappingModal = (form: any) => {
        setActiveMappingForm(form);
        setMappingConfig({ 
            funnelId: form.funnelId?.toString() || "", 
            stageId: form.stageId?.toString() || "" 
        });
        setIsMappingDialogOpen(true);
    };

    const saveMapping = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/meta/forms/${activeMappingForm.id}/map`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    funnelId: Number(mappingConfig.funnelId), 
                    stageId: Number(mappingConfig.stageId) 
                }),
                credentials: "include"
            });

            if (res.ok) {
                toast.success("Mapeamento salvo!");
                setIsMappingDialogOpen(false);
                // Refresh small forms list
                setSelectedPageForms(selectedPageForms.map(f => f.id === activeMappingForm.id 
                    ? { ...f, funnelId: Number(mappingConfig.funnelId), stageId: Number(mappingConfig.stageId) } 
                    : f
                ));
            }
        } catch (error) {
            toast.error("Erro ao salvar mapeamento");
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="bg-blue-600 p-2 rounded-xl">
                        <Facebook className="text-white h-8 w-8" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-extrabold text-gray-900 leading-tight">Meta Ads</h1>
                        <p className="text-gray-500 text-lg">Gerencie Lead Ads, Graph API e Conversions via Meta.</p>
                    </div>
                </div>
                <Button 
                    onClick={handleConnect}
                    className="bg-blue-600 hover:bg-blue-700 h-12 px-6 text-lg font-semibold shadow-lg shadow-blue-200"
                >
                    <RefreshCw className="mr-2 h-5 w-5" /> Conectar Nova Conta
                </Button>
            </div>

            <Tabs defaultValue="pages" className="w-full">
                <TabsList className="bg-gray-100/50 p-1 mb-6">
                    <TabsTrigger value="pages" className="text-md px-6 py-2">Páginas & Lead Ads</TabsTrigger>
                    <TabsTrigger value="settings" className="text-md px-6 py-2">Configurações Avançadas</TabsTrigger>
                </TabsList>

                <TabsContent value="pages" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pages.length === 0 && !loading && (
                            <Card className="col-span-full py-12 border-dashed">
                                <CardContent className="flex flex-col items-center justify-center text-center">
                                    <div className="bg-gray-100 p-4 rounded-full mb-4">
                                        <AlertTriangle className="text-gray-400 h-10 w-10" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">Nenhuma página encontrada</h3>
                                    <p className="text-gray-500 mb-6 max-w-sm">
                                        Conecte sua conta Meta para listar as páginas que você gerencia e ativar a captura automática de leads.
                                    </p>
                                    <Button onClick={handleConnect} variant="outline">Configurar Conexão</Button>
                                </CardContent>
                            </Card>
                        )}

                        {pages.map((page) => (
                            <Card key={page.id} className={`overflow-hidden transition-all hover:shadow-md ${page.isConnected ? 'border-blue-500 ring-1 ring-blue-500/20' : ''}`}>
                                <div className="h-2 bg-blue-600" />
                                <CardHeader className="pb-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            {page.pictureUrl ? (
                                                <img src={page.pictureUrl} className="w-12 h-12 rounded-lg object-cover border" alt={page.name} />
                                            ) : (
                                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold">
                                                    {page.name.charAt(0)}
                                                </div>
                                            )}
                                            <div>
                                                <CardTitle className="text-lg line-clamp-1">{page.name}</CardTitle>
                                                <CardDescription className="text-xs uppercase font-semibold text-gray-400">{page.category || 'Página Meta'}</CardDescription>
                                            </div>
                                        </div>
                                        <Switch 
                                            checked={page.isConnected} 
                                            onCheckedChange={(val) => togglePageSync(page.id, val)}
                                        />
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between text-sm py-2 px-3 bg-gray-50 rounded-lg">
                                        <span className="text-gray-600">Sincronização:</span>
                                        <Badge variant={page.isConnected ? "default" : "secondary"}>
                                            {page.isConnected ? 'Ativa' : 'Pausada'}
                                        </Badge>
                                    </div>
                                    
                                    <div className="space-y-1">
                                        <Button 
                                            variant="outline" 
                                            className="w-full justify-between group"
                                            disabled={!page.isConnected}
                                            onClick={() => handleManageForms(page)}
                                            title={!page.isConnected ? "Ative a sincronização primeiro" : "Ver Formulários Mapeáveis"}
                                        >
                                            <div className="flex items-center">
                                                <Database size={16} className="mr-2 text-blue-600" />
                                                Gerenciar Formulários
                                            </div>
                                            <ChevronRight size={16} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
                                        </Button>
                                        {!page.isConnected && (
                                            <p className="text-xs text-center text-gray-400">Ative a chave acima para gerenciar formulários.</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Empty State for Forms when Page is selected but no forms exist */}
                    {selectedPage && selectedPageForms.length === 0 && !loading && (
                        <Card className="animate-in fade-in slide-in-from-top-4 duration-300 border-amber-200 bg-amber-50">
                            <CardContent className="flex flex-col items-center justify-center text-center py-8">
                                <AlertTriangle className="text-amber-500 h-10 w-10 mb-4" />
                                <h3 className="text-lg font-bold text-amber-800 mb-2">Nenhum formulário encontrado</h3>
                                <p className="text-amber-700 max-w-md">
                                    A página <strong>{selectedPage.name}</strong> não possui formulários de Lead Ads ativos no Meta. 
                                    Crie um formulário no seu Gerenciador de Anúncios para mapeá-lo aqui.
                                </p>
                                <Button variant="outline" className="mt-4 border-amber-300 text-amber-700 hover:bg-amber-100" onClick={() => setSelectedPage(null)}>Fechar</Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* Forms Mapping List - Appears when page is selected */}
                    {selectedPageForms.length > 0 && (
                        <Card className="animate-in fade-in slide-in-from-top-4 duration-300">
                            <CardHeader className="bg-gray-50/50 border-b">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-xl">Formulários de Lead Ads: {selectedPage?.name}</CardTitle>
                                        <CardDescription>Mapeie cada formulário para um funil e etapa específicos.</CardDescription>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => { setSelectedPageForms([]); setSelectedPage(null); }} className="text-red-500 hover:text-red-600">Fechar</Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50/30 text-gray-500 text-sm border-b">
                                                <th className="px-6 py-4 font-semibold uppercase">Formulário</th>
                                                <th className="px-6 py-4 font-semibold uppercase">Status</th>
                                                <th className="px-6 py-4 font-semibold uppercase">Destino (Funil)</th>
                                                <th className="px-6 py-4 font-semibold uppercase text-right">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {selectedPageForms.map((form) => (
                                                <tr key={form.id} className="hover:bg-gray-50/20 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-gray-800">{form.name}</div>
                                                        <div className="text-xs text-gray-400 font-mono">ID: {form.formId}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Badge variant={form.status === 'ACTIVE' ? 'outline' : 'secondary'} className={form.status === 'ACTIVE' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : ''}>
                                                            {form.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {form.funnel ? (
                                                            <div className="flex items-center gap-2">
                                                                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none">{form.funnel.name}</Badge>
                                                                <ChevronRight size={14} className="text-gray-300" />
                                                                <Badge variant="outline" className="border-blue-200 text-blue-600">{form.stage?.name || 'Início'}</Badge>
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-amber-600 flex items-center gap-1 font-semibold">
                                                                <AlertTriangle size={14} /> Não Mapeado
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <Button variant="ghost" size="sm" onClick={() => openMappingModal(form)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                                            <Settings size={16} className="mr-1" /> Mapear
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="settings">
                    <Card>
                        <CardHeader>
                            <CardTitle>Configurações Globais da Meta</CardTitle>
                            <CardDescription>Configure o comportamento do Webhook e Conversions API (CAPI).</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="p-4 border rounded-xl space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-md font-bold">Meta Conversions API (CAPI)</Label>
                                        <Switch />
                                    </div>
                                    <p className="text-sm text-gray-500">Envia eventos de fechamento do CRM de volta para o pixel da Meta para otimizar suas campanhas.</p>
                                    <div className="space-y-2">
                                        <Label className="text-xs">Pixel ID</Label>
                                        <Input placeholder="Cole o Pixel ID aqui..." />
                                    </div>
                                </div>
                                <div className="p-4 border rounded-xl bg-gray-50/50 space-y-4">
                                    <div className="flex items-center gap-2">
                                        <div className="bg-blue-100 p-1.5 rounded-lg">
                                            <Settings className="text-blue-600 h-4 w-4" />
                                        </div>
                                        <Label className="text-md font-bold">Configuração do Webhook</Label>
                                    </div>
                                    <p className="text-sm text-gray-500">Copie estes dados para o seu Aplicativo na Meta (Developers).</p>
                                    <div className="space-y-3">
                                        <div className="space-y-1">
                                            <Label className="text-[10px] uppercase font-bold text-gray-400">Callback URL</Label>
                                            <div className="flex gap-2">
                                                <Input readOnly value={`${process.env.NEXT_PUBLIC_API_URL}/api/webhooks/meta`} className="bg-white text-xs font-mono" />
                                                <Button variant="outline" size="sm" onClick={() => {
                                                    navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_API_URL}/api/webhooks/meta`);
                                                    toast.success("Copiado!");
                                                }}>Copiar</Button>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] uppercase font-bold text-gray-400">Verify Token</Label>
                                            <div className="flex gap-2">
                                                <Input readOnly value="rastreia_ai_meta_token" className="bg-white text-xs font-mono" />
                                                <Button variant="outline" size="sm" onClick={() => {
                                                    navigator.clipboard.writeText("rastreia_ai_meta_token");
                                                    toast.success("Copiado!");
                                                }}>Copiar</Button>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-amber-600 font-medium">
                                        ⚠️ Certifique-se de que o Verify Token seja o mesmo definido no seu arquivo .env
                                    </p>
                                </div>
                                <div className="p-4 border rounded-xl space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-md font-bold">Aviso de Lead Instantâneo</Label>
                                        <Switch defaultChecked />
                                    </div>
                                    <p className="text-sm text-gray-500">Notifica a equipe via dashboard e som assim que um lead entrar vindo de um anúncio.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Mapping Dialog */}
            <Dialog open={isMappingDialogOpen} onOpenChange={setIsMappingDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Mapear Formulário: {activeMappingForm?.name}</DialogTitle>
                        <DialogDescription>
                            Escolha para onde os leads vindos deste formulário serão enviados.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Selecionar Funil</Label>
                            <Select 
                                value={mappingConfig.funnelId} 
                                onValueChange={(val) => setMappingConfig({ ...mappingConfig, funnelId: val, stageId: "" })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um funil..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {funnels.map(f => (
                                        <SelectItem key={f.id} value={f.id.toString()}>{f.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {mappingConfig.funnelId && (
                            <div className="space-y-2">
                                <Label>Selecionar Etapa</Label>
                                <Select 
                                    value={mappingConfig.stageId} 
                                    onValueChange={(val) => setMappingConfig({ ...mappingConfig, stageId: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione uma etapa..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {funnels.find(f => f.id.toString() === mappingConfig.funnelId)?.stages.map((s: any) => (
                                            <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsMappingDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={saveMapping} className="bg-blue-600">Salvar Mapeamento</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Connect Account Dialog */}
            <Dialog open={isConnectDialogOpen} onOpenChange={setIsConnectDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Facebook className="text-blue-600" size={20} />
                            Conectar Conta Meta
                        </DialogTitle>
                        <DialogDescription>
                            Insira suas credenciais da Meta para sincronizar suas páginas e Lead Ads.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="acc_name">Nome da Identificação</Label>
                            <Input 
                                id="acc_name"
                                placeholder="Ex: Minha Conta Business"
                                value={connectForm.name}
                                onChange={(e) => setConnectForm({ ...connectForm, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="fb_id">Meta User ID</Label>
                            <Input 
                                id="fb_id"
                                placeholder="ID do usuário (ex: 1000...)"
                                value={connectForm.fbUserId}
                                onChange={(e) => setConnectForm({ ...connectForm, fbUserId: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="access_token">User Access Token</Label>
                            <Input 
                                id="access_token"
                                type="password"
                                placeholder="EAAG..."
                                value={connectForm.accessToken}
                                onChange={(e) => setConnectForm({ ...connectForm, accessToken: e.target.value })}
                            />
                            <p className="text-[10px] text-gray-400">Obtenha o token no Portal de Desenvolvedores da Meta.</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsConnectDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={onConnectSubmit} className="bg-blue-600 hover:bg-blue-700">Conectar Agora</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
