"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
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
    TrendingUp,
    DollarSign,
    Target,
    Briefcase,
    Instagram,
    ChevronDown
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
    const [mappingConfig, setMappingConfig] = useState({ funnelId: "", stageId: "", autoCreateFields: false });
    const [connectingOAuth, setConnectingOAuth] = useState(false);
    const [adAccounts, setAdAccounts] = useState<any[]>([]);
    const [businesses, setBusinesses] = useState<any[]>([]);
    const [expandedBusinessId, setExpandedBusinessId] = useState<string | null>(null);
    const [businessAssets, setBusinessAssets] = useState<Record<string, any>>({});
    const [loadingBusinessAssets, setLoadingBusinessAssets] = useState<Record<string, boolean>>({});
    const [syncing, setSyncing] = useState(false);
    const [metaStatus, setMetaStatus] = useState<string>("disconnected");
    const [metaConfig, setMetaConfig] = useState<any>({
        leadDistribution: "all",
        ignoreDuplicates: true,
        duplicateWindowHours: 24,
        notifyWhatsApp: true,
        notifyEmail: false,
        pixelId: "",
        reportModules: {
            summary: true,
            campaigns: true,
            pages: true,
            insights: true,
            leads: true,
            adAccounts: true
        }
    });
    const searchParams = useSearchParams();


    // Fetch initial data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [pagesRes, funnelsRes, adAccountsRes, settingsRes, businessesRes] = await Promise.all([
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/meta/pages`, { credentials: "include" }),
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/funnel`, { credentials: "include" }),
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/meta/ad-accounts`, { credentials: "include" }),
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/meta/settings`, { credentials: "include" }),
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/meta/businesses`, { credentials: "include" })
                ]);

                if (pagesRes.ok) {
                    const pagesData = await pagesRes.json();
                    setPages(pagesData);
                    if (pagesData.length > 0) setMetaStatus("active");
                }
                if (funnelsRes.ok) setFunnels(await funnelsRes.json());
                if (adAccountsRes.ok) setAdAccounts(await adAccountsRes.json());
                if (settingsRes.ok) setMetaConfig(await settingsRes.json());
                if (businessesRes.ok) setBusinesses(await businessesRes.json());
            } catch (error) {
                console.error("Erro loading meta space:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Handle OAuth callback result from URL params
    useEffect(() => {
        const success = searchParams.get("success");
        const error = searchParams.get("error");
        const name = searchParams.get("pages");
        if (success === "1") {
            toast.success(`Conta "${name || 'Meta'}" conectada com sucesso!`);
            // Reload pages after successful connect
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/meta/pages`, { credentials: "include" })
                .then(r => r.ok ? r.json() : [])
                .then(setPages);
        } else if (error) {
            const msgs: Record<string, string> = {
                facebook_denied: "Permissão negada pelo Facebook.",
                token_exchange_failed: "Falha ao trocar o token. Verifique as configurações do App Meta.",
                user_info_failed: "Não foi possível obter informações do usuário Meta.",
                server_error: "Erro interno do servidor ao conectar.",
                invalid_callback: "Callback inválido. Tente novamente.",
            };
            toast.error(msgs[error] || "Erro ao conectar com a Meta.");
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const toggleBusinessExpansion = async (bizId: string) => {
        if (expandedBusinessId === bizId) {
            setExpandedBusinessId(null);
            return;
        }
        setExpandedBusinessId(bizId);
        
        // Fetch assets if not already loaded
        if (!businessAssets[bizId]) {
            setLoadingBusinessAssets(prev => ({ ...prev, [bizId]: true }));
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/meta/businesses/${bizId}/assets`, { credentials: "include" });
                if (res.ok) {
                    const data = await res.json();
                    setBusinessAssets(prev => ({ ...prev, [bizId]: data }));
                }
            } catch (error) {
                toast.error("Erro ao carregar ativos do portfólio");
            } finally {
                setLoadingBusinessAssets(prev => ({ ...prev, [bizId]: false }));
            }
        }
    };

    const handleConnect = async () => {
        setConnectingOAuth(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/meta/oauth/url`, { credentials: "include" });
            if (!res.ok) throw new Error("Falha ao obter URL de autenticação");
            const { url } = await res.json();
            window.location.href = url;
        } catch (err: any) {
            toast.error(err.message || "Erro ao iniciar conexão com a Meta");
            setConnectingOAuth(false);
        }
    };

    const handleSync = async () => {
        setSyncing(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/meta/sync`, { method: "POST", credentials: "include" });
            const data = await res.json();
            if (res.ok) {
                toast.success("Dados sincronizados com sucesso!");
                // Refresh data
                const [pagesRes, adAccountsRes, businessesRes] = await Promise.all([
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/meta/pages`, { credentials: "include" }),
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/meta/ad-accounts`, { credentials: "include" }),
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/meta/businesses`, { credentials: "include" })
                ]);
                if (pagesRes.ok) setPages(await pagesRes.json());
                if (adAccountsRes.ok) setAdAccounts(await adAccountsRes.json());
                if (businessesRes.ok) setBusinesses(await businessesRes.json());
            } else {
                toast.error(data.error || "Erro ao sincronizar");
            }
        } catch {
            toast.error("Erro na comunicação com o servidor");
        } finally {
            setSyncing(false);
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
            stageId: form.stageId?.toString() || "",
            autoCreateFields: !!form.autoCreateFields
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
                    stageId: Number(mappingConfig.stageId),
                    autoCreateFields: mappingConfig.autoCreateFields
                }),
                credentials: "include"
            });

            if (res.ok) {
                toast.success("Mapeamento salvo!");
                setIsMappingDialogOpen(false);
                // Refresh small forms list
                setSelectedPageForms(selectedPageForms.map(f => f.id === activeMappingForm.id 
                    ? { ...f, funnelId: Number(mappingConfig.funnelId), stageId: Number(mappingConfig.stageId), autoCreateFields: mappingConfig.autoCreateFields } 
                    : f
                ));
            }
        } catch (error) {
            toast.error("Erro ao salvar mapeamento");
        }
    };

    const saveSettings = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/meta/settings`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ config: metaConfig }),
                credentials: "include"
            });

            if (res.ok) {
                toast.success("Configurações salvas com sucesso!");
            } else {
                toast.error("Erro ao salvar configurações");
            }
        } catch {
            toast.error("Erro de conexão");
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-100">
                        <Facebook className="text-white h-8 w-8" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-4xl font-extrabold text-gray-900 leading-tight">Meta Ads</h1>
                            <Badge className={metaStatus === "active" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none" : "bg-gray-100 text-gray-500 hover:bg-gray-100 border-none"}>
                                {metaStatus === "active" ? "Ativo" : "Desconectado"}
                            </Badge>
                        </div>
                        <p className="text-gray-500 text-lg">Lead Ads, Contas de Anúncios e Performance.</p>
                    </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button 
                        variant="outline"
                        onClick={handleSync}
                        disabled={syncing || metaStatus !== "active"}
                        className="h-12 px-6 font-semibold"
                    >
                        <RefreshCw className={`mr-2 h-5 w-5 ${syncing ? 'animate-spin' : ''}`} />
                        {syncing ? "Sincronizando..." : "Sincronizar"}
                    </Button>
                    <Button 
                        onClick={handleConnect}
                        disabled={connectingOAuth}
                        className="bg-blue-600 hover:bg-blue-700 h-12 px-6 text-lg font-semibold shadow-lg shadow-blue-200 flex-1 sm:flex-none"
                    >
                        {connectingOAuth 
                            ? <RefreshCw className="animate-spin mr-2 h-5 w-5" /> 
                            : <Facebook className="mr-2 h-5 w-5" />}
                        {connectingOAuth ? "Redirecionando..." : metaStatus === "active" ? "Reconectar Conta" : "Conectar Facebook"}
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="pages" className="w-full">
                <TabsList className="bg-gray-100/50 p-1 mb-6">
                    <TabsTrigger value="pages" className="text-md px-6 py-2">Páginas & Lead Ads</TabsTrigger>
                    <TabsTrigger value="portfolios" className="text-md px-6 py-2">Portfólios (BM)</TabsTrigger>
                    <TabsTrigger value="ad-accounts" className="text-md px-6 py-2">Contas de Anúncios</TabsTrigger>
                    <TabsTrigger value="settings" className="text-md px-6 py-2">Configurações</TabsTrigger>
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
                                                <th className="px-6 py-4 font-semibold uppercase">Auto-campos</th>
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
                                                    <td className="px-6 py-4">
                                                        <Badge variant={form.autoCreateFields ? 'default' : 'secondary'} className={form.autoCreateFields ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : ''}>
                                                            {form.autoCreateFields ? '✨ Ativo' : 'Desativado'}
                                                        </Badge>
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
                
                <TabsContent value="portfolios" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {businesses.length === 0 && !loading && (
                            <Card className="col-span-full py-12 border-dashed">
                                <CardContent className="flex flex-col items-center justify-center text-center">
                                    <Briefcase className="text-gray-400 h-10 w-10 mb-4" />
                                    <h3 className="text-xl font-bold">Nenhum Portfólio de Negócios</h3>
                                    <p className="text-gray-500">Não encontramos Gerenciadores de Negócios (BM) vinculados.</p>
                                </CardContent>
                            </Card>
                        )}
                        {businesses.map((biz) => (
                            <Card 
                                key={biz.id} 
                                className={`border-2 transition-all cursor-pointer overflow-hidden ${expandedBusinessId === biz.id ? 'border-blue-500 shadow-lg' : 'hover:border-blue-200'}`}
                                onClick={() => toggleBusinessExpansion(biz.id)}
                            >
                                <CardHeader className="bg-gray-50/50 border-b pb-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-blue-600 p-2 rounded-lg shadow-md">
                                                <Briefcase className="text-white h-5 w-5" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg">{biz.name}</CardTitle>
                                                <p className="text-[10px] text-gray-400 font-mono">ID: {biz.id}</p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="bg-white text-blue-700 border-blue-200 uppercase text-[10px]">
                                            {biz.vertical || "Geral"}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6 pt-6">
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="bg-blue-50 p-3 rounded-xl text-center border border-blue-100">
                                            <p className="text-[10px] text-blue-600 font-bold uppercase">Contas</p>
                                            <p className="text-xl font-black text-blue-900">
                                                {loadingBusinessAssets[biz.id] ? "..." : (businessAssets[biz.id]?.adAccounts?.length || 0)}
                                            </p>
                                        </div>
                                        <div className="bg-emerald-50 p-3 rounded-xl text-center border border-emerald-100">
                                            <p className="text-[10px] text-emerald-600 font-bold uppercase">Páginas</p>
                                            <p className="text-xl font-black text-emerald-900">
                                                {loadingBusinessAssets[biz.id] ? "..." : (businessAssets[biz.id]?.pages?.length || 0)}
                                            </p>
                                        </div>
                                        <div className="bg-purple-50 p-3 rounded-xl text-center border border-purple-100">
                                            <p className="text-[10px] text-purple-600 font-bold uppercase">Insta</p>
                                            <p className="text-xl font-black text-purple-900">
                                                {loadingBusinessAssets[biz.id] ? "..." : (businessAssets[biz.id]?.instagramAccounts?.length || 0)}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {expandedBusinessId === biz.id && (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300 border-t pt-6">
                                            {loadingBusinessAssets[biz.id] ? (
                                                <div className="py-8 text-center text-gray-400 animate-pulse">Carregando ativos do negócio...</div>
                                            ) : (
                                                <>
                                                    {/* Detailed Ad Accounts */}
                                                    {businessAssets[biz.id]?.adAccounts?.length > 0 && (
                                                        <div className="space-y-3">
                                                            <div className="flex items-center gap-2 text-blue-700 font-bold text-sm">
                                                                <Target size={16} /> Contas de Anúncios
                                                            </div>
                                                            <div className="grid gap-2">
                                                                {businessAssets[biz.id].adAccounts.map((acc: any) => (
                                                                    <div key={acc.id} className="flex items-center justify-between p-3 bg-white border rounded-xl hover:shadow-sm transition-all group">
                                                                        <div className="flex flex-col">
                                                                            <span className="text-sm font-bold text-gray-800">{acc.name}</span>
                                                                            <span className="text-[10px] text-gray-400 font-mono">{acc.id}</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-4">
                                                                            <div className="text-right">
                                                                                <p className="text-[10px] text-gray-400 uppercase font-bold">Gasto</p>
                                                                                <p className="text-xs font-black text-gray-900">
                                                                                    {acc.currency} {(parseFloat(acc.amount_spent || 0) / 100).toLocaleString('pt-BR')}
                                                                                </p>
                                                                            </div>
                                                                            <Badge className={acc.account_status === 1 ? "bg-emerald-500" : "bg-red-500"}>
                                                                                {acc.account_status === 1 ? "Ativa" : "Erro"}
                                                                            </Badge>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Detailed Pages */}
                                                    {businessAssets[biz.id]?.pages?.length > 0 && (
                                                        <div className="space-y-3">
                                                            <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                                                                <Database size={16} /> Páginas do BM
                                                            </div>
                                                            <div className="grid gap-2">
                                                                {businessAssets[biz.id].pages.map((p: any) => (
                                                                    <div key={p.id} className="flex items-center justify-between p-3 bg-white border rounded-xl hover:shadow-sm transition-all">
                                                                        <div className="flex flex-col">
                                                                            <span className="text-sm font-bold text-gray-800">{p.name}</span>
                                                                            <span className="text-[10px] text-gray-400">{p.category}</span>
                                                                        </div>
                                                                        {p.verification_status !== 'not_verified' && (
                                                                            <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">Verificada</Badge>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Detailed Instagram */}
                                                    {businessAssets[biz.id]?.instagramAccounts?.length > 0 && (
                                                        <div className="space-y-3">
                                                            <div className="flex items-center gap-2 text-purple-700 font-bold text-sm">
                                                                <Instagram size={16} /> Contas de Instagram
                                                            </div>
                                                            <div className="grid gap-2">
                                                                {businessAssets[biz.id].instagramAccounts.map((ig: any) => (
                                                                    <div key={ig.id} className="flex items-center justify-between p-3 bg-white border rounded-xl hover:shadow-sm transition-all">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                                                                                {ig.username.charAt(0).toUpperCase()}
                                                                            </div>
                                                                            <span className="text-sm font-bold text-gray-800">@{ig.username}</span>
                                                                        </div>
                                                                        {ig.follow_count !== undefined && (
                                                                            <span className="text-xs font-bold text-purple-600">{ig.follow_count} seguidores</span>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )}

                                    <Button 
                                        variant="ghost" 
                                        className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs font-bold uppercase tracking-wider"
                                    >
                                        {expandedBusinessId === biz.id ? "Recolher Detalhes" : "Explorar Portfólio"}
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="ad-accounts" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {adAccounts.length === 0 && !loading && (
                            <Card className="col-span-full py-12 border-dashed">
                                <CardContent className="flex flex-col items-center justify-center text-center">
                                    <div className="bg-gray-100 p-4 rounded-full mb-4">
                                        <Target className="text-gray-400 h-10 w-10" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-800">Nenhuma Conta de Anúncios</h3>
                                    <p className="text-gray-500 max-w-xs mx-auto mt-2">
                                        Não encontramos contas de anúncios vinculadas a este usuário Meta.
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                        {adAccounts.map((acc) => (
                            <Card key={acc.id} className="overflow-hidden hover:shadow-lg transition-all border-l-4 border-l-blue-600">
                                <CardHeader className="pb-4">
                                    <div className="flex justify-between items-start">
                                        <Badge className={acc.account_status === 1 ? "bg-emerald-500 text-white" : "bg-gray-400"}>
                                            {acc.account_status === 1 ? "Ativa" : "Inativa"}
                                        </Badge>
                                        <DollarSign className="text-gray-300" size={20} />
                                    </div>
                                    <CardTitle className="text-xl mt-2">{acc.name}</CardTitle>
                                    <CardDescription className="font-mono text-xs uppercase">{acc.id}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between items-center text-sm border-t pt-4">
                                        <span className="text-gray-500">Moeda</span>
                                        <span className="font-bold text-gray-800">{acc.currency}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500">Gasto Total</span>
                                        <span className="font-bold text-blue-600">
                                            R$ {(parseFloat(acc.amount_spent || 0) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <Button 
                                        variant="outline" 
                                        className="w-full mt-2" 
                                        onClick={() => window.location.href = '/relatorios/meta'}
                                    >
                                        Ver Campanhas <TrendingUp size={14} className="ml-2" />
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="settings" className="space-y-6">
                    <Card className="border-none shadow-none bg-transparent">
                        <CardHeader className="px-0">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-2xl font-bold">Configurações Avançadas</CardTitle>
                                    <CardDescription>Personalize como o Rastreia.ai lida com seus leads da Meta.</CardDescription>
                                </div>
                                <Button onClick={saveSettings} className="bg-blue-600 hover:bg-blue-700">
                                    Salvar Alterações
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="px-0 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Deduplication */}
                                <Card className="overflow-hidden border-gray-100 shadow-sm">
                                    <CardHeader className="bg-gray-50/50 pb-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="bg-blue-100 p-2 rounded-lg">
                                                    <RefreshCw className="text-blue-600 h-4 w-4" />
                                                </div>
                                                <Label className="text-lg font-bold">Deduplicação de Leads</Label>
                                            </div>
                                            <Switch 
                                                checked={metaConfig.ignoreDuplicates} 
                                                onCheckedChange={(val) => setMetaConfig({ ...metaConfig, ignoreDuplicates: val })}
                                            />
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-4 space-y-4">
                                        <p className="text-sm text-gray-500 leading-relaxed">
                                            Evite que o mesmo lead seja criado múltiplas vezes se ele preencher o formulário novamente em um curto período.
                                        </p>
                                        {metaConfig.ignoreDuplicates && (
                                            <div className="space-y-2">
                                                <Label className="text-xs uppercase text-gray-400 font-bold">Janela de Tempo (Horas)</Label>
                                                <div className="flex items-center gap-4">
                                                    <Input 
                                                        type="number" 
                                                        value={metaConfig.duplicateWindowHours} 
                                                        onChange={(e) => setMetaConfig({ ...metaConfig, duplicateWindowHours: parseInt(e.target.value) })}
                                                        className="w-24"
                                                    />
                                                    <span className="text-sm text-gray-400">leads repetidos serão ignorados por {metaConfig.duplicateWindowHours}h.</span>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Lead Distribution */}
                                <Card className="overflow-hidden border-gray-100 shadow-sm">
                                    <CardHeader className="bg-gray-50/50 pb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="bg-purple-100 p-2 rounded-lg">
                                                <Database className="text-purple-600 h-4 w-4" />
                                            </div>
                                            <Label className="text-lg font-bold">Distribuição Automática</Label>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-4 space-y-4">
                                        <p className="text-sm text-gray-500">Defina quem deve ter acesso aos novos leads vindos da Meta por padrão.</p>
                                        <div className="space-y-2">
                                            <Label className="text-xs uppercase text-gray-400 font-bold">Visibilidade</Label>
                                            <Select 
                                                value={metaConfig.leadDistribution} 
                                                onValueChange={(val) => setMetaConfig({ ...metaConfig, leadDistribution: val })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">Todos os membros do workspace</SelectItem>
                                                    <SelectItem value="admin">Apenas administradores</SelectItem>
                                                    <SelectItem value="none">Ninguém (requer atribuição manual)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Notifications */}
                                <Card className="overflow-hidden border-gray-100 shadow-sm">
                                    <CardHeader className="bg-gray-50/50 pb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="bg-emerald-100 p-2 rounded-lg">
                                                <AlertTriangle className="text-emerald-600 h-4 w-4" />
                                            </div>
                                            <Label className="text-lg font-bold">Notificações em Tempo Real</Label>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-4 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label className="text-sm font-semibold">Notificar via WhatsApp</Label>
                                                <p className="text-xs text-gray-400">Envia um alerta para o número do gestor.</p>
                                            </div>
                                            <Switch 
                                                checked={metaConfig.notifyWhatsApp} 
                                                onCheckedChange={(val) => setMetaConfig({ ...metaConfig, notifyWhatsApp: val })}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between border-t pt-4">
                                            <div className="space-y-0.5">
                                                <Label className="text-sm font-semibold">Aviso Sonoro no Painel</Label>
                                                <p className="text-xs text-gray-400">Toca um som assim que o lead cair no CRM.</p>
                                            </div>
                                            <Switch defaultChecked />
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Webhook Info */}
                                <Card className="overflow-hidden border-gray-100 shadow-sm bg-gray-50/30">
                                    <CardHeader className="pb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="bg-gray-200 p-2 rounded-lg">
                                                <Settings className="text-gray-600 h-4 w-4" />
                                            </div>
                                            <Label className="text-lg font-bold">Dados Técnicos do Webhook</Label>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-1">
                                            <Label className="text-[10px] uppercase font-bold text-gray-400">Callback URL</Label>
                                            <div className="flex gap-2">
                                                <Input readOnly value={`${process.env.NEXT_PUBLIC_API_URL}/api/webhooks/meta`} className="bg-white text-xs font-mono" />
                                                <Button variant="ghost" size="sm" className="h-9 px-3" onClick={() => {
                                                    navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_API_URL}/api/webhooks/meta`);
                                                    toast.success("Copiado!");
                                                }}>Copiar</Button>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] uppercase font-bold text-gray-400">Verify Token</Label>
                                            <div className="flex gap-2">
                                                <Input readOnly value="rastreia_ai_meta_token" className="bg-white text-xs font-mono" />
                                                <Button variant="ghost" size="sm" className="h-9 px-3" onClick={() => {
                                                    navigator.clipboard.writeText("rastreia_ai_meta_token");
                                                    toast.success("Copiado!");
                                                }}>Copiar</Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                
                                {/* Report Modules Config */}
                                <Card className="overflow-hidden border-gray-100 shadow-sm md:col-span-2">
                                    <CardHeader className="bg-gray-50/50 pb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="bg-emerald-100 p-2 rounded-lg">
                                                <TrendingUp className="text-emerald-600 h-4 w-4" />
                                            </div>
                                            <Label className="text-lg font-bold">Módulos do Relatório Meta</Label>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-4 grid grid-cols-2 md:grid-cols-3 gap-6">
                                        <div className="flex items-center justify-between p-3 border rounded-xl hover:bg-gray-50 transition-colors">
                                            <Label className="cursor-pointer">Resumo Geral (KPIs)</Label>
                                            <Switch 
                                                checked={metaConfig.reportModules?.summary} 
                                                onCheckedChange={(val) => setMetaConfig({ ...metaConfig, reportModules: { ...metaConfig.reportModules, summary: val } })}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between p-3 border rounded-xl hover:bg-gray-50 transition-colors">
                                            <Label className="cursor-pointer">Campanhas</Label>
                                            <Switch 
                                                checked={metaConfig.reportModules?.campaigns} 
                                                onCheckedChange={(val) => setMetaConfig({ ...metaConfig, reportModules: { ...metaConfig.reportModules, campaigns: val } })}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between p-3 border rounded-xl hover:bg-gray-50 transition-colors">
                                            <Label className="cursor-pointer">Páginas & Formulários</Label>
                                            <Switch 
                                                checked={metaConfig.reportModules?.pages} 
                                                onCheckedChange={(val) => setMetaConfig({ ...metaConfig, reportModules: { ...metaConfig.reportModules, pages: val } })}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between p-3 border rounded-xl hover:bg-gray-50 transition-colors">
                                            <Label className="cursor-pointer">Insights Detalhados</Label>
                                            <Switch 
                                                checked={metaConfig.reportModules?.insights} 
                                                onCheckedChange={(val) => setMetaConfig({ ...metaConfig, reportModules: { ...metaConfig.reportModules, insights: val } })}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between p-3 border rounded-xl hover:bg-gray-50 transition-colors">
                                            <Label className="cursor-pointer">Listagem de Leads</Label>
                                            <Switch 
                                                checked={metaConfig.reportModules?.leads} 
                                                onCheckedChange={(val) => setMetaConfig({ ...metaConfig, reportModules: { ...metaConfig.reportModules, leads: val } })}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between p-3 border rounded-xl hover:bg-gray-50 transition-colors">
                                            <Label className="cursor-pointer">Contas de Anúncios</Label>
                                            <Switch 
                                                checked={metaConfig.reportModules?.adAccounts} 
                                                onCheckedChange={(val) => setMetaConfig({ ...metaConfig, reportModules: { ...metaConfig.reportModules, adAccounts: val } })}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* CAPI / Pixel */}
                                <Card className="overflow-hidden border-gray-100 shadow-sm md:col-span-2">
                                    <CardHeader className="bg-blue-600 text-white pb-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Facebook className="h-5 w-5" />
                                                <Label className="text-lg font-bold">Meta Conversions API (CAPI)</Label>
                                            </div>
                                            <Badge className="bg-white/20 text-white border-none">Opcional</Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-6 grid md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <p className="text-sm text-gray-500 leading-relaxed">
                                                Otimize seus anúncios enviando eventos de conversão (venda, fechamento) de volta para a Meta. Isso melhora a inteligência do Pixel drasticamente.
                                            </p>
                                            <div className="space-y-2">
                                                <Label className="text-xs uppercase text-gray-400 font-bold">ID do Pixel da Meta</Label>
                                                <Input 
                                                    placeholder="Digite o ID do Pixel..." 
                                                    value={metaConfig.pixelId}
                                                    onChange={(e) => setMetaConfig({ ...metaConfig, pixelId: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="bg-blue-50 rounded-xl p-4 flex flex-col justify-center">
                                            <div className="flex items-center gap-3 mb-2 text-blue-700 font-bold">
                                                <Target size={20} />
                                                <span>Por que usar CAPI?</span>
                                            </div>
                                            <ul className="text-xs text-blue-600 space-y-2 list-disc list-inside">
                                                <li>Melhora a atribuição de vendas em até 30%</li>
                                                <li>Ignora bloqueadores de anúncios (AdBlock)</li>
                                                <li>Reduz o custo por aquisição (CPA)</li>
                                                <li>Funciona mesmo sem cookies no navegador</li>
                                            </ul>
                                        </div>
                                    </CardContent>
                                </Card>
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

                        <div className="pt-4 border-t">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base font-semibold">Auto-criar campos personalizados</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Cria automaticamente campos no CRM para cada campo extra do formulário Meta.
                                    </p>
                                </div>
                                <Switch 
                                    checked={mappingConfig.autoCreateFields}
                                    onCheckedChange={(val) => setMappingConfig({ ...mappingConfig, autoCreateFields: val })}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsMappingDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={saveMapping} className="bg-blue-600">Salvar Mapeamento</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}
