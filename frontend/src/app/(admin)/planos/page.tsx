"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/app/api/userProvider";
import { 
    Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, Sparkles, ShieldCheck, Zap, Star } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface Plan {
    id: number;
    name: string;
    description: string;
    daysValid: number;
    price: number;
    role: string;
    features: string[];
    isSubscription: boolean;
}

export default function PlansPage() {
    const user = useUser();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [buyingPlanId, setBuyingPlanId] = useState<number | null>(null);
    const [isMockDialogOpen, setIsMockDialogOpen] = useState(false);
    const [selectedMockPlan, setSelectedMockPlan] = useState<Plan | null>(null);
    const [activatingMock, setActivatingMock] = useState(false);

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/plans`, { credentials: "include" });
                if (res.ok) setPlans(await res.json());
            } catch (error) {
                toast.error("Erro ao carregar planos");
            } finally {
                setLoading(false);
            }
        };
        fetchPlans();
    }, []);

    const handleBuy = async (plan: Plan) => {
        try {
            setBuyingPlanId(plan.id);
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/plans/${plan.id}/checkout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include"
            });
            
            const data = await res.json();
            
            if (res.ok) {
                if (data.isMock) {
                    setSelectedMockPlan(plan);
                    setIsMockDialogOpen(true);
                } else if (data.url) {
                    toast.info(`Redirecionando para o gateway de pagamento (${data.provider === 'STRIPE' ? 'Stripe' : 'Mercado Pago'})...`);
                    window.location.href = data.url;
                } else {
                    toast.error("Resposta inválida do servidor");
                }
            } else {
                toast.error(data.error || "Erro ao iniciar processo de pagamento");
            }
        } catch (error) {
            toast.error("Erro ao conectar com o servidor");
        } finally {
            setBuyingPlanId(null);
        }
    };

    const handleConfirmMockPayment = async () => {
        if (!selectedMockPlan) return;
        try {
            setActivatingMock(true);
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/plans/${selectedMockPlan.id}/activate-mock`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include"
            });
            const data = await res.json();
            if (res.ok) {
                toast.success("Pagamento Simulado Aprovado! Plano ativo com sucesso!");
                setIsMockDialogOpen(false);
                setTimeout(() => {
                    window.location.href = "/dashboard";
                }, 1500);
            } else {
                toast.error(data.error || "Erro ao ativar plano simulado");
            }
        } catch (error) {
            toast.error("Erro na ativação do plano");
        } finally {
            setActivatingMock(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-[80vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center space-y-4">
                <Badge variant="outline" className="px-4 py-1 border-primary/30 text-primary bg-primary/5 uppercase tracking-widest text-[10px]">
                    Planos & Preços
                </Badge>
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                    Escolha o plano ideal para <span className="text-primary">seu negócio</span>
                </h1>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                    Aumente sua produtividade com ferramentas avançadas de CRM e automação.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
                {plans.map((plan) => {
                    const isPopular = plan.name.toLowerCase().includes("premium") || plan.name.toLowerCase().includes("pro");
                    
                    return (
                        <Card 
                            key={plan.id} 
                            className={`flex flex-col relative transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border-border/50 ${isPopular ? 'border-primary shadow-lg shadow-primary/10' : ''}`}
                        >
                            {isPopular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                    <Badge className="bg-primary text-primary-foreground px-4 py-1 shadow-lg">
                                        MAIS POPULAR
                                    </Badge>
                                </div>
                            )}

                            <CardHeader className="text-center pb-2">
                                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                                <CardDescription className="min-h-[40px] mt-2">
                                    {plan.description}
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="flex-grow space-y-6">
                                <div className="text-center">
                                    <div className="flex items-baseline justify-center gap-1">
                                        <span className="text-2xl font-semibold text-muted-foreground">R$</span>
                                        <span className="text-5xl font-extrabold tracking-tight">
                                            {Number(plan.price).toFixed(2).split('.')[0]}
                                        </span>
                                        <span className="text-2xl font-semibold text-muted-foreground">
                                            ,{Number(plan.price).toFixed(2).split('.')[1]}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Validade de {plan.daysValid} dias <br/> 
                                        <span className="text-xs font-bold text-primary">{plan.isSubscription ? "Renovação Automática" : "Pagamento Único"}</span>
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                        O que está incluso:
                                    </p>
                                    <ul className="space-y-3">
                                        {plan.features.map((feature, i) => (
                                            <li key={i} className="flex items-start gap-3 text-sm">
                                                <div className="mt-1 bg-primary/10 rounded-full p-0.5 shrink-0">
                                                    <Check className="w-3 h-3 text-primary" />
                                                </div>
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </CardContent>

                            <CardFooter className="pt-6">
                                <Button 
                                    className={`w-full py-6 font-bold text-lg transition-all duration-300 ${
                                        isPopular 
                                        ? 'bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20' 
                                        : 'variant-outline border-primary/20 hover:bg-primary/5 hover:border-primary'
                                    }`}
                                    variant={isPopular ? 'default' : 'outline'}
                                    onClick={() => handleBuy(plan)}
                                    disabled={buyingPlanId !== null}
                                >
                                    {buyingPlanId === plan.id ? "Redirecionando..." : "Começar Agora"}
                                </Button>
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>

            <div className="bg-primary/5 rounded-3xl p-8 md:p-12 border border-primary/10 text-center space-y-6 mt-12">
                <div className="flex justify-center gap-4">
                    <ShieldCheck className="w-12 h-12 text-primary/40" />
                    <Zap className="w-12 h-12 text-primary/40" />
                    <Star className="w-12 h-12 text-primary/40" />
                </div>
                <h2 className="text-2xl font-bold">Precisa de um plano personalizado?</h2>
                <p className="text-muted-foreground max-w-xl mx-auto">
                    Oferecemos soluções sob medida para grandes equipes e necessidades específicas de integração.
                </p>
                <Button variant="link" className="text-primary font-bold text-lg">
                    Falar com um especialista →
                </Button>
            </div>

            {/* Mock Checkout Sandbox Dialog */}
            <Dialog open={isMockDialogOpen} onOpenChange={setIsMockDialogOpen}>
                <DialogContent className="sm:max-w-md rounded-3xl p-6">
                    <DialogHeader className="text-center space-y-3">
                        <div className="mx-auto w-12 h-12 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-amber-500 animate-pulse" />
                        </div>
                        <DialogTitle className="text-xl font-black text-slate-800">
                            Ambiente de Sandbox / Testes
                        </DialogTitle>
                        <DialogDescription className="text-sm font-medium text-slate-500">
                            Detectamos que o sistema está em modo sandbox ou não configurado para gateways de produção.
                            Você pode simular o pagamento e ativar seu plano de testes imediatamente!
                        </DialogDescription>
                    </DialogHeader>

                    {selectedMockPlan && (
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 my-2 text-center">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Plano Selecionado</span>
                            <span className="text-lg font-black text-slate-800 block mt-1">{selectedMockPlan.name}</span>
                            <span className="text-2xl font-black text-blue-600 block mt-2">
                                R$ {Number(selectedMockPlan.price).toFixed(2)}
                            </span>
                            <span className="text-xs font-medium text-slate-400 block mt-1">Validade: {selectedMockPlan.daysValid} dias</span>
                        </div>
                    )}

                    <DialogFooter className="flex sm:justify-between gap-3 mt-4">
                        <Button 
                            variant="ghost" 
                            className="rounded-xl font-bold py-6 px-6 shrink-0 text-slate-500"
                            onClick={() => setIsMockDialogOpen(false)}
                            disabled={activatingMock}
                        >
                            Cancelar
                        </Button>
                        <Button 
                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black py-6 px-8 flex-grow shadow-lg shadow-emerald-100"
                            onClick={handleConfirmMockPayment}
                            disabled={activatingMock}
                        >
                            {activatingMock ? "Ativando..." : "Simular Pagamento & Ativar! ✓"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
