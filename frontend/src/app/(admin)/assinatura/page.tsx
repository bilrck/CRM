"use client";

import { useState } from "react";
import { useUser } from "@/app/api/userProvider";
import { 
    Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Sparkles, Calendar, CreditCard, ShieldCheck, Clock, AlertCircle, Key } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function SubscriptionPage() {
    const user = useUser();
    const [key, setKey] = useState("");
    const [activating, setActivating] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [wantsNotification, setWantsNotification] = useState(
        user?.billingReminderConfig?.enabled ?? true
    );

    const handleActivate = async () => {
        if (!key) return toast.error("Digite a chave de licença");
        
        try {
            setActivating(true);
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/license/activate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key }),
                credentials: "include"
            });
            
            const data = await res.json();
            if (res.ok) {
                toast.success("Sistema ativado com sucesso!");
                setKey("");
                // Reload to update user context
                window.location.reload();
            } else {
                toast.error(data.error || "Erro ao ativar chave");
            }
        } catch (error) {
            toast.error("Erro de conexão");
        } finally {
            setActivating(false);
        }
    };

    const handleCancelSubscription = async () => {
        if (!confirm("Tem certeza de que deseja cancelar sua assinatura recorrente? Você continuará tendo acesso até o final da validade atual, mas não haverá novas cobranças automáticas.")) return;
        
        try {
            setCancelling(true);
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/plans/cancel-subscription`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include"
            });
            
            const data = await res.json();
            if (res.ok) {
                toast.success("Assinatura cancelada com sucesso!");
                window.location.reload();
            } else {
                toast.error(data.error || "Erro ao cancelar assinatura");
            }
        } catch (error) {
            toast.error("Erro de conexão");
        } finally {
            setCancelling(false);
        }
    };

    const toggleNotification = async (val: boolean) => {
        setWantsNotification(val);
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/preferences`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    billingReminderConfig: { 
                        ...user?.billingReminderConfig,
                        enabled: val 
                    } 
                }),
                credentials: "include"
            });
            toast.success("Preferência de notificação atualizada");
        } catch (error) {
            toast.error("Erro ao atualizar preferência");
        }
    };

    if (!user) return null;

    const expiryDate = user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt) : null;
    const isExpired = expiryDate ? expiryDate < new Date() : true;

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Minha Assinatura</h1>
                <p className="text-muted-foreground">Gerencie seu plano e ativação do sistema.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Current Status Card */}
                <Card className="relative overflow-hidden border-primary/20 shadow-lg">
                    <div className="absolute top-0 right-0 p-4">
                        <Badge variant={isExpired ? "destructive" : "default"} className="px-3 py-1">
                            {isExpired ? "Expirado" : "Ativo"}
                        </Badge>
                    </div>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShieldCheck className="text-primary" />
                            Status do Plano
                        </CardTitle>
                        <CardDescription>Informações sobre sua validade atual.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl border border-border/50">
                            <div className="flex items-center gap-3">
                                <Clock className="text-muted-foreground w-4 h-4" />
                                <span className="text-sm font-medium">Expira em:</span>
                            </div>
                            <span className="text-sm font-bold">
                                {expiryDate ? expiryDate.toLocaleDateString('pt-BR') : "N/A"}
                            </span>
                        </div>

                        {!isExpired && (
                             <div className="flex items-center justify-between p-3 bg-primary/5 rounded-xl border border-primary/10">
                                <Label className="text-sm font-medium cursor-pointer" htmlFor="notify">
                                    Notificar antes de vencer?
                                </Label>
                                <Switch 
                                    id="notify"
                                    checked={wantsNotification}
                                    onCheckedChange={toggleNotification}
                                />
                             </div>
                        )}
                    </CardContent>
                </Card>

                {/* Activation Card (Only shown if plan is expired) */}
                {isExpired && (
                    <Card className="shadow-md border-border/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Key className="text-primary" />
                                Ativar Licença
                            </CardTitle>
                            <CardDescription>Insira sua chave de ativação para renovar ou ativar.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Chave de Licença</Label>
                                <Input 
                                    placeholder="EX: A1B2-C3D4-..." 
                                    className="font-mono"
                                    value={key}
                                    onChange={e => setKey(e.target.value.toUpperCase())}
                                />
                            </div>
                            <Button 
                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20"
                                onClick={handleActivate}
                                disabled={activating}
                            >
                                {activating ? "Ativando..." : "Ativar Sistema"}
                            </Button>
                        </CardContent>
                        <CardFooter className="bg-muted/30 p-4 border-t">
                            <div className="flex items-start gap-2 text-[10px] text-muted-foreground leading-tight">
                                <AlertCircle className="w-3 h-3 shrink-0" />
                                <span>A ativação é imediata. Se você já tiver um plano ativo, os dias da nova chave serão somados à sua validade atual.</span>
                            </div>
                        </CardFooter>
                    </Card>
                )}

                {/* Cancellation Card (Only shown if plan is active AND subscription is active) */}
                {!isExpired && user.subscriptionStatus === "ACTIVE" && (
                    <Card className="shadow-md border-border/50 border-destructive/20 bg-destructive/5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-destructive">
                                <AlertCircle className="w-5 h-5" />
                                Cancelar Assinatura
                            </CardTitle>
                            <CardDescription>
                                Cancele as futuras renovações automáticas da sua assinatura.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Ao cancelar, você continuará tendo acesso completo aos recursos contratados até o final do período de validade (<strong>{expiryDate?.toLocaleDateString('pt-BR')}</strong>). Nenhuma cobrança futura será realizada no seu cartão.
                            </p>
                            <Button 
                                variant="destructive"
                                className="w-full font-bold shadow-lg shadow-destructive/10"
                                onClick={handleCancelSubscription}
                                disabled={cancelling}
                            >
                                {cancelling ? "Cancelando..." : "Cancelar Assinatura"}
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Manual Active Card (Only shown if plan is active AND subscription is NOT recurring ACTIVE) */}
                {!isExpired && user.subscriptionStatus !== "ACTIVE" && (
                    <Card className="shadow-md border-border/50 bg-primary/5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-primary">
                                <ShieldCheck className="w-5 h-5" />
                                Licença Manual Ativa
                            </CardTitle>
                            <CardDescription>
                                Seu acesso está ativado por meio de uma chave de licença manual.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Esta licença é pré-paga e válida até <strong>{expiryDate?.toLocaleDateString('pt-BR')}</strong>. Como não é uma assinatura recorrente com cobrança automática, você não precisa se preocupar com cobranças futuras!
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Pricing Info or Purchase Options */}
            <Card className="bg-primary/5 border-primary/20 border-dashed border-2">
                <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-2 text-center md:text-left">
                        <h3 className="text-xl font-bold flex items-center justify-center md:justify-start gap-2">
                            <Sparkles className="text-primary" />
                            Precisa de uma nova licença?
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Entre em contato com seu gestor ou adquira diretamente no portal de pagamentos.
                        </p>
                    </div>
                    <Link href="/planos">
                        <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
                            <CreditCard className="mr-2 h-4 w-4" /> Comprar Agora
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
}
