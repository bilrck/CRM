"use client";
import { useState, useEffect } from "react";
import { 
    Plus, 
    Trash, 
    Edit, 
    Activity, 
    Webhook, 
    Play
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogTrigger,
    DialogFooter 
} from "@/components/ui/dialog";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

interface Automation {
    id: number;
    name: string;
    triggerEvent: string;
    actionType: string;
    actionConfig: {
        url: string;
        method: string;
    };
    isActive: boolean;
}

const TRIGER_EVENTS = [
    { value: "LEAD_CREATED", label: "Lead Criado" },
    { value: "LEAD_UPDATED", label: "Lead Atualizado" }
];

export default function AutomationsPage() {
    const [automations, setAutomations] = useState<Automation[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Automation | null>(null);

    const [formData, setFormData] = useState({
        name: "",
        triggerEvent: "LEAD_CREATED",
        actionType: "WEBHOOK",
        webhookUrl: "",
        method: "POST"
    });

    const resetForm = () => {
        setFormData({
            name: "",
            triggerEvent: "LEAD_CREATED",
            actionType: "WEBHOOK",
            webhookUrl: "",
            method: "POST"
        });
    };

    const fetchAutomations = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/automations`, {
                credentials: 'include'
            });
            if (res.ok) {
                const data = await res.json();
                setAutomations(data);
            }
        } catch (error) {
            console.error("Erro ao carregar automações:", error);
        }
    };

    useEffect(() => {
        fetchAutomations();
    }, []);

    const handleSubmit = async () => {
        if (!formData.name || !formData.webhookUrl) {
            toast.error("Preencha o nome e a URL do Webhook.");
            return;
        }

        const payload = {
            name: formData.name,
            triggerEvent: formData.triggerEvent,
            actionType: formData.actionType,
            actionConfig: {
                url: formData.webhookUrl,
                method: formData.method
            },
            isActive: true
        };

        const url = editingItem 
            ? `${process.env.NEXT_PUBLIC_API_URL}/automations/${editingItem.id}`
            : `${process.env.NEXT_PUBLIC_API_URL}/automations`;
        
        const reqMethod = editingItem ? "PUT" : "POST";

        try {
            const res = await fetch(url, {
                method: reqMethod,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                credentials: 'include'
            });

            if (!res.ok) throw new Error("Falha ao salvar");
            
            toast.success(editingItem ? "Automação atualizada!" : "Automação criada!");
            setIsDialogOpen(false);
            setEditingItem(null);
            resetForm();
            fetchAutomations();

        } catch {
            toast.error("Erro ao salvar automação");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Excluir esta automação permanentemente?")) return;
        try {
             const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/automations/${id}`, {
                method: "DELETE",
                credentials: 'include'
            });
            if (res.ok) {
                toast.success("Automação excluída");
                fetchAutomations();
            }
        } catch {
            toast.error("Erro ao excluir");
        }
    };

    const toggleStatus = async (id: number, currentStatus: boolean) => {
        try {
             await fetch(`${process.env.NEXT_PUBLIC_API_URL}/automations/${id}/toggle`, {
                method: "PATCH",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !currentStatus }),
                credentials: 'include'
            });
            fetchAutomations();
        } catch {
            toast.error("Erro ao alterar status");
        }
    };

    const openEdit = (item: Automation) => {
        setEditingItem(item);
        setFormData({
            name: item.name,
            triggerEvent: item.triggerEvent,
            actionType: item.actionType,
            webhookUrl: item.actionConfig?.url || "",
            method: item.actionConfig?.method || "POST"
        });
        setIsDialogOpen(true);
    };

    // UI Helpers
    const getTriggerBadge = (event: string) => {
        const trigger = TRIGER_EVENTS.find(t => t.value === event);
        return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">{trigger?.label || event}</Badge>;
    };

    return (
        <div className="p-8 space-y-8 bg-background min-h-screen">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Activity className="text-primary"/>
                        Triggers & Ações
                    </h1>
                    <p className="text-muted-foreground mt-1">Automatize processos integrando com Webhooks externos.</p>
                </div>
                
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if(!open) {
                        setEditingItem(null);
                        resetForm();
                    }
                }}>
                    <DialogTrigger asChild>
                        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
                            <Plus className="mr-2 h-4 w-4" />
                            Nova Automação
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>{editingItem ? 'Editar Automação' : 'Criar Automação'}</DialogTitle>
                        </DialogHeader>
                        
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Nome da Regra</label>
                                <Input 
                                    placeholder="Ex: Enviar Lead pro meu sistema"
                                    value={formData.name} 
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                />
                            </div>

                            <Card className="border shadow-none rounded-2xl">
                                <CardHeader className="py-3 bg-muted/50 rounded-t-2xl">
                                    <CardTitle className="text-sm flex items-center gap-2 text-foreground">
                                        <Play size={16} className="text-primary"/>
                                        Quando acontecer isso (Gatilho)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <Select 
                                        value={formData.triggerEvent} 
                                        onValueChange={(val) => setFormData({...formData, triggerEvent: val})}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {TRIGER_EVENTS.map(t =>(
                                                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </CardContent>
                            </Card>

                            <Card className="border shadow-none rounded-2xl">
                                <CardHeader className="py-3 bg-muted/50 rounded-t-2xl">
                                    <CardTitle className="text-sm flex items-center gap-2 text-foreground">
                                        <Webhook size={16} className="text-primary"/>
                                        Fazer isso (Ação)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4 space-y-3">
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">TIPO DE AÇÃO</label>
                                        <Select 
                                            value={formData.actionType} 
                                            onValueChange={(val) => setFormData({...formData, actionType: val})}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="WEBHOOK">Webhook Genérico</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">URL DO WEBHOOK</label>
                                        <Input 
                                            placeholder="https://seu-endpoint.com/webhook..."
                                            value={formData.webhookUrl} 
                                            onChange={(e) => setFormData({...formData, webhookUrl: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">MÉTODO HTTP</label>
                                        <Select 
                                            value={formData.method} 
                                            onValueChange={(val) => setFormData({...formData, method: val})}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="POST">POST (Recomendado)</SelectItem>
                                                <SelectItem value="GET">GET</SelectItem>
                                                <SelectItem value="PUT">PUT</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardContent>
                            </Card>

                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                            <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
                                Salvar Automação
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="bg-card rounded-2xl shadow-sm border overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead>Status</TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead>Gatilho (Quando)</TableHead>
                            <TableHead>Ação (Faz)</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {automations.map((auto) => (
                            <TableRow key={auto.id} className="hover:bg-muted/50 transition-colors">
                                <TableCell>
                                    <Switch 
                                        checked={auto.isActive} 
                                        onCheckedChange={() => toggleStatus(auto.id, auto.isActive)}
                                    />
                                </TableCell>
                                <TableCell className="font-medium text-foreground tracking-tight">{auto.name}</TableCell>
                                <TableCell>
                                    {getTriggerBadge(auto.triggerEvent)}
                                </TableCell>
                                 <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                                            Webhook
                                        </Badge>
                                        <span className="text-xs text-muted-foreground truncate max-w-[200px]" title={auto.actionConfig?.url}>
                                            {auto.actionConfig?.method} {auto.actionConfig?.url}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => openEdit(auto)} className="text-muted-foreground hover:text-foreground">
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(auto.id)} className="text-destructive/80 hover:text-destructive hover:bg-destructive/10">
                                            <Trash className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {automations.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    Nenhuma automação configurada.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
