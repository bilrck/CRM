"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Plus,
  Eye,
  Upload,
  Download,
  PlusCircle,
  FileSpreadsheet,
  FileText,
  AlertCircle,
  Check
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";

interface Lead {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  source: string | null;
  status: string;
  value?: string;
  lastContact?: string;
  funnelId?: number;
  stageId?: number;
  customFields?: Record<string, any>;
  createdAt?: string;
}

interface Funnel {
  id: number;
  name: string;
  stages: { id: number; name: string }[];
}

interface CustomField {
  id: number;
  name: string;
  type: "TEXT" | "NUMBER" | "BOOLEAN" | "DATE" | "SELECT";
  options: string[] | null;
  placeholder?: string;
  isRequired?: boolean;
}

export default function Leads() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("Todos");
  const [sortBy, setSortBy] = useState<"name-asc" | "name-desc" | "date-desc" | "date-asc">("date-desc");
  
  // Create / Edit Dialog States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    source: "",
    status: "new",
    value: 0,
    funnelId: "",
    stageId: "",
    customFields: {} as Record<string, any>
  });
  
  // Custom Fields from Backend
  const [customFields, setCustomFields] = useState<CustomField[]>([]);

  // --- Export Dialog States ---
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportRange, setExportRange] = useState<"filtered" | "all">("filtered");
  const [exportFormat, setExportFormat] = useState<"xlsx" | "json">("xlsx");

  // --- Import Dialog & Mapping States ---
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [parsedImportData, setParsedImportData] = useState<any[]>([]);
  const [detectedColumns, setDetectedColumns] = useState<string[]>([]);
  const [importStep, setImportStep] = useState<1 | 2>(1);
  const [importLoading, setImportLoading] = useState(false);

  // Column Mappings for Core Lead Fields
  const [coreMappings, setCoreMappings] = useState({
    name: "",
    email: "",
    phone: "",
    source: "",
    value: "",
    funnelId: "",
    stageId: "",
  });

  // Column Mappings for Custom Fields
  const [customMappings, setCustomMappings] = useState<Record<string, string>>({});

  // Inline Custom Field Creator state
  const [isCreatingCustomField, setIsCreatingCustomField] = useState(false);
  const [newCustomField, setNewCustomField] = useState({
    name: "",
    type: "TEXT" as CustomField["type"],
    placeholder: "",
    optionsInput: "",
  });

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const [leadsRes, funnelsRes, fieldsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads`, { credentials: 'include' }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/funnel`, { credentials: 'include' }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/custom-fields?entityType=LEAD`, { credentials: 'include' })
      ]);
      
      const leadsData = await leadsRes.json();
      const funnelsData = await funnelsRes.json();
      const fieldsData = await fieldsRes.json();
      
      setLeads(Array.isArray(leadsData) ? leadsData : []);
      setFunnels(Array.isArray(funnelsData) ? funnelsData : []);
      setCustomFields(Array.isArray(fieldsData) ? fieldsData : []);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleCreateOrUpdate = async () => {
    try {
      const url = editingLead 
        ? `${process.env.NEXT_PUBLIC_API_URL}/leads/${editingLead.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/leads`;
      
      const method = editingLead ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        funnelId: formData.funnelId ? Number(formData.funnelId) : null,
        stageId: formData.stageId ? Number(formData.stageId) : null,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });

      if (res.ok) {
        toast.success(editingLead ? "Lead atualizado!" : "Lead criado!");
        setIsDialogOpen(false);
        setEditingLead(null);
        setFormData({ name: "", email: "", phone: "", source: "", status: "new", value: 0, funnelId: "", stageId: "", customFields: {} });
        fetchLeads();
      } else {
        toast.error("Erro ao salvar lead");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro na requisição");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este lead?")) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        toast.success("Lead excluído");
        fetchLeads();
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao excluir");
    }
  };

  const filteredLeads = leads
    .filter((lead) => {
      const matchesSearch =
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.phone || "").includes(searchTerm);
      const matchesStatus =
        selectedStatus === "Todos" || (lead.status === selectedStatus || (selectedStatus === 'Novo' && lead.status === 'new'));
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "name-asc") {
        return a.name.localeCompare(b.name);
      } else if (sortBy === "name-desc") {
        return b.name.localeCompare(a.name);
      } else if (sortBy === "date-asc") {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateA - dateB;
      } else { // date-desc
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      }
    }) as Lead[];

  const statuses = [
    "Todos",
    "Novo",
    "Contato",
    "Qualificado",
    "Proposta",
    "Negociação",
    "Fechado",
  ];

  const activeFunnel = funnels.find(f => f.id.toString() === formData.funnelId);

  // ==========================================
  // EXPORT PROCESS
  // ==========================================
  const handleExport = () => {
    const leadsToExport = exportRange === "all" ? leads : filteredLeads;

    if (leadsToExport.length === 0) {
      toast.error("Não há leads para exportar no intervalo selecionado.");
      return;
    }

    // Prepare data by flattening custom fields into columns
    const preparedData = leadsToExport.map((lead) => {
      const base: Record<string, any> = {
        "ID": lead.id,
        "Nome": lead.name,
        "Email": lead.email || "",
        "Telefone": lead.phone || "",
        "Origem": lead.source || "",
        "Status": lead.status === 'new' ? 'Novo' : lead.status,
        "Valor Estimado (R$)": Number(lead.value) || 0,
        "Data de Criação": lead.createdAt ? new Date(lead.createdAt).toLocaleDateString("pt-BR") : "",
      };

      // Find funnel name
      if (lead.funnelId) {
        const f = funnels.find(fun => fun.id === lead.funnelId);
        base["Funil"] = f?.name || "";
        const s = f?.stages.find(stg => stg.id === lead.stageId);
        base["Etapa Funil"] = s?.name || "";
      } else {
        base["Funil"] = "";
        base["Etapa Funil"] = "";
      }

      // Add Custom Fields flattened
      if (lead.customFields) {
        Object.entries(lead.customFields).forEach(([key, value]) => {
          base[key] = value;
        });
      }

      return base;
    });

    if (exportFormat === "json") {
      const blob = new Blob([JSON.stringify(preparedData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `leads_export_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("JSON exportado com sucesso!");
    } else {
      // Excel Export using xlsx library
      const worksheet = XLSX.utils.json_to_sheet(preparedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");
      XLSX.writeFile(workbook, `leads_export_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success("Excel (.xlsx) exportado com sucesso!");
    }

    setIsExportDialogOpen(false);
  };

  // ==========================================
  // IMPORT PROCESS
  // ==========================================
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);

    const reader = new FileReader();
    const ext = file.name.split('.').pop()?.toLowerCase();

    reader.onload = (evt) => {
      try {
        const rawResult = evt.target?.result;
        let jsonData: any[] = [];

        if (ext === "json") {
          jsonData = JSON.parse(rawResult as string);
        } else if (ext === "xlsx" || ext === "xls") {
          const workbook = XLSX.read(rawResult, { type: "binary" });
          const firstSheet = workbook.SheetNames[0];
          const sheet = workbook.Sheets[firstSheet];
          jsonData = XLSX.utils.sheet_to_json(sheet);
        } else {
          toast.error("Formato de arquivo não suportado. Use Excel ou JSON.");
          return;
        }

        if (!Array.isArray(jsonData) || jsonData.length === 0) {
          toast.error("Arquivo vazio ou estrutura de lista inválida.");
          return;
        }

        setParsedImportData(jsonData);
        
        // Grab all unique keys from the parsed rows to offer as mapping targets
        const uniqueKeysSet = new Set<string>();
        jsonData.forEach(row => {
          Object.keys(row).forEach(key => uniqueKeysSet.add(key));
        });
        const columns = Array.from(uniqueKeysSet);
        setDetectedColumns(columns);

        // Intelligently guess standard fields mappings
        const findMatch = (options: string[], fields: string[]) => {
          return options.find(opt => 
            fields.some(field => opt.toLowerCase().includes(field.toLowerCase()))
          ) || "";
        };

        setCoreMappings({
          name: findMatch(columns, ["nome", "name", "cliente", "lead"]),
          email: findMatch(columns, ["email", "e-mail", "mail", "contato"]),
          phone: findMatch(columns, ["telefone", "celular", "phone", "whatsapp", "whats"]),
          source: findMatch(columns, ["origem", "source", "canal"]),
          value: findMatch(columns, ["valor", "value", "estimado", "pipeline", "preço"]),
          funnelId: "",
          stageId: "",
        });

        // Initialize empty mappings for custom fields
        const initialCustomMappings: Record<string, string> = {};
        customFields.forEach(cf => {
          initialCustomMappings[cf.name] = findMatch(columns, [cf.name]);
        });
        setCustomMappings(initialCustomMappings);

        // Move to Step 2
        setImportStep(2);
        toast.info(`${jsonData.length} leads detectados no arquivo! Mapeie os campos.`);
      } catch (err: any) {
        console.error(evt, err);
        toast.error("Erro ao ler o arquivo: " + err.message);
      }
    };

    if (ext === "json") {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  };

  // Inline Custom Field Creator
  const handleCreateCustomFieldOnTheFly = async () => {
    if (!newCustomField.name) {
      toast.error("Nome do campo é obrigatório");
      return;
    }

    try {
      const payload = {
        name: newCustomField.name,
        type: newCustomField.type,
        entityType: "LEAD",
        placeholder: newCustomField.placeholder,
        isRequired: false,
        options: newCustomField.type === "SELECT" 
          ? newCustomField.optionsInput.split(",").map(opt => opt.trim()).filter(Boolean)
          : null
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/custom-fields`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include"
      });

      if (res.ok) {
        const createdField = await res.json();
        toast.success(`Campo customizado "${newCustomField.name}" criado com sucesso!`);
        
        // Add to active customFields state
        setCustomFields(prev => [...prev, createdField]);
        
        // Auto-map this new custom field to whatever column matches or is free
        setCustomMappings(prev => ({
          ...prev,
          [createdField.name]: ""
        }));

        // Reset creator popup state
        setNewCustomField({ name: "", type: "TEXT", placeholder: "", optionsInput: "" });
        setIsCreatingCustomField(false);
      } else {
        toast.error("Falha ao criar campo customizado.");
      }
    } catch (err) {
      toast.error("Erro de conexão");
    }
  };

  // Import Trigger
  const handleConfirmImport = async () => {
    if (!coreMappings.name) {
      toast.error("É obrigatório mapear a coluna do Nome Completo do Lead!");
      return;
    }

    try {
      setImportLoading(true);

      // Build lead payload arrays based on frontend column mapping
      const leadsPayload = parsedImportData.map(row => {
        const leadVal = row[coreMappings.value];
        const numericVal = leadVal ? Number(String(leadVal).replace(/[^0-9.-]/g, "")) : 0;

        // Custom Fields values payload
        const cfPayload: Record<string, any> = {};
        Object.entries(customMappings).forEach(([cfName, fileCol]) => {
          if (fileCol) {
            cfPayload[cfName] = row[fileCol] ?? null;
          }
        });

        return {
          name: String(row[coreMappings.name] || "").trim(),
          email: coreMappings.email ? String(row[coreMappings.email] || "").trim() : null,
          phone: coreMappings.phone ? String(row[coreMappings.phone] || "").replace(/[^0-9+]/g, "") : null,
          source: coreMappings.source ? String(row[coreMappings.source] || "") : "manual_import",
          value: isNaN(numericVal) ? 0 : numericVal,
          status: "new",
          funnelId: coreMappings.funnelId ? Number(coreMappings.funnelId) : null,
          stageId: coreMappings.stageId ? Number(coreMappings.stageId) : null,
          customFields: cfPayload
        };
      }).filter(l => l.name); // Filter out rows that failed to resolve names

      if (leadsPayload.length === 0) {
        toast.error("Nenhum lead com nome válido foi encontrado para importação.");
        setImportLoading(false);
        return;
      }

      // Hit Backend Bulk Endpoint
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads: leadsPayload }),
        credentials: "include"
      });

      if (res.ok) {
        const result = await res.json();
        toast.success(`${result.count} leads importados com sucesso!`);
        setIsImportDialogOpen(false);
        
        // Reset states
        setImportFile(null);
        setParsedImportData([]);
        setDetectedColumns([]);
        setImportStep(1);
        
        fetchLeads();
      } else {
        const err = await res.json();
        toast.error(err.error || "Erro ao efetuar importação.");
      }
    } catch (err) {
      toast.error("Erro na conexão");
    } finally {
      setImportLoading(false);
    }
  };

  const importFunnelObj = funnels.find(f => f.id.toString() === coreMappings.funnelId);

  if (loading) return <div className="p-8">Carregando...</div>;

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl text-foreground mb-2">Leads</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Gerencie todos os seus leads em um só lugar
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Import Button */}
          <Button
            variant="outline"
            className="flex-1 sm:flex-initial rounded-xl hover:bg-slate-50 border-slate-200"
            onClick={() => {
              setImportStep(1);
              setImportFile(null);
              setIsImportDialogOpen(true);
            }}
          >
            <Upload size={16} className="mr-2" />
            Importar
          </Button>

          {/* Export Button */}
          <Button
            variant="outline"
            className="flex-1 sm:flex-initial rounded-xl hover:bg-slate-50 border-slate-200"
            onClick={() => setIsExportDialogOpen(true)}
          >
            <Download size={16} className="mr-2" />
            Exportar
          </Button>

          {/* New Lead Button */}
          <Button
            className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto rounded-xl shadow-sm"
            onClick={() => {
              setEditingLead(null);
              setFormData({ name: "", email: "", phone: "", source: "", status: "new", value: 0, funnelId: "", stageId: "", customFields: {} });
              if(funnels.length > 0) {
                  setFormData(prev => ({ ...prev, funnelId: funnels[0].id.toString() }));
              }
              setIsDialogOpen(true);
            }}
          >
            <Plus size={18} className="mr-2" />
            Novo Lead
          </Button>
        </div>
      </div>

      {/* Filtros e Pesquisa */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                size={18}
              />
              <Input
                placeholder="Buscar por nome, email ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="w-full lg:w-[220px]">
              <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Ordenar por..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">Mais Recentes</SelectItem>
                  <SelectItem value="date-asc">Mais Antigas</SelectItem>
                  <SelectItem value="name-asc">Nome (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Nome (Z-A)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2 lg:mx-0 lg:px-0">
              {statuses.map((status) => (
                <Button
                  key={status}
                  variant={selectedStatus === status ? "default" : "outline"}
                  onClick={() => setSelectedStatus(status)}
                  className={cn(
                    "whitespace-nowrap transition-colors",
                    selectedStatus === status
                      ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl text-foreground mb-1">
              {leads.length}
            </div>
            <div className="text-sm text-muted-foreground">Total de Leads</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl text-primary mb-1">
              {leads.filter((l: Lead) => l.status === "closed").length}
            </div>
            <div className="text-sm text-muted-foreground">Leads Convertidos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl text-primary/80 mb-1">
              {leads.filter((l: Lead) => l.status === "new").length}
            </div>
            <div className="text-sm text-muted-foreground">Leads Novos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl text-primary font-bold mb-1">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                leads.reduce((sum, l) => sum + (Number(l.value) || 0), 0)
              )}
            </div>
            <div className="text-sm text-muted-foreground">Pipeline</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Leads */}
      <Card>
        <CardHeader>
          <CardTitle>Todos os Leads</CardTitle>
          <CardDescription>
            Mostrando {filteredLeads.length} de {leads.length} leads
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="min-w-[200px]">Nome</TableHead>
                  <TableHead className="min-w-[150px]">Contato</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead className="min-w-[140px]">Status / Etapa</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Contatado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => {
                   const funnel = funnels.find(f => f.id === lead.funnelId);
                   const stage = funnel?.stages.find(s => s.id === lead.stageId);
                   
                   return (
                  <TableRow key={lead.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-bold">
                          {lead.name.charAt(0)}
                        </div>
                        <div className="max-w-[150px] sm:max-w-none">
                          <div className="text-foreground font-medium truncate">{lead.name}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {lead.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs sm:text-sm text-muted-foreground">{lead.phone}</div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="border-primary/20 text-primary whitespace-nowrap bg-primary/5"
                      >
                        {lead.source}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {stage ? (
                          <div className="flex flex-col gap-1">
                              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{funnel?.name}</span>
                              <Badge className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30 w-fit text-xs">
                                  {stage.name}
                              </Badge>
                          </div>
                      ) : ( 
                          <Badge className={`bg-muted-foreground hover:bg-muted-foreground/90 text-white text-xs`}>
                          {lead.status === 'new' ? 'Novo' : lead.status}
                          </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-foreground font-semibold text-xs sm:text-sm whitespace-nowrap">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(lead.value) || 0)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString("pt-BR") : "Agora"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-3 sm:py-2 text-primary hover:bg-primary/10"
                          onClick={() => router.push(`/leads/${lead.id}`)}
                        >
                           Ver
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-3 sm:py-2"
                          onClick={() => {
                            setEditingLead(lead);
                            setFormData({
                              name: lead.name,
                              email: lead.email || "",
                              phone: lead.phone || "",
                              source: lead.source || "",
                              status: lead.status,
                              value: Number(lead.value) || 0,
                               funnelId: lead.funnelId?.toString() || "",
                               stageId: lead.stageId?.toString() || "",
                               customFields: lead.customFields || {}
                             });
                             setIsDialogOpen(true);
                           }}
                        >
                           Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-3 sm:py-2 hover:bg-destructive/10"
                          onClick={() => handleDelete(lead.id)}
                        >
                           Excluir
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )})}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ==========================================
          EXPORT DIALOG
          ========================================== */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-800">
              <Download className="w-5 h-5 text-primary" />
              Exportar Leads do Sistema
            </DialogTitle>
            <DialogDescription>
              Selecione o intervalo de dados e o formato desejado para download.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">1. Escolher Intervalo de Leads</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={exportRange === "filtered" ? "default" : "outline"}
                  onClick={() => setExportRange("filtered")}
                  className="rounded-xl font-semibold"
                >
                  Filtrados ({filteredLeads.length})
                </Button>
                <Button
                  variant={exportRange === "all" ? "default" : "outline"}
                  onClick={() => setExportRange("all")}
                  className="rounded-xl font-semibold"
                >
                  Todos ({leads.length})
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">2. Formato do Arquivo</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={exportFormat === "xlsx" ? "default" : "outline"}
                  onClick={() => setExportFormat("xlsx")}
                  className="rounded-xl font-semibold flex items-center justify-center gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Excel (.xlsx)
                </Button>
                <Button
                  variant={exportFormat === "json" ? "default" : "outline"}
                  onClick={() => setExportFormat("json")}
                  className="rounded-xl font-semibold flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  JSON (.json)
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExportDialogOpen(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button onClick={handleExport} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-6">
              Download do Arquivo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==========================================
          IMPORT DIALOG
          ========================================== */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className={cn("rounded-2xl transition-all", importStep === 2 ? "sm:max-w-[700px] max-h-[85vh] overflow-y-auto" : "sm:max-w-[450px]")}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-800">
              <Upload className="w-5 h-5 text-primary" />
              Importar Leads
            </DialogTitle>
            <DialogDescription>
              {importStep === 1 
                ? "Envie seu arquivo JSON ou planilha Excel para alimentar o CRM." 
                : "Mapeie as colunas do seu arquivo para os campos correspondentes do sistema."}
            </DialogDescription>
          </DialogHeader>

          {/* STEP 1: Uploading the file */}
          {importStep === 1 && (
            <div className="py-6 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-all p-4 cursor-pointer relative">
              <input
                type="file"
                accept=".xlsx, .xls, .json"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className="w-10 h-10 text-slate-400 mb-3" />
              <p className="text-sm font-semibold text-slate-700 text-center">Clique ou arraste um arquivo para fazer upload</p>
              <p className="text-xs text-slate-400 mt-2 text-center">Excel (.xlsx, .xls) ou JSON (.json) de até 10MB</p>
            </div>
          )}

          {/* STEP 2: Mapping columns */}
          {importStep === 2 && (
            <div className="space-y-6 py-4">
              
              {/* Target pipeline placement selection */}
              <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-800">Funil de Entrada (Opcional)</Label>
                  <Select 
                    value={coreMappings.funnelId || "_none"} 
                    onValueChange={v => setCoreMappings({...coreMappings, funnelId: v === "_none" ? "" : v, stageId: ""})}
                  >
                    <SelectTrigger className="bg-white rounded-xl"><SelectValue placeholder="Escolha o Funil..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">Nenhum</SelectItem>
                      {funnels.map(f => (
                        <SelectItem key={f.id} value={f.id.toString()}>{f.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-800">Etapa de Destino</Label>
                  <Select 
                    value={coreMappings.stageId} 
                    onValueChange={v => setCoreMappings({...coreMappings, stageId: v})} 
                    disabled={!coreMappings.funnelId}
                  >
                    <SelectTrigger className="bg-white rounded-xl"><SelectValue placeholder="Escolha a Etapa..." /></SelectTrigger>
                    <SelectContent>
                      {importFunnelObj?.stages.map(s => (
                        <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Column Mapping Form */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider">Campos do Lead (Básicos)</h4>
                
                <div className="grid grid-cols-2 gap-4 items-center">
                  <Label className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                    Nome Completo <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={coreMappings.name} 
                    onValueChange={v => setCoreMappings({...coreMappings, name: v})}
                  >
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecionar coluna..." /></SelectTrigger>
                    <SelectContent>
                      {detectedColumns.map(col => (
                        <SelectItem key={col} value={col}>{col}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4 items-center">
                  <Label className="text-sm font-semibold text-slate-700">E-mail</Label>
                  <Select 
                    value={coreMappings.email} 
                    onValueChange={v => setCoreMappings({...coreMappings, email: v})}
                  >
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecionar coluna..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_unmapped">Não mapear</SelectItem>
                      {detectedColumns.map(col => (
                        <SelectItem key={col} value={col}>{col}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4 items-center">
                  <Label className="text-sm font-semibold text-slate-700">Telefone</Label>
                  <Select 
                    value={coreMappings.phone} 
                    onValueChange={v => setCoreMappings({...coreMappings, phone: v})}
                  >
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecionar coluna..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_unmapped">Não mapear</SelectItem>
                      {detectedColumns.map(col => (
                        <SelectItem key={col} value={col}>{col}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4 items-center">
                  <Label className="text-sm font-semibold text-slate-700">Origem (Ex: WhatsApp, Meta...)</Label>
                  <Select 
                    value={coreMappings.source} 
                    onValueChange={v => setCoreMappings({...coreMappings, source: v})}
                  >
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecionar coluna..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_unmapped">Não mapear</SelectItem>
                      {detectedColumns.map(col => (
                        <SelectItem key={col} value={col}>{col}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4 items-center">
                  <Label className="text-sm font-semibold text-slate-700">Valor Estimado</Label>
                  <Select 
                    value={coreMappings.value} 
                    onValueChange={v => setCoreMappings({...coreMappings, value: v})}
                  >
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecionar coluna..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_unmapped">Não mapear</SelectItem>
                      {detectedColumns.map(col => (
                        <SelectItem key={col} value={col}>{col}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Custom fields Mapping Section */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Campos Adicionais (Customizados)</h4>
                  
                  {/* Toggle inline Custom Field Creator */}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs font-semibold text-primary hover:bg-slate-50 flex items-center gap-1 rounded-lg"
                    onClick={() => setIsCreatingCustomField(!isCreatingCustomField)}
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Criar Novo Campo
                  </Button>
                </div>

                {/* Inline Creator Popup Form */}
                {isCreatingCustomField && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-3">
                    <p className="text-xs font-bold text-slate-800">Criar Novo Campo no CRM</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase">Nome do Campo</Label>
                        <Input 
                          placeholder="Ex: CPF ou Idade" 
                          value={newCustomField.name}
                          onChange={e => setNewCustomField({...newCustomField, name: e.target.value})}
                          className="bg-white text-xs h-9 rounded-lg"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase">Tipo do Dado</Label>
                        <Select 
                          value={newCustomField.type} 
                          onValueChange={v => setNewCustomField({...newCustomField, type: v as CustomField["type"]})}
                        >
                          <SelectTrigger className="bg-white text-xs h-9 rounded-lg"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="TEXT">Texto Livre</SelectItem>
                            <SelectItem value="NUMBER">Número</SelectItem>
                            <SelectItem value="BOOLEAN">Sim / Não</SelectItem>
                            <SelectItem value="DATE">Data</SelectItem>
                            <SelectItem value="SELECT">Lista de Opções (Select)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {newCustomField.type === "SELECT" && (
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase">Opções (Separadas por vírgula)</Label>
                        <Input 
                          placeholder="Opção A, Opção B, Opção C" 
                          value={newCustomField.optionsInput}
                          onChange={e => setNewCustomField({...newCustomField, optionsInput: e.target.value})}
                          className="bg-white text-xs h-9 rounded-lg"
                        />
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setIsCreatingCustomField(false)}
                        className="text-xs rounded-lg"
                      >
                        Cancelar
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={handleCreateCustomFieldOnTheFly}
                        className="text-xs rounded-lg bg-primary hover:bg-primary/95 text-white"
                      >
                        Confirmar e Criar
                      </Button>
                    </div>
                  </div>
                )}

                {/* Listing Mappings for Custom Fields */}
                {customFields.length === 0 ? (
                  <p className="text-xs text-slate-400 font-medium">Nenhum campo customizado ativo no momento.</p>
                ) : (
                  <div className="space-y-3">
                    {customFields.map(cf => (
                      <div key={cf.id} className="grid grid-cols-2 gap-4 items-center">
                        <Label className="text-sm font-semibold text-slate-700">{cf.name} ({cf.type})</Label>
                        <Select 
                          value={customMappings[cf.name] || ""} 
                          onValueChange={v => setCustomMappings({...customMappings, [cf.name]: v})}
                        >
                          <SelectTrigger className="rounded-xl"><SelectValue placeholder="Não mapear" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="_unmapped">Não mapear</SelectItem>
                            {detectedColumns.map(col => (
                              <SelectItem key={col} value={col}>{col}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="pt-4 border-t mt-4">
            {importStep === 2 && (
              <Button 
                variant="outline" 
                onClick={() => setImportStep(1)} 
                className="rounded-xl mr-auto"
                disabled={importLoading}
              >
                Voltar
              </Button>
            )}
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)} className="rounded-xl">
              Cancelar
            </Button>
            {importStep === 2 && (
              <Button 
                onClick={handleConfirmImport} 
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl flex items-center justify-center gap-2 px-6"
                disabled={importLoading}
              >
                {importLoading ? "Efetuando Importação..." : `Confirmar e Importar ${parsedImportData.length} Leads`}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para Novo Lead / Edição */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingLead ? "Editar Lead" : "Adicionar Novo Lead"}</DialogTitle>
            <DialogDescription>
              Preencha as informações do lead
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                placeholder="João Silva"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="joao@email.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                placeholder="(11) 98765-4321"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Funil</Label>
                    <Select 
                      value={formData.funnelId || "_none"} 
                      onValueChange={v => setFormData({...formData, funnelId: v === "_none" ? "" : v, stageId: ""})}
                    >
                        <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="_none">Nenhum</SelectItem>
                            {funnels.map(f => (
                                <SelectItem key={f.id} value={f.id.toString()}>{f.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Etapa</Label>
                    <Select value={formData.stageId} onValueChange={v => setFormData({...formData, stageId: v})} disabled={!formData.funnelId}>
                        <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>
                            {activeFunnel?.stages.map(s => (
                                <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="source">Origem</Label>
              <Select
                value={formData.source || ""}
                onValueChange={(value) =>
                  setFormData({ ...formData, source: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a origem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Facebook Ads">Facebook Ads</SelectItem>
                  <SelectItem value="Instagram">Instagram</SelectItem>
                  <SelectItem value="Google Ads">Google Ads</SelectItem>
                  <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                  <SelectItem value="Orgânico">Orgânico</SelectItem>
                  <SelectItem value="Indicação">Indicação</SelectItem>
                </SelectContent>
              </Select>
            </div>
           
            <div className="space-y-2">
              <Label htmlFor="value">Valor Estimado (R$)</Label>
              <Input
                id="value"
                type="number"
                placeholder="2500"
                value={formData.value}
                onChange={(e) =>
                  setFormData({ ...formData, value: Number(e.target.value) })
                }
              />
            </div>

            {/* Custom Fields */}
            {customFields.length > 0 && (
              <div className="pt-4 border-t space-y-4">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Informações Adicionais</p>
                <div className="grid grid-cols-1 gap-4">
                  {customFields.map(field => (
                    <div key={field.id} className="space-y-2">
                      <Label className="flex items-center gap-1">
                        {field.name}
                        {field.isRequired && <span className="text-red-500">*</span>}
                      </Label>
                      {field.type === "SELECT" ? (
                        <Select 
                          value={formData.customFields?.[field.name] || ""} 
                          onValueChange={val => setFormData(prev => ({ 
                            ...prev, 
                            customFields: { ...prev.customFields, [field.name]: val } 
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={field.placeholder || "Selecione..."} />
                          </SelectTrigger>
                          <SelectContent>
                            {field.options?.map((opt: string) => (
                              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : field.type === "BOOLEAN" ? (
                        <div className="flex items-center space-x-2 h-10">
                          <Switch 
                            checked={!!formData.customFields?.[field.name]}
                            onCheckedChange={val => setFormData(prev => ({ 
                              ...prev, 
                              customFields: { ...prev.customFields, [field.name]: val } 
                            }))}
                          />
                          <span className="text-sm text-muted-foreground">{formData.customFields?.[field.name] ? "Sim" : "Não"}</span>
                        </div>
                      ) : (
                        <Input 
                          type={field.type === "NUMBER" ? "number" : field.type === "DATE" ? "date" : "text"}
                          placeholder={field.placeholder || ""}
                          value={formData.customFields?.[field.name] || ""}
                          onChange={e => setFormData(prev => ({ 
                            ...prev, 
                            customFields: { ...prev.customFields, [field.name]: e.target.value } 
                          }))}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateOrUpdate}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {editingLead ? "Salvar Alterações" : "Criar Lead"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
