"use client";

import { useState, useEffect } from "react";
import { 
    Layout, 
    Activity, 
    Smartphone, 
    Users, 
    Settings
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
    DialogFooter 
} from "@/components/ui/dialog";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useUser } from "@/app/api/userProvider";

interface Workspace {
    id: number;
    name: string;
    description?: string;
    status: string;
    maxInstances: number;
    owner: {
        name: string;
        email: string;
    };
    _count: {
        leads: number;
        connections: number;
    };
}

export default function WorkspacesPage() {
    const user = useUser();
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);

    const [formData, setFormData] = useState({
        maxInstances: "1",
        status: "ACTIVE"
    });

    const fetchWorkspaces = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workspace/management/list`, {
                credentials: 'include'
            });
            if (res.ok) {
                const data = await res.json();
                setWorkspaces(data);
            } else {
                toast.error("Erro ao carregar workspaces");
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchWorkspaces();
    }, []);

    const handleSubmit = async () => {
        if (!editingWorkspace) return;

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workspace/management/${editingWorkspace.id}`, {
                method: "PUT",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
                credentials: 'include'
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || "Falha na operação");
            }
            
            toast.success("Workspace atualizado");
            setIsDialogOpen(false);
            fetchWorkspaces();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Erro ao salvar alterações";
            toast.error(message);
        }
    };

    const openEdit = (ws: Workspace) => {
        setEditingWorkspace(ws);
        setFormData({
            maxInstances: String(ws.maxInstances),
            status: ws.status
        });
        setIsDialogOpen(true);
    };

    return (
        <div className="p-8 space-y-8 bg-background min-h-screen">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        {user?.role === 'ADMIN' ? 'Gestão Global de Workspaces' : 'Meus Clientes (Workspaces)'}
                    </h1>
                    <p className="text-muted-foreground mt-1">Controle limites e status dos ambientes</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card p-6 rounded-2xl border shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Layout className="text-primary w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground font-medium">Total Workspaces</p>
                        <p className="text-2xl font-bold text-foreground">{workspaces.length}</p>
                    </div>
                </div>
                {user?.role === 'GESTOR' && (
                    <div className="bg-card p-6 rounded-2xl border shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
                        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                            <Activity className="text-primary w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground font-medium">Minha Capacidade</p>
                            <p className="text-2xl font-bold text-foreground">{user?.maxTotalInstances} <span className="text-sm font-normal text-muted-foreground">instâncias</span></p>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-card rounded-2xl shadow-sm border overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead>Workspace / Proprietário</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Alocação</TableHead>
                            <TableHead>Uso (Leads/Conex)</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {workspaces.map((ws) => (
                            <TableRow key={ws.id} className="hover:bg-muted/50 transition-colors">
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-foreground tracking-tight">{ws.name}</span>
                                        <span className="text-xs text-muted-foreground font-medium">{ws.owner.name} ({ws.owner.email})</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={ws.status === 'ACTIVE' ? 'default' : 'destructive'} className={ws.status === 'ACTIVE' ? "bg-primary text-primary-foreground" : ""}>
                                        {ws.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Smartphone className="w-4 h-4 text-muted-foreground" />
                                        <span className="font-medium text-foreground">{ws.maxInstances} instâncias</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex gap-4">
                                        <div className="flex items-center gap-1">
                                            <Users className="w-4 h-4 text-muted-foreground" />
                                            <span className="text-sm font-medium">{ws._count.leads}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Smartphone className="w-4 h-4 text-muted-foreground" />
                                            <span className="text-sm font-medium">{ws._count.connections}</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" onClick={() => openEdit(ws)} className="text-muted-foreground hover:text-foreground">
                                        <Settings className="w-4 h-4 mr-2" />
                                        Configurar
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Configurar Workspace: {editingWorkspace?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Instâncias Permitidas (WhatsApp)</label>
                            <Input 
                                type="number" 
                                min="1"
                                value={formData.maxInstances}
                                onChange={(e) => setFormData({...formData, maxInstances: e.target.value})}
                            />
                            {user?.role === 'GESTOR' && (
                                <p className="text-[10px] text-muted-foreground">
                                    Total disponível no seu plano: {user?.maxTotalInstances}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Status do Ambiente</label>
                            <Select 
                                value={formData.status}
                                onValueChange={(val) => setFormData({...formData, status: val})}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ACTIVE">Ativo</SelectItem>
                                    <SelectItem value="SUSPENDED">Suspenso</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm" onClick={handleSubmit}>
                            Salvar Alterações
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
