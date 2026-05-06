"use client";
import { Button } from "@/components/ui/button";
import { FormEvent, useEffect, useState, useCallback } from "react";
import {
  Briefcase,
  Crown,
  MoreVertical,
  UserPlus,
  Users,
  Edit,
  Trash2,
  Shield,
  Network,
  ShieldCheck
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useWorkspace } from "@/app/api/userProvider";
import { RoleManager } from "./RoleManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TeamMember {
  id: string; // ID of the WorkspaceMember relation
  userId: number;
  name: string;
  email: string;
  role: string;
  roleName?: string;
  permissions?: string[];
  joinedAt: string;
  status?: string; 
}

export default function Equipe() {
  const { currentWorkspace } = useWorkspace();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Invite State
  const [open, setOpen] = useState(false);
  const [inviteType, setInviteType] = useState("TEAM"); // TEAM (Internal) or HIERARCHY (Gestor/Cliente)
  const [inviteRole, setInviteRole] = useState("MEMBER"); // System Role
  const [inviteRoleId, setInviteRoleId] = useState<string>("no_role"); // Custom Role ID
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");

  // Edit/Delete State
  const [editingMember, setEditingMember] = useState<{id: string, role: string, roleId?: number} | null>(null);
  const [deletingMember, setDeletingMember] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    if (!currentWorkspace) return;
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/team`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      } else {
        setMembers([]);
      }
    } catch (error) {
      console.error("Erro ao buscar membros", error);
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace]);

  const fetchRoles = useCallback(async () => {
     try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/roles`, { credentials: "include" });
        if(res.ok) {
            setRoles(await res.json());
        }
     } catch {}
  }, []);

  useEffect(() => {
    fetchMembers();
    fetchRoles();
  }, [fetchMembers, fetchRoles]);

  async function handleInvite(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!inviteEmail) return toast.error("Email obrigatório");

    try {
      setInviting(true);
      
      const payload: { email: string; role?: string; roleId?: string } = { 
          email: inviteEmail 
      };

      if (inviteType === 'HIERARCHY') {
          payload.role = inviteRole; // GESTOR or CLIENTE
      } else {
          // Team Invite
          if (inviteRoleId && inviteRoleId !== "no_role") {
             payload.roleId = inviteRoleId;
             payload.role = 'MEMBER'; // Fallback
          } else {
             payload.role = 'MEMBER';
          }
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/team/invite`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.tempPassword) {
            setGeneratedPassword(data.tempPassword);
            setShowPasswordDialog(true);
            setOpen(false); // Close first dialog
        } else {
            toast.success(data.message || "Membro adicionado com sucesso!");
            setOpen(false);
        }
        
        setInviteEmail("");
        fetchMembers();
      } else {
        toast.error(data.error || "Erro ao adicionar membro");
      }
    } catch (error) {
      toast.error("Erro de conexão");
    } finally {
      setInviting(false);
    }
  }

  const handleUpdateRole = async () => {
    if (!editingMember) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/team/role/${editingMember.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            role: 'MEMBER', // Default for updates
            roleId: editingMember.roleId 
        })
      });
      if (!res.ok) throw new Error();
      toast.success('Função atualizada com sucesso');
      setEditingMember(null);
      fetchMembers();
    } catch {
      toast.error('Erro ao atualizar função');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/team/member/${memberId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) throw new Error();
      toast.success('Membro removido com sucesso');
      setDeletingMember(null);
      fetchMembers();
    } catch {
      toast.error('Erro ao remover membro');
    }
  };

  if (!currentWorkspace) {
      return <div className="p-8">Selecione um workspace para gerenciar a equipe.</div>;
  }

  // Stats
  const stats = {
    totalMembers: members.length,
    admins: members.filter(m => m.role === 'ADMIN').length,
    members: members.filter(m => m.role === 'MEMBER').length
  };

  return (
    <div className="p-8 space-y-6 bg-background min-h-screen">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-3xl font-bold tracking-tight text-foreground">Gestão de Equipe</h1>
           <p className="text-muted-foreground">Workspace: <strong className="text-foreground">{currentWorkspace.name}</strong></p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Stats Cards (Simplified for brevity) */}
        <Card className="bg-card border-l-4 border-l-primary/40"><CardContent className="pt-6 flex justify-between"><div><p className="text-sm text-muted-foreground">Membros</p><p className="text-2xl mt-1 text-foreground font-bold">{stats.totalMembers}</p></div><Users className="text-primary"/></CardContent></Card>
        <Card className="bg-card border-l-4 border-l-primary/60"><CardContent className="pt-6 flex justify-between"><div><p className="text-sm text-muted-foreground">Admins</p><p className="text-2xl mt-1 text-foreground font-bold">{stats.admins}</p></div><Crown className="text-primary"/></CardContent></Card>
        <Card className="bg-card border-l-4 border-l-primary/30"><CardContent className="pt-6 flex justify-between"><div><p className="text-sm text-muted-foreground">Staff</p><p className="text-2xl mt-1 text-foreground font-bold">{stats.members}</p></div><Briefcase className="text-primary/70"/></CardContent></Card>
      </div>

      <Tabs defaultValue="members" className="w-full">
         <TabsList>
             <TabsTrigger value="members">Membros da Equipe</TabsTrigger>
             <TabsTrigger value="roles">Cargos & Permissões</TabsTrigger>
         </TabsList>
         
         <TabsContent value="members" className="space-y-4 pt-4">
             <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-foreground">Lista de Membros</CardTitle>
                      <CardDescription className="text-muted-foreground">Usuários com acesso a este workspace.</CardDescription>
                    </div>
                    <Dialog open={open} onOpenChange={setOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                          <UserPlus className="mr-2" size={18} />
                          Adicionar Novo
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Adicionar Membro</DialogTitle>
                          <DialogDescription>
                            Convide alguém para sua equipe interna ou crie um sub-workspace para um Gestor/Cliente.
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleInvite}>
                          <div className="space-y-4 py-4">
                            <div className="bg-muted/50 p-3 rounded-md flex gap-2 border border-border">
                               <Button type="button" variant={inviteType === 'TEAM' ? 'default' : 'outline'} className={`flex-1 ${inviteType === 'TEAM' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}`} onClick={() => setInviteType("TEAM")}>
                                   Equipe Interna
                               </Button>
                               <Button type="button" variant={inviteType === 'HIERARCHY' ? 'default' : 'outline'} className={`flex-1 ${inviteType === 'HIERARCHY' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}`} onClick={() => setInviteType("HIERARCHY")}>
                                   Gestor / Cliente
                               </Button>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="email">Email do Usuário</Label>
                              <Input 
                                id="email" 
                                type="email" 
                                required 
                                value={inviteEmail}
                                onChange={e => setInviteEmail(e.target.value)}
                                placeholder="usuario@email.com"
                              />
                            </div>
                            
                            {inviteType === 'TEAM' ? (
                                <div className="space-y-2">
                                  <Label>Cargo na Equipe</Label>
                                  <Select value={inviteRoleId} onValueChange={setInviteRoleId}>
                                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="no_role">Membro (Padrão)</SelectItem>
                                      {roles.map(r => (
                                          <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <p className="text-xs text-muted-foreground">Define as permissões de acesso específicas.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                  <Label>Tipo de Relacionamento</Label>
                                  <Select value={inviteRole} onValueChange={setInviteRole}>
                                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="GESTOR">Gestor (Cria Workspace de Gestão)</SelectItem>
                                      <SelectItem value="CLIENTE">Cliente (Cria Workspace de Cliente)</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <p className="text-xs text-primary/80 flex items-center gap-1">
                                      <Network className="h-3 w-3"/>
                                      Isso criará um novo workspace filho para este usuário.
                                  </p>
                                </div>
                            )}

                          </div>
                          <DialogFooter>
                            <Button type="button" onClick={() => setOpen(false)} variant="outline">Cancelar</Button>
                            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={inviting}>
                              {inviting ? "Processando..." : (inviteType === 'HIERARCHY' ? "Criar Workspace" : "Adicionar")}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                     <div className="space-y-4">
                    {members.length === 0 && !loading && (
                        <div className="text-center py-8 text-muted-foreground">Nenhum membro encontrado.</div>
                    )}
                    
                    {members.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-4 flex-1">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs">
                                {member.name?.[0]?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-foreground font-medium text-sm">{member.name}</h3>
                                {member.role === 'ADMIN' && <Badge variant="secondary" className="text-[10px] h-5 bg-secondary text-secondary-foreground border-transparent">Admin</Badge>}
                              </div>
                              <p className="text-xs text-muted-foreground">{member.email}</p>
                              
                              <div className="mt-2">
                                 {member.roleName && member.roleName !== 'MEMBER' && member.roleName !== 'ADMIN' ? (
                                     <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                        <Shield size={10} className="mr-1"/> {member.roleName}
                                     </Badge>
                                 ) : (
                                     <span className="text-xs text-muted-foreground/70">Acesso Padrão</span>
                                 )}
                              </div>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setEditingMember({id: member.id, role: member.role, roleId: undefined})}>
                                <Edit className="h-4 w-4 mr-2" />
                                Alterar Cargo
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => setDeletingMember(member.id)}
                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remover
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                    ))}
                    </div>
                </CardContent>
              </Card>
         </TabsContent>
         
         <TabsContent value="roles" className="pt-4">
             <RoleManager workspaceId={currentWorkspace.id} />
         </TabsContent>
      </Tabs>

      {/* Edit Role Dialog */}
      <Dialog open={!!editingMember} onOpenChange={(open) => !open && setEditingMember(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Cargo</DialogTitle>
            <DialogDescription>Selecione um novo cargo para este usuário.</DialogDescription>
          </DialogHeader>
            <div className="space-y-4 py-4">
             <div className="space-y-2">
              <Label>Cargo</Label>
              <Select 
                value={editingMember?.roleId ? String(editingMember.roleId) : "no_role"} 
                onValueChange={(val) => setEditingMember(editingMember ? {...editingMember, roleId: val === "no_role" ? undefined : Number(val)} : null)}
              >
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_role">Membro (Sem cargo específico)</SelectItem>
                  {roles.map(r => (
                      <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
             </div>
            </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMember(null)}>Cancelar</Button>
            <Button onClick={handleUpdateRole} className="bg-primary hover:bg-primary/90 text-primary-foreground">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation */}
      <Dialog open={!!deletingMember} onOpenChange={(open) => !open && setDeletingMember(null)}>
        <DialogContent>
          <DialogHeader>
             <DialogTitle>Remover Membro</DialogTitle>
             <DialogDescription>O usuário perderá acesso a este workspace.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
             <Button variant="outline" onClick={() => setDeletingMember(null)}>Cancelar</Button>
             <Button onClick={() => deletingMember && handleRemoveMember(deletingMember)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Remover</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Success Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
          <DialogContent className="sm:max-w-md">
              <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                      <ShieldCheck className="text-primary" />
                      Membro Registrado!
                  </DialogTitle>
                  <DialogDescription>
                      Como o email não estava no sistema, criamos uma conta temporária para o usuário.
                  </DialogDescription>
              </DialogHeader>
              <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg space-y-3">
                  <p className="text-sm text-primary font-medium">
                      <strong>IMPORTANTE:</strong> O usuário deverá trocar esta senha no primeiro login.
                  </p>
                  <div className="flex items-center justify-between bg-white dark:bg-zinc-950 border border-primary/30 p-3 rounded-md">
                      <code className="text-lg font-mono font-bold text-primary">{generatedPassword}</code>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => {
                            navigator.clipboard.writeText(generatedPassword);
                            toast.success("Copiado!");
                        }}
                      >
                          Copiar
                      </Button>
                  </div>
              </div>
              <DialogFooter>
                  <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => setShowPasswordDialog(false)}>
                      Entendi
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
}

