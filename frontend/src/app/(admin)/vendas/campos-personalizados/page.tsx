"use client";

import { useState, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  Settings2, 
  GripVertical, 
  Info,
  Save,
  X,
  PlusCircle,
  Hash,
  Type,
  Calendar,
  List,
  CheckSquare
} from "lucide-react";
import { toast } from "sonner";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const API = process.env.NEXT_PUBLIC_API_URL;

const FIELD_TYPES = [
  { value: "TEXT", label: "Texto Curto", icon: Type },
  { value: "NUMBER", label: "Número", icon: Hash },
  { value: "DATE", label: "Data", icon: Calendar },
  { value: "SELECT", label: "Seleção (Dropdown)", icon: List },
  { value: "BOOLEAN", label: "Sim/Não (Checkbox)", icon: CheckSquare },
];

export default function CustomFieldsPage() {
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("LEAD");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<any>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    type: "TEXT",
    placeholder: "",
    isRequired: false,
    options: [] as string[],
    entityType: "LEAD"
  });
  const [newOption, setNewOption] = useState("");

  useEffect(() => {
    fetchFields();
  }, [activeTab]);

  const fetchFields = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/custom-fields?entityType=${activeTab}`, { 
        credentials: "include" 
      });
      if (res.ok) {
        const data = await res.json();
        setFields(data);
      }
    } catch (err) {
      toast.error("Erro ao carregar campos");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name) return toast.error("O nome é obrigatório");

    const method = editingField ? "PUT" : "POST";
    const url = editingField ? `${API}/custom-fields/${editingField.id}` : `${API}/custom-fields`;

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, entityType: activeTab }),
        credentials: "include"
      });

      if (res.ok) {
        toast.success(editingField ? "Campo atualizado" : "Campo criado");
        setIsDialogOpen(false);
        resetForm();
        fetchFields();
      } else {
        toast.error("Erro ao salvar campo");
      }
    } catch (err) {
      toast.error("Erro de conexão");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este campo? Isso apagará os dados já preenchidos nos leads/clientes.")) return;

    try {
      const res = await fetch(`${API}/custom-fields/${id}`, { 
        method: "DELETE", 
        credentials: "include" 
      });
      if (res.ok) {
        toast.success("Campo removido");
        fetchFields();
      }
    } catch (err) {
      toast.error("Erro ao excluir");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      type: "TEXT",
      placeholder: "",
      isRequired: false,
      options: [],
      entityType: activeTab
    });
    setEditingField(null);
  };

  const openEdit = (field: any) => {
    setEditingField(field);
    setFormData({
      name: field.name,
      type: field.type,
      placeholder: field.placeholder || "",
      isRequired: field.isRequired,
      options: field.options || [],
      entityType: field.entityType
    });
    setIsDialogOpen(true);
  };

  const addOption = () => {
    if (!newOption) return;
    setFormData(prev => ({ ...prev, options: [...prev.options, newOption] }));
    setNewOption("");
  };

  const removeOption = (index: number) => {
    setFormData(prev => ({ ...prev, options: prev.options.filter((_, i) => i !== index) }));
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campos Personalizados</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie campos adicionais para seus Leads e Clientes.
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2 rounded-xl shadow-lg shadow-primary/20">
              <PlusCircle className="size-4" />
              Novo Campo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-2xl">
            <DialogHeader>
              <DialogTitle>{editingField ? "Editar Campo" : "Criar Novo Campo"}</DialogTitle>
              <DialogDescription>
                Defina o nome e o tipo do campo para {activeTab === "LEAD" ? "Leads" : "Clientes"}.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome do Campo</Label>
                <Input 
                  placeholder="Ex: CPF, Cor Favorita, Link do Perfil" 
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Campo</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={val => setFormData(prev => ({ ...prev, type: val }))}
                  >
                    <SelectTrigger className="rounded-lg">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {FIELD_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="size-4 opacity-70" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end h-full pb-3">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="required" 
                      checked={formData.isRequired}
                      onCheckedChange={val => setFormData(prev => ({ ...prev, isRequired: val }))}
                    />
                    <Label htmlFor="required">Obrigatório</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Placeholder (Opcional)</Label>
                <Input 
                  placeholder="Texto de ajuda dentro do campo" 
                  value={formData.placeholder}
                  onChange={e => setFormData(prev => ({ ...prev, placeholder: e.target.value }))}
                  className="rounded-lg"
                />
              </div>

              {formData.type === "SELECT" && (
                <div className="space-y-3 p-4 bg-muted/50 rounded-xl border border-dashed border-muted-foreground/20">
                  <Label>Opções da Lista</Label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Adicionar opção..." 
                      value={newOption}
                      onChange={e => setNewOption(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addOption()}
                      className="rounded-lg"
                    />
                    <Button type="button" size="icon" onClick={addOption} className="shrink-0 rounded-lg">
                      <Plus className="size-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.options.map((opt, idx) => (
                      <Badge key={idx} variant="secondary" className="gap-1 px-2 py-1 rounded-md">
                        {opt}
                        <X className="size-3 cursor-pointer hover:text-red-500" onClick={() => removeOption(idx)} />
                      </Badge>
                    ))}
                    {formData.options.length === 0 && (
                      <p className="text-[10px] text-muted-foreground italic">Nenhuma opção adicionada.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-lg">Cancelar</Button>
              <Button onClick={handleSave} className="rounded-lg gap-2">
                <Save className="size-4" />
                {editingField ? "Salvar Alterações" : "Criar Campo"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="LEAD" onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-[400px] grid-cols-2 p-1 bg-muted/50 rounded-xl">
          <TabsTrigger value="LEAD" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Leads</TabsTrigger>
          <TabsTrigger value="CLIENT" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Clientes</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <Card className="border-none shadow-xl shadow-muted/20 rounded-2xl overflow-hidden">
            <CardHeader className="bg-muted/10 pb-4">
              <div className="flex items-center gap-2">
                <Settings2 className="size-5 text-primary" />
                <div>
                  <CardTitle>Campos de {activeTab === "LEAD" ? "Leads" : "Clientes"}</CardTitle>
                  <CardDescription>Estes campos aparecerão ao criar ou editar {activeTab === "LEAD" ? "leads" : "clientes"}.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-12 text-center text-muted-foreground">Carregando campos...</div>
              ) : fields.length === 0 ? (
                <div className="p-16 flex flex-col items-center justify-center text-center gap-4 bg-muted/5">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <Info className="size-8 text-muted-foreground/50" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Nenhum campo personalizado</h3>
                    <p className="text-muted-foreground max-w-xs mx-auto">Você ainda não criou campos extras para seus {activeTab === "LEAD" ? "leads" : "clientes"}.</p>
                  </div>
                  <Button variant="outline" onClick={() => setIsDialogOpen(true)} className="rounded-lg mt-2">
                    Criar primeiro campo
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {fields.map((field) => {
                    const typeInfo = FIELD_TYPES.find(t => t.value === field.type);
                    return (
                      <div key={field.id} className="flex items-center p-4 hover:bg-muted/20 transition-colors group">
                        <GripVertical className="size-4 text-muted-foreground/30 cursor-grab group-hover:text-muted-foreground/60" />
                        
                        <div className="ml-4 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{field.name}</span>
                            {field.isRequired && (
                              <Badge variant="destructive" className="h-4 text-[9px] uppercase px-1 rounded">Obrigatório</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-1">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              {typeInfo && <typeInfo.icon className="size-3" />}
                              {typeInfo?.label}
                            </div>
                            {field.placeholder && (
                              <div className="text-xs text-muted-foreground italic">
                                Placeholder: "{field.placeholder}"
                              </div>
                            )}
                            {field.options?.length > 0 && (
                              <div className="text-xs text-muted-foreground">
                                {field.options.length} opções
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="rounded-lg h-8 w-8" onClick={() => openEdit(field)}>
                            <Settings2 className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="rounded-lg h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(field.id)}>
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="mt-4 flex items-center gap-2 p-4 bg-primary/5 rounded-xl border border-primary/10">
            <Info className="size-4 text-primary shrink-0" />
            <p className="text-xs text-primary/80 font-medium">
              Dica: Você pode usar estes campos em suas integrações de Webhook e em automações inteligentes.
            </p>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
