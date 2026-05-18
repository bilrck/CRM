"use client";

import { useEffect, useState } from "react";
import { 
    Card, CardContent, CardHeader, CardTitle, CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { 
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Key, Calendar, Users, DollarSign, Trash2, CheckCircle2, XCircle, CreditCard, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import { 
    Tabs, TabsContent, TabsList, TabsTrigger 
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface Plan {
    id: number;
    name: string;
    description: string;
    daysValid: number;
    price: number;
    role: string;
    features: string[];
    isActive: boolean;
    isSubscription: boolean;
}

interface LicenseKey {
    id: number;
    key: string;
    daysValid: number;
    usageLimit: number;
    currentUsage: number;
    priceGestor: number;
    priceCliente: number;
    isActive: boolean;
    reminderEnabled: boolean;
    createdAt: string;
    plan?: Plan;
}

export default function LicenseManagement() {
    const [keys, setKeys] = useState<LicenseKey[]>([]);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [openKey, setOpenKey] = useState(false);
    const [openPlan, setOpenPlan] = useState(false);
    
    // Key Form State
    const [keyData, setKeyData] = useState({
        planId: "",
        usageLimit: 1,
        reminderEnabled: true
    });

    const [planData, setPlanData] = useState({
        name: "",
        description: "",
        daysValid: 30,
        price: 0,
        role: "CLIENTE",
        features: "",
        isSubscription: false
    });

    // Payment Gateway State
    const [paymentConfig, setPaymentConfig] = useState({
        id: null,
        provider: "MERCADO_PAGO",
        isActive: true,
        publicKey: "",
        accessToken: "",
        clientSecret: "",
        webhookSecret: "",
        mode: "SANDBOX"
    });
    const [savingPayment, setSavingPayment] = useState(false);
    const [testingConnection, setTestingConnection] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [keysRes, plansRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/license`, { credentials: "include" }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/plans`, { credentials: "include" })
            ]);
            
            if (keysRes.ok) setKeys(await keysRes.json());
            if (plansRes.ok) setPlans(await plansRes.json());

            const payRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/payment/config`, { credentials: "include" });
            if (payRes.ok) {
                const data = await payRes.json();
                if (data.id) setPaymentConfig(data);
            }
        } catch (error) {
            toast.error("Erro ao carregar dados");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateKey = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/license`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(keyData),
                credentials: "include"
            });
            if (res.ok) {
                toast.success("Chave gerada com sucesso!");
                setOpenKey(false);
                fetchData();
            } else {
                const err = await res.json();
                toast.error(err.error || "Erro ao gerar chave");
            }
        } catch (error) {
            toast.error("Erro de conexão");
        }
    };

    const handleCreatePlan = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/plans`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...planData,
                    features: planData.features.split("\n").filter(f => f.trim())
                }),
                credentials: "include"
            });
            if (res.ok) {
                toast.success("Plano criado!");
                setOpenPlan(false);
                setPlanData({ name: "", description: "", daysValid: 30, price: 0, role: "CLIENTE", features: "", isSubscription: false });
                fetchData();
            }
        } catch (error) {
            toast.error("Erro ao criar plano");
        }
    };

    const toggleStatus = async (id: number, currentStatus: boolean) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/license/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !currentStatus }),
                credentials: "include"
            });
            if (res.ok) {
                toast.success("Status atualizado");
                fetchData();
            }
        } catch (error) {
            toast.error("Erro ao atualizar");
        }
    };

    const handleDeleteKey = async (id: number) => {
        if (!confirm("Tem certeza que deseja excluir esta chave?")) return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/license/${id}`, {
                method: "DELETE",
                credentials: "include"
            });
            if (res.ok) {
                toast.success("Chave excluída");
                fetchData();
            }
        } catch (error) {
            toast.error("Erro ao excluir");
        }
    };

    const handleDeletePlan = async (id: number) => {
        if (!confirm("Tem certeza? Isso pode afetar chaves vinculadas.")) return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/plans/${id}`, {
                method: "DELETE",
                credentials: "include"
            });
            if (res.ok) {
                toast.success("Plano excluído");
                fetchData();
            }
        } catch (error) {
            toast.error("Erro ao excluir plano");
        }
    };

    const handleSavePayment = async () => {
        try {
            setSavingPayment(true);
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/payment/config`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(paymentConfig),
                credentials: "include"
            });
            if (res.ok) {
                toast.success("Configuração de pagamento salva!");
                const data = await res.json();
                setPaymentConfig(data);
            } else {
                toast.error("Erro ao salvar configuração");
            }
        } catch (error) {
            toast.error("Erro de conexão");
        } finally {
            setSavingPayment(false);
        }
    };

    const handleTestConnection = async () => {
        try {
            setTestingConnection(true);
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/payment/test`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(paymentConfig),
                credentials: "include"
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message || "Conexão de teste realizada com sucesso!");
            } else {
                toast.error(data.error || "Falha na conexão de teste.");
            }
        } catch (error) {
            toast.error("Erro ao tentar conectar ao servidor");
        } finally {
            setTestingConnection(false);
        }
    };

    return (
        <div className="p-8 space-y-6 bg-background min-h-screen">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Gestão de Licenciamento</h1>
                    <p className="text-muted-foreground">Configure planos e gere chaves de acesso.</p>
                </div>
            </div>

            <Tabs defaultValue="keys" className="w-full">
                <TabsList className="grid w-full lg:w-[600px] grid-cols-3 mb-8">
                    <TabsTrigger value="keys">Chaves de Acesso</TabsTrigger>
                    <TabsTrigger value="plans">Planos do Sistema</TabsTrigger>
                    <TabsTrigger value="gateway">Gateway de Pagamento</TabsTrigger>
                </TabsList>

                {/* --- TAB CHAVES --- */}
                <TabsContent value="keys" className="space-y-4">
                    <div className="flex justify-end">
                        <Dialog open={openKey} onOpenChange={setOpenKey}>
                            <DialogTrigger asChild>
                                <Button className="bg-primary">
                                    <Plus className="mr-2 h-4 w-4" /> Gerar Chave
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Nova Chave de Licença</DialogTitle>
                                    <DialogDescription>Selecione um plano para basear a chave.</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Plano Base</Label>
                                        <select 
                                            className="w-full p-2 rounded-md border bg-background"
                                            value={keyData.planId}
                                            onChange={e => setKeyData({...keyData, planId: e.target.value})}
                                        >
                                            <option value="">Selecione um plano...</option>
                                            {plans.map(p => (
                                                <option key={p.id} value={p.id}>{p.name} ({p.role})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Limite de Uso</Label>
                                        <Input 
                                            type="number" 
                                            value={keyData.usageLimit} 
                                            onChange={e => setKeyData({...keyData, usageLimit: Number(e.target.value)})}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between space-x-2">
                                        <Label>Ativar lembrete no painel?</Label>
                                        <Switch 
                                            checked={keyData.reminderEnabled}
                                            onCheckedChange={v => setKeyData({...keyData, reminderEnabled: v})}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setOpenKey(false)}>Cancelar</Button>
                                    <Button onClick={handleCreateKey} disabled={!keyData.planId}>Gerar Chave</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Chave</TableHead>
                                        <TableHead>Plano / Validade</TableHead>
                                        <TableHead>Uso</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow><TableCell colSpan={5} className="text-center">Carregando...</TableCell></TableRow>
                                    ) : keys.length === 0 ? (
                                        <TableRow><TableCell colSpan={5} className="text-center">Nenhuma chave encontrada.</TableCell></TableRow>
                                    ) : (
                                        keys.map(k => (
                                            <TableRow key={k.id}>
                                                <TableCell className="font-mono font-bold text-primary">{k.key}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{k.plan?.name || "Personalizado"}</span>
                                                        <span className="text-xs text-muted-foreground">{k.daysValid} dias</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-xs font-medium">{k.currentUsage} / {k.usageLimit}</span>
                                                        <div className="w-24 bg-muted rounded-full h-1.5">
                                                            <div 
                                                                className="bg-primary h-1.5 rounded-full" 
                                                                style={{ width: `${Math.min((k.currentUsage / k.usageLimit) * 100, 100)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={k.isActive ? "default" : "secondary"}>
                                                        {k.isActive ? "Ativa" : "Inativa"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right space-x-2">
                                                    <Button size="icon" variant="ghost" onClick={() => toggleStatus(k.id, k.isActive)}>
                                                        {k.isActive ? <XCircle className="text-orange-500 w-4 h-4" /> : <CheckCircle2 className="text-emerald-500 w-4 h-4" />}
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteKey(k.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- TAB PLANOS --- */}
                <TabsContent value="plans" className="space-y-4">
                    <div className="flex justify-end">
                        <Dialog open={openPlan} onOpenChange={setOpenPlan}>
                            <DialogTrigger asChild>
                                <Button className="bg-primary">
                                    <Plus className="mr-2 h-4 w-4" /> Novo Plano
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                    <DialogTitle>Criar Novo Plano</DialogTitle>
                                    <DialogDescription>Estes planos aparecerão para compra no sistema.</DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Nome do Plano</Label>
                                            <Input 
                                                placeholder="Ex: Gestor Premium"
                                                value={planData.name}
                                                onChange={e => setPlanData({...planData, name: e.target.value})}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Para quem?</Label>
                                            <select 
                                                className="w-full p-2 rounded-md border bg-background"
                                                value={planData.role}
                                                onChange={e => setPlanData({...planData, role: e.target.value})}
                                            >
                                                <option value="CLIENTE">Cliente</option>
                                                <option value="MANAGER">Gestor</option>
                                                <option value="PERSONALIZADO">Personalizado</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Duração (Dias)</Label>
                                            <Input 
                                                type="number"
                                                value={planData.daysValid}
                                                onChange={e => setPlanData({...planData, daysValid: Number(e.target.value)})}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Preço (R$)</Label>
                                            <Input 
                                                type="number"
                                                value={planData.price}
                                                onChange={e => setPlanData({...planData, price: Number(e.target.value)})}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Descrição Curta</Label>
                                        <Input 
                                            value={planData.description}
                                            onChange={e => setPlanData({...planData, description: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Recursos (Um por linha)</Label>
                                        <Textarea 
                                            placeholder="Ex: Dashboards avançados\nSuporte 24h"
                                            value={planData.features}
                                            onChange={e => setPlanData({...planData, features: e.target.value})}
                                            rows={4}
                                        />
                                    </div>
                                    <div className="flex flex-row items-center justify-between rounded-lg border p-4 bg-primary/5 mt-2">
                                        <div className="space-y-0.5">
                                            <Label className="text-base font-bold text-primary">Assinatura Recorrente</Label>
                                            <p className="text-xs text-muted-foreground">O plano renovará automaticamente.</p>
                                        </div>
                                        <Switch
                                            checked={planData.isSubscription}
                                            onCheckedChange={(checked) => setPlanData({ ...planData, isSubscription: checked })}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setOpenPlan(false)}>Cancelar</Button>
                                    <Button onClick={handleCreatePlan}>Criar Plano</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {plans.map(p => (
                            <Card key={p.id} className="relative">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <Badge variant="outline" className="mb-2 uppercase text-[10px]">{p.role}</Badge>
                                        <Button size="icon" variant="ghost" className="text-destructive h-8 w-8" onClick={() => handleDeletePlan(p.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <CardTitle>{p.name}</CardTitle>
                                    <CardDescription>{p.description}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-primary mb-4">
                                        R$ {Number(p.price).toFixed(2)}
                                        <span className="text-xs text-muted-foreground font-normal ml-2">/ {p.daysValid} dias {p.isSubscription ? "(Assinatura)" : ""}</span>
                                    </div>
                                    <ul className="space-y-2">
                                        {p.features.map((f, idx) => (
                                            <li key={idx} className="text-sm flex items-center gap-2">
                                                <div className="w-1 h-1 bg-primary rounded-full" />
                                                {f}
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* --- TAB GATEWAY --- */}
                <TabsContent value="gateway" className="space-y-6">
                    <Card className="rounded-3xl border-none shadow-xl overflow-hidden bg-white">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                                    <CreditCard className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black">Configuração do Gateway</h2>
                                    <p className="text-blue-100 font-medium text-sm">Gerencie como você recebe pagamentos pelas licenças</p>
                                </div>
                            </div>
                        </div>
                        <CardContent className="p-8 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="font-bold text-slate-700">Provedor</Label>
                                        <select 
                                            className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            value={paymentConfig.provider}
                                            onChange={e => setPaymentConfig({...paymentConfig, provider: e.target.value})}
                                        >
                                            <option value="MERCADO_PAGO">Mercado Pago</option>
                                            <option value="STRIPE">Stripe</option>
                                            <option value="PAGARME" disabled>Pagar.me (Em breve)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="font-bold text-slate-700">Ambiente</Label>
                                        <div className="flex gap-4 p-1 bg-slate-100 rounded-xl w-fit">
                                            <button 
                                                className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${paymentConfig.mode === 'SANDBOX' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
                                                onClick={() => setPaymentConfig({...paymentConfig, mode: 'SANDBOX'})}
                                            >
                                                TESTES
                                            </button>
                                            <button 
                                                className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${paymentConfig.mode === 'PRODUCTION' ? 'bg-blue-600 shadow-md text-white' : 'text-slate-500'}`}
                                                onClick={() => setPaymentConfig({...paymentConfig, mode: 'PRODUCTION'})}
                                            >
                                                PRODUÇÃO
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-800 text-sm">Status do Gateway</span>
                                            <span className="text-xs text-slate-500">{paymentConfig.isActive ? "Recebendo pagamentos" : "Inativo"}</span>
                                        </div>
                                        <Switch 
                                            checked={paymentConfig.isActive}
                                            onCheckedChange={v => setPaymentConfig({...paymentConfig, isActive: v})}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="font-bold text-slate-700">
                                            {paymentConfig.provider === "STRIPE" ? "Publishable Key (Chave Pública)" : "Public Key"}
                                        </Label>
                                        <Input 
                                            placeholder={paymentConfig.provider === "STRIPE" ? "pk_test_..." : "APP_USR-..."} 
                                            className="rounded-xl border-slate-200 py-6"
                                            value={paymentConfig.publicKey || ""}
                                            onChange={e => setPaymentConfig({...paymentConfig, publicKey: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="font-bold text-slate-700">
                                            {paymentConfig.provider === "STRIPE" ? "Secret Key (Chave Privada)" : "Access Token"}
                                        </Label>
                                        <Input 
                                            type="password"
                                            placeholder={paymentConfig.provider === "STRIPE" ? "sk_test_..." : "APP_USR-..."} 
                                            className="rounded-xl border-slate-200 py-6"
                                            value={paymentConfig.accessToken || ""}
                                            onChange={e => setPaymentConfig({...paymentConfig, accessToken: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="font-bold text-slate-700">Webhook Secret (Opcional)</Label>
                                        <Input 
                                            type="password"
                                            placeholder="whsec_..." 
                                            className="rounded-xl border-slate-200 py-6"
                                            value={paymentConfig.webhookSecret || ""}
                                            onChange={e => setPaymentConfig({...paymentConfig, webhookSecret: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-100 flex justify-end gap-4">
                                <Button 
                                    variant="outline" 
                                    className="rounded-2xl font-bold py-6 px-8 border-slate-200"
                                    onClick={handleTestConnection}
                                    disabled={testingConnection}
                                >
                                    {testingConnection ? "Testando..." : "Testar Conexão"}
                                </Button>
                                <Button 
                                    className="bg-blue-600 hover:bg-blue-700 rounded-2xl font-black py-6 px-12 shadow-lg shadow-blue-100"
                                    onClick={handleSavePayment}
                                    disabled={savingPayment}
                                >
                                    {savingPayment ? "Salvando..." : "Salvar Configurações"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-[2rem] border-none bg-amber-50 border-amber-100 p-6">
                        <div className="flex gap-4">
                            <Settings className="h-6 w-6 text-amber-600 shrink-0" />
                            <div>
                                <h4 className="font-black text-amber-800 text-sm uppercase tracking-wider">Atenção</h4>
                                <p className="text-amber-700 text-sm mt-1 font-medium">
                                    Certifique-se de configurar a URL de Webhook no seu painel do {paymentConfig.provider === "STRIPE" ? "Stripe" : "Mercado Pago"} para que as ativações de licença ocorram automaticamente após o pagamento. 
                                    <br/><br/>
                                    <code className="bg-white/50 px-2 py-1 rounded font-mono font-bold text-xs">
                                        {process.env.NEXT_PUBLIC_API_URL}/webhooks/payments
                                    </code>
                                </p>
                            </div>
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>

            <Card className="bg-muted/30 border-dashed border-2 mt-8">
                <CardHeader>
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Key className="w-4 h-4" />
                        API Exclusiva para Automação
                    </CardTitle>
                    <CardDescription className="text-xs">
                        Utilize o endpoint abaixo para gerar chaves automaticamente via integrações externas (ex: n8n, Stripe, etc).
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-zinc-950 p-4 rounded-lg font-mono text-[10px] space-y-2 text-zinc-300 overflow-x-auto">
                        <p className="text-primary font-bold">POST /license/generate-external</p>
                        <p>Header: <span className="text-zinc-500">x-api-key: RASTREIA_MASTER_2026</span></p>
                        <div className="pt-2">
                            <p className="text-zinc-500">// Body Example:</p>
                            <p>{"{"}</p>
                            <p className="pl-4">"daysValid": 30,</p>
                            <p className="pl-4">"usageLimit": 1,</p>
                            <p className="pl-4">"priceGestor": 97.00,</p>
                            <p className="pl-4">"priceCliente": 147.00</p>
                            <p className="pl-4">"planId": 1 <span className="text-zinc-600">(opcional)</span></p>
                            <p>{"}"}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
