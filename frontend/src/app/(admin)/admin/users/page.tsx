"use client";
import { useState, useEffect } from "react";
import { 
    Edit, 
    Trash, 
    Plus
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    maxMetaConnections: number;
    maxWhatsappConnections: number;
    subscriptionStatus: string;
    subscriptionPlan?: string;
    subscriptionExpiresAt?: string;
    trialEndsAt?: string;
    billingStatus: string;
    billingReminderConfig?: {
        channel: string;
        daysBefore: string | number;
        frequency: string | number;
        message: string;
    };
    maxTotalInstances: number;
    createdAt: string;
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const [formData, setFormData] = useState<{
        name: string;
        email: string;
        password: string;
        role: string;
        maxMetaConnections: string;
        maxWhatsappConnections: string;
        subscriptionStatus: string;
        subscriptionPlan: string;
        subscriptionExpiresAt: string;
        billingStatus: string;
        billingReminderConfig: {
            channel: string;
            daysBefore: string | number;
            frequency: string | number;
            message: string;
        };
        maxTotalInstances: string;
    }>({
        name: "",
        email: "",
        password: "",
        role: "CLIENTE",
        maxMetaConnections: "1",
        maxWhatsappConnections: "1",
        subscriptionStatus: "TRIAL",
        subscriptionPlan: "",
        subscriptionExpiresAt: "",
        billingStatus: "ativo",
        billingReminderConfig: {
            channel: "painel",
            daysBefore: "3",
            frequency: "1",
            message: "Seu plano expira em breve. Evite interrupções realizando o pagamento."
        },
        maxTotalInstances: "5"
    });

    const resetForm = () => {
        setFormData({
            name: "",
            email: "",
            password: "",
            role: "CLIENTE",
            maxMetaConnections: "1",
            maxWhatsappConnections: "1",
            subscriptionStatus: "TRIAL",
            subscriptionPlan: "",
            subscriptionExpiresAt: "",
            billingStatus: "ativo",
            billingReminderConfig: {
                channel: "painel",
                daysBefore: "3",
                frequency: "1",
                message: "Seu plano expira em breve. Evite interrupções realizando o pagamento."
            },
            maxTotalInstances: "5"
        });
    };

    const fetchUsers = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users`, {
                credentials: 'include'
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            } else {
                toast.error("Erro ao carregar usuários (Acesso negado?)");
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleSubmit = async () => {
        const url = editingUser 
            ? `${process.env.NEXT_PUBLIC_API_URL}/admin/users/${editingUser.id}`
            : `${process.env.NEXT_PUBLIC_API_URL}/admin/users`;
        
        const method = editingUser ? "PUT" : "POST";

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
                credentials: 'include'
            });

            if (!res.ok) throw new Error("Falha na operação");
            
            toast.success(editingUser ? "Usuário atualizado" : "Usuário criado");
            setIsDialogOpen(false);
            setEditingUser(null);
            resetForm();
            fetchUsers();

        } catch (error) {
            console.error("Erro ao salvar usuário:", error);
            toast.error("Erro ao salvar usuário");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Tem certeza que deseja excluir este usuário?")) return;
        try {
             const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${id}`, {
                method: "DELETE",
                credentials: 'include'
            });
            if (res.ok) {
                toast.success("Usuário excluído");
                fetchUsers();
            } else {
                toast.error("Erro ao excluir. Verifique se não é você mesmo.");
            }
        } catch (error) {
            console.error("Erro ao excluir usuário:", error);
            toast.error("Erro ao excluir usuário");
        }
    };

    const openEdit = (user: User) => {
        setEditingUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            password: "", 
            role: user.role,
            maxMetaConnections: String(user.maxMetaConnections),
            maxWhatsappConnections: String(user.maxWhatsappConnections),
            subscriptionStatus: user.subscriptionStatus || "TRIAL",
            subscriptionPlan: user.subscriptionPlan || "",
            subscriptionExpiresAt: user.subscriptionExpiresAt ? user.subscriptionExpiresAt.split('T')[0] : "",
            billingStatus: user.billingStatus || "ativo",
            billingReminderConfig: user.billingReminderConfig || {
                channel: "painel",
                daysBefore: "3",
                frequency: "1",
                message: "Seu plano expira em breve. Evite interrupções realizando o pagamento."
            },
            maxTotalInstances: String(user.maxTotalInstances || 5)
        });
        setIsDialogOpen(true);
    };

    return (
        <div className="p-8 space-y-8 bg-background min-h-screen">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Gestão de Usuários</h1>
                    <p className="text-muted-foreground mt-1">Gerencie acessos e limites da plataforma</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if(!open) {
                        setEditingUser(null);
                        resetForm();
                    }
                }}>
                    <DialogTrigger asChild>
                        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
                            <Plus className="mr-2 h-4 w-4" />
                            Novo Usuário
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Nome</label>
                                <Input 
                                    value={formData.name} 
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email</label>
                                <Input 
                                    value={formData.email} 
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Senha {editingUser && '(Deixe em branco para manter)'}</label>
                                <Input 
                                    type="password"
                                    value={formData.password} 
                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Função</label>
                                    <Select 
                                        value={formData.role} 
                                        onValueChange={(val) => setFormData({...formData, role: val})}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ADMIN">Admin</SelectItem>
                                            <SelectItem value="GESTOR">Gestor</SelectItem>
                                            <SelectItem value="CLIENTE">Cliente</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Status Assinatura</label>
                                    <Select 
                                        value={formData.subscriptionStatus} 
                                        onValueChange={(val) => setFormData({...formData, subscriptionStatus: val})}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="TRIAL">Teste (10 dias)</SelectItem>
                                            <SelectItem value="ACTIVE">Ativo</SelectItem>
                                            <SelectItem value="EXPIRED">Expirado</SelectItem>
                                            <SelectItem value="CANCELED">Cancelado</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Plano</label>
                                    <Select 
                                        value={formData.subscriptionPlan} 
                                        onValueChange={(val) => setFormData({...formData, subscriptionPlan: val})}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Plano" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="MONTHLY">Mensal</SelectItem>
                                            <SelectItem value="QUARTERLY">Trimestral</SelectItem>
                                            <SelectItem value="ANNUAL">Anual</SelectItem>
                                            <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Vencimento da Assinatura</label>
                                    <Input 
                                        type="date"
                                        value={formData.subscriptionExpiresAt} 
                                        onChange={(e) => setFormData({...formData, subscriptionExpiresAt: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-primary">Status do Plano (Novo)</label>
                                    <Select 
                                        value={formData.billingStatus} 
                                        onValueChange={(val) => setFormData({...formData, billingStatus: val})}
                                    >
                                        <SelectTrigger className="border-primary/20 bg-primary/5">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ativo">Ativo</SelectItem>
                                            <SelectItem value="pendente">Pendente</SelectItem>
                                            <SelectItem value="inativo">Inativo</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="border rounded-xl p-4 bg-muted/30 space-y-4">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Configuração de Lembretes Automáticos</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase text-muted-foreground">Como Notificar</label>
                                        <Select 
                                            value={formData.billingReminderConfig?.channel} 
                                            onValueChange={(val) => setFormData({
                                                ...formData, 
                                                billingReminderConfig: { ...formData.billingReminderConfig, channel: val }
                                            })}
                                        >
                                            <SelectTrigger className="h-8 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="painel">Painel</SelectItem>
                                                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                                                <SelectItem value="both">Ambos</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase text-muted-foreground">Quando (Dias Antes)</label>
                                        <Input 
                                            type="number"
                                            className="h-8 text-xs"
                                            value={formData.billingReminderConfig?.daysBefore} 
                                            onChange={(e) => setFormData({
                                                ...formData, 
                                                billingReminderConfig: { ...formData.billingReminderConfig, daysBefore: e.target.value }
                                            })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase text-muted-foreground">Quantas Vezes</label>
                                        <Input 
                                            type="number"
                                            className="h-8 text-xs"
                                            value={formData.billingReminderConfig?.frequency} 
                                            onChange={(e) => setFormData({
                                                ...formData, 
                                                billingReminderConfig: { ...formData.billingReminderConfig, frequency: e.target.value }
                                            })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Mensagem do Lembrete</label>
                                    <textarea 
                                        className="w-full min-h-[60px] p-2 text-xs rounded-md border bg-background"
                                        value={formData.billingReminderConfig?.message} 
                                        onChange={(e) => setFormData({
                                            ...formData, 
                                            billingReminderConfig: { ...formData.billingReminderConfig, message: e.target.value }
                                        })}
                                        placeholder="Por que notificar? Escreva aqui a mensagem..."
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Instâncias Totais</label>
                                    <Input 
                                        type="number"
                                        min="0"
                                        value={formData.maxTotalInstances} 
                                        onChange={(e) => setFormData({...formData, maxTotalInstances: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Meta Con.</label>
                                    <Input 
                                        type="number"
                                        min="0"
                                        value={formData.maxMetaConnections} 
                                        onChange={(e) => setFormData({...formData, maxMetaConnections: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Whats Con.</label>
                                    <Input 
                                        type="number"
                                        min="0"
                                        value={formData.maxWhatsappConnections} 
                                        onChange={(e) => setFormData({...formData, maxWhatsappConnections: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                            <Button onClick={handleSubmit}>Salvar</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="bg-card rounded-2xl shadow-sm border overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Assinatura / Plano</TableHead>
                            <TableHead>Limites</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium text-foreground">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                            {user.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        {user.name}
                                    </div>
                                </TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <Badge variant={user.subscriptionStatus === 'ACTIVE' ? 'default' : user.subscriptionStatus === 'TRIAL' ? 'outline' : 'destructive'} className={user.subscriptionStatus === 'ACTIVE' ? "bg-primary text-primary-foreground" : ""}>
                                                {user.subscriptionStatus}
                                            </Badge>
                                            <Badge 
                                                className={`text-[10px] uppercase font-bold ${
                                                    user.billingStatus === 'ativo' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200' :
                                                    user.billingStatus === 'pendente' ? 'bg-amber-500/10 text-amber-600 border-amber-200' :
                                                    'bg-rose-500/10 text-rose-600 border-rose-200'
                                                }`}
                                            >
                                                {user.billingStatus}
                                            </Badge>
                                        </div>
                                        {user.subscriptionPlan && (
                                            <Badge variant="secondary" className="text-[10px] py-0 bg-muted text-muted-foreground border-transparent w-fit">
                                                {user.subscriptionPlan}
                                            </Badge>
                                        )}
                                        {user.subscriptionExpiresAt && (
                                          <span className="text-[10px] text-muted-foreground font-medium">
                                            Vence: {new Date(user.subscriptionExpiresAt).toLocaleDateString()}
                                          </span>
                                        )}
                                        {user.subscriptionStatus === 'TRIAL' && user.trialEndsAt && !user.subscriptionExpiresAt && (
                                          <span className="text-[10px] text-muted-foreground">Trial expira: {new Date(user.trialEndsAt).toLocaleDateString()}</span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex gap-2">
                                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                                            M: {user.maxMetaConnections}
                                        </Badge>
                                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                                            W: {user.maxWhatsappConnections}
                                        </Badge>
                                        <Badge variant="outline" className="bg-muted text-muted-foreground border-border">
                                            T: {user.maxTotalInstances}
                                        </Badge>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => openEdit(user)} className="text-muted-foreground hover:text-foreground">
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(user.id)} className="text-destructive/80 hover:text-destructive hover:bg-destructive/10">
                                            <Trash className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

