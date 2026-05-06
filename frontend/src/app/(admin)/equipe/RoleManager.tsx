"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Plus, Shield, Trash2, Edit } from "lucide-react";

const AVAILABLE_PERMISSIONS = [
  { id: "leads:read", label: "Ver Leads" },
  { id: "leads:write", label: "Criar/Editar Leads" },
  { id: "leads:delete", label: "Excluir Leads" },
  { id: "team:read", label: "Ver Equipe" },
  { id: "team:manage", label: "Gerenciar Equipe" },
  { id: "whatsapp:read", label: "Ver Conversas" },
  { id: "whatsapp:write", label: "Enviar Mensagens" },
  { id: "settings:manage", label: "Configurações" },
];

export function RoleManager({ workspaceId }: { workspaceId: number }) {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create/Edit State
  const [open, setOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", permissions: [] as string[] });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, [workspaceId]);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/roles`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setRoles(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return toast.error("Nome é obrigatório");

    setSubmitting(true);
    try {
      const url = editingRole 
         ? `${process.env.NEXT_PUBLIC_API_URL}/roles/${editingRole.id}`
         : `${process.env.NEXT_PUBLIC_API_URL}/roles`;
      
      const method = editingRole ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      if (res.ok) {
        toast.success(editingRole ? "Cargo atualizado!" : "Cargo criado!");
        setOpen(false);
        fetchRoles();
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao salvar cargo");
      }
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
      if(!confirm("Tem certeza? Esta ação não pode ser desfeita.")) return;
      try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/roles/${id}`, {
              method: 'DELETE',
              credentials: 'include'
          });
          if(res.ok) {
              toast.success("Cargo excluído");
              fetchRoles();
          } else {
              const data = await res.json();
              toast.error(data.error || "Erro");
          }
      } catch {
          toast.error("Erro ao excluir");
      }
  };

  const openEdit = (role: any) => {
      setEditingRole(role);
      setFormData({ name: role.name, permissions: role.permissions || [] });
      setOpen(true);
  };

  const openCreate = () => {
      setEditingRole(null);
      setFormData({ name: "", permissions: [] });
      setOpen(true);
  };

  const togglePermission = (permId: string) => {
      setFormData(prev => {
          if (prev.permissions.includes(permId)) {
              return { ...prev, permissions: prev.permissions.filter(p => p !== permId) };
          } else {
              return { ...prev, permissions: [...prev.permissions, permId] };
          }
      });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-foreground">Cargos & Permissões</h2>
        <Button onClick={openCreate} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="mr-2 h-4 w-4" /> Novo Cargo
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingRole ? "Editar Cargo" : "Criar Novo Cargo"}</DialogTitle>
            <DialogDescription>Defina o nome e as permissões de acesso para este cargo.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Nome do Cargo</Label>
              <Input 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                placeholder="Ex: Analista de Vendas" 
              />
            </div>
            
            <div className="space-y-3">
              <Label>Permissões</Label>
              <div className="grid grid-cols-2 gap-4 border border-border p-4 rounded-lg bg-muted/50">
                 {AVAILABLE_PERMISSIONS.map(perm => (
                     <div key={perm.id} className="flex items-center space-x-2">
                        <Checkbox 
                           id={perm.id} 
                           checked={formData.permissions.includes(perm.id)}
                           onCheckedChange={() => togglePermission(perm.id)}
                        />
                        <Label htmlFor={perm.id} className="cursor-pointer font-normal text-foreground">
                           {perm.label}
                        </Label>
                     </div>
                 ))}
              </div>
            </div>

            <DialogFooter>
               <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
               <Button type="submit" disabled={submitting} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  {submitting ? <Loader2 className="animate-spin h-4 w-4" /> : "Salvar"}
               </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <div className="border border-border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Permissões</TableHead>
              <TableHead>Membros</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-4 text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : roles.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-4 text-muted-foreground">Nenhum cargo personalizado criado.</TableCell></TableRow>
            ) : (
                roles.map(role => (
                    <TableRow key={role.id}>
                        <TableCell className="font-medium flex items-center text-foreground">
                            <Shield className="mr-2 h-4 w-4 text-primary" />
                            {role.name}
                        </TableCell>
                        <TableCell>
                            <div className="flex flex-wrap gap-1">
                               {role.permissions?.slice(0, 3).map((p: string) => (
                                   <Badge key={p} variant="secondary" className="text-[10px]">{p}</Badge>
                               ))}
                               {(role.permissions?.length || 0) > 3 && (
                                   <Badge variant="outline" className="text-[10px]">+{role.permissions.length - 3}</Badge>
                               )}
                            </div>
                        </TableCell>
                        <TableCell>{role._count?.members || 0}</TableCell>
                        <TableCell className="text-right">
                           {role.isSystem ? (
                               <Badge variant="secondary" className="bg-secondary text-secondary-foreground border-transparent">Sistema</Badge>
                           ) : (
                               <div className="flex justify-end gap-2">
                                   <Button size="icon" variant="ghost" onClick={() => openEdit(role)}>
                                       <Edit className="h-4 w-4 text-blue-500" />
                                   </Button>
                                   <Button size="icon" variant="ghost" className="hover:bg-destructive/10" onClick={() => handleDelete(role.id)}>
                                       <Trash2 className="h-4 w-4 text-destructive" />
                                   </Button>
                               </div>
                           )}
                        </TableCell>
                    </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
