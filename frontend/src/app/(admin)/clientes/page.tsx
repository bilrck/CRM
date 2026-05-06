"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/app/api/userProvider";
import { Plus, Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClientFormDialog } from "./components/ClientFormDialog";

export default function ClientesPage() {
  const user = useUser();
  const router = useRouter();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // 🔥 Role-based access control
  useEffect(() => {
    if (user && !["MANAGER", "ADMIN"].includes(user.role)) {
      router.replace("/dashboard");
    }
  }, [user, router]);

  // 🔥 Fetch clients
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients`, {
          credentials: "include",
        });
        
        if (res.ok) {
          const data = await res.json();
          setClients(data.clients || []);
        }
      } catch (error) {
        console.error("Error fetching clients:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user && ["MANAGER", "ADMIN"].includes(user.role)) {
      fetchClients();
    }
  }, [user]);

  // 🔥 Refresh clients list
  const refreshClients = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients`, {
        credentials: "include",
      });
      
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients || []);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  if (!user || !["MANAGER", "ADMIN"].includes(user.role)) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] bg-background">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 mb-4 animate-pulse border border-primary/20">
             <div className="w-6 h-6 rounded-full bg-primary shadow-[0_0_15px_rgba(5,150,105,0.5)]" />
        </div>
        <p className="text-xl text-foreground font-semibold tracking-tight">Carregando clientes...</p>
        <p className="text-sm text-muted-foreground mt-1">Preparando seus dados</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Clientes</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus clientes e relacionamentos
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-border hover:bg-muted/50">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button onClick={() => setIsDialogOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
            <Plus className="mr-2 h-4 w-4" />
            Novo Cliente
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por nome, email, empresa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-background border-input"
          />
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-card rounded-2xl border shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                  Cliente
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                  Empresa
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                  Contato
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                  Responsável
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {clients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    Nenhum cliente cadastrado ainda.
                    <br />
                    <Button className="mt-4" variant="outline" onClick={() => setIsDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Cadastrar Primeiro Cliente
                    </Button>
                  </td>
                </tr>
              ) : (
                clients.map((client: any) => (
                  <tr key={client.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-foreground tracking-tight">
                        {client.name}
                      </div>
                      <div className="text-sm text-muted-foreground">{client.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground font-medium">
                      {client.company || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground font-medium">
                      {client.phone || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-[11px] leading-5 font-bold rounded-full border ${
                          client.status === "ACTIVE"
                            ? "bg-primary/10 text-primary border-primary/20"
                            : client.status === "INACTIVE"
                            ? "bg-muted text-muted-foreground border-border"
                            : "bg-destructive/10 text-destructive border-destructive/20"
                        }`}
                      >
                        {client.status === "ACTIVE"
                          ? "Ativo"
                          : client.status === "INACTIVE"
                          ? "Inativo"
                          : "Churned"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {client.assignedTo?.name || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                        Editar
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Client Form Dialog */}
      <ClientFormDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSuccess={refreshClients}
      />
    </div>
  );
}
