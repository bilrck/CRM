"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useWorkspace } from "@/app/api/userProvider";
import { Loader2, Plus, Briefcase, Check } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function WorkspacePage() {
    const { currentWorkspace, workspaces, switchWorkspace } = useWorkspace();
    
    // Edit State
    const [editName, setEditName] = useState("");
    const [submitting, setSubmitting] = useState(false);
    
    // Create State
    const [newWorkspaceName, setNewWorkspaceName] = useState("");
    const [creating, setCreating] = useState(false);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);

    // Sync edit name
    useEffect(() => {
        if (currentWorkspace) {
            setEditName(currentWorkspace.name);
        }
    }, [currentWorkspace]);

    const handleUpdate = async () => {
        try {
            setSubmitting(true);
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workspace`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editName }),
                credentials: 'include'
            });

            if (res.ok) {
                toast.success("Workspace atualizado! Recarregando...");
                setTimeout(() => window.location.reload(), 1000);
            } else {
                toast.error("Erro ao atualizar workspace");
            }
        } catch {
            toast.error("Erro de conexão");
        } finally {
            setSubmitting(false);
        }
    };

    const handleCreate = async () => {
        if (!newWorkspaceName) return toast.error("Nome é obrigatório");
        
        try {
            setCreating(true);
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workspace`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newWorkspaceName }),
                credentials: 'include'
            });

            if (res.ok) {
                toast.success("Workspace criado com sucesso!");
                setCreateDialogOpen(false);
                setTimeout(() => window.location.reload(), 1000);
            } else {
                const data = await res.json();
                toast.error(data.error || "Erro ao criar workspace");
            }
        } catch {
            toast.error("Erro de conexão");
        } finally {
            setCreating(false);
        }
    };

    if (!currentWorkspace && workspaces.length === 0) {
        return <div className="p-8">Carregando informações...</div>;
    }

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Meus Workspaces</h1>
                    <p className="text-muted-foreground">Gerencie suas áreas de trabalho e equipes.</p>
                </div>
                
                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                   <DialogTrigger asChild>
                      <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                          <Plus className="mr-2 h-4 w-4" /> Novo Workspace
                      </Button>
                   </DialogTrigger>
                   <DialogContent>
                       <DialogHeader>
                           <DialogTitle>Criar Novo Workspace</DialogTitle>
                           <DialogDescription>
                               Crie um novo espaço para gerenciar leads, conversas e equipe separadamente.
                           </DialogDescription>
                       </DialogHeader>
                       <div className="py-4 space-y-4">
                           <div className="space-y-2">
                               <Label>Nome do Workspace</Label>
                               <Input 
                                  placeholder="Ex: Filial São Paulo" 
                                  value={newWorkspaceName}
                                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                               />
                           </div>
                       </div>
                       <DialogFooter>
                           <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancelar</Button>
                           <Button onClick={handleCreate} disabled={creating} className="bg-emerald-600">
                               {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                               Criar Workspace
                           </Button>
                       </DialogFooter>
                   </DialogContent>
                </Dialog>
            </div>

            <Tabs defaultValue="settings" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="settings">Configuração Atual</TabsTrigger>
                    <TabsTrigger value="list">Todos os Workspaces</TabsTrigger>
                </TabsList>

                <TabsContent value="settings" className="space-y-6">
                    {!currentWorkspace ? (
                        <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhum workspace selecionado</CardContent></Card>
                    ) : (
                        <>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Detalhes do Workspace ({currentWorkspace.name})</CardTitle>
                                    <CardDescription>Edite as informações do workspace ativo.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Nome do Workspace</Label>
                                        <Input 
                                            id="name" 
                                            value={editName} 
                                            onChange={e => setEditName(e.target.value)} 
                                        />
                                    </div>
                                </CardContent>
                                <CardFooter className="justify-end border-t border-border p-4 bg-muted/30">
                                    <Button onClick={handleUpdate} disabled={submitting}>
                                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Salvar Alterações
                                    </Button>
                                </CardFooter>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Membros Ativos</CardTitle>
                                    <CardDescription>
                                        Gira os membros deste workspace na aba <strong>Equipe</strong> no menu lateral.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Nome</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Função</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {currentWorkspace.members?.map((m: any) => (
                                                <TableRow key={m.id}>
                                                    <TableCell className="font-medium">{m.user.name}</TableCell>
                                                    <TableCell>{m.user.email}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={m.role === 'ADMIN' ? 'default' : 'secondary'}>
                                                            {m.role}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </TabsContent>

                <TabsContent value="list">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {workspaces.map((ws: any) => (
                            <Card key={ws.id} className={`cursor-pointer transition-all hover:shadow-md ${currentWorkspace?.id === ws.id ? 'border-primary ring-1 ring-primary bg-primary/5' : ''}`} onClick={() => switchWorkspace(ws.id)}>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        Workspace
                                    </CardTitle>
                                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{ws.name}</div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {ws.role === 'ADMIN' ? 'Administrador' : 'Membro'}
                                    </p>
                                    {currentWorkspace?.id === ws.id && (
                                        <div className="mt-4 flex items-center text-sm text-primary font-medium">
                                            <Check className="mr-1 h-4 w-4" /> Ativo Agora
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
