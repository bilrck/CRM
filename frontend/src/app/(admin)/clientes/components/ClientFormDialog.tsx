"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface ClientFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ClientFormDialog({ isOpen, onClose, onSuccess }: ClientFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basico");
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    document: "",
    // Address
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: "",
    country: "Brasil",
    // Social
    instagram: "",
    facebook: "",
    linkedin: "",
    website: "",
    // Business
    segment: "",
    totalRevenue: "",
    lifetimeValue: "",
    status: "ACTIVE",
    observations: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error("Nome é obrigatório");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success("Cliente cadastrado com sucesso!");
        onSuccess();
        onClose();
        // Reset form
        setFormData({
          name: "",
          email: "",
          phone: "",
          company: "",
          document: "",
          street: "",
          number: "",
          complement: "",
          neighborhood: "",
          city: "",
          state: "",
          zipCode: "",
          country: "Brasil",
          instagram: "",
          facebook: "",
          linkedin: "",
          website: "",
          segment: "",
          totalRevenue: "",
          lifetimeValue: "",
          status: "ACTIVE",
          observations: "",
        });
      } else {
        const error = await res.json();
        toast.error(error.error || "Erro ao cadastrar cliente");
      }
    } catch (error) {
      console.error("Error creating client:", error);
      toast.error("Erro ao cadastrar cliente");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: "basico", label: "Básico" },
    { id: "endereco", label: "Endereço" },
    { id: "social", label: "Social" },
    { id: "negocio", label: "Negócio" },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">Novo Cliente</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? "border-emerald-600 text-emerald-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-4">
            {/* Básico Tab */}
            {activeTab === "basico" && (
              <>
                <div>
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="Nome completo"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company">Empresa</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => handleChange("company", e.target.value)}
                      placeholder="Nome da empresa"
                    />
                  </div>
                  <div>
                    <Label htmlFor="document">CPF/CNPJ</Label>
                    <Input
                      id="document"
                      value={formData.document}
                      onChange={(e) => handleChange("document", e.target.value)}
                      placeholder="000.000.000-00"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Endereço Tab */}
            {activeTab === "endereco" && (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="street">Rua</Label>
                    <Input
                      id="street"
                      value={formData.street}
                      onChange={(e) => handleChange("street", e.target.value)}
                      placeholder="Nome da rua"
                    />
                  </div>
                  <div>
                    <Label htmlFor="number">Número</Label>
                    <Input
                      id="number"
                      value={formData.number}
                      onChange={(e) => handleChange("number", e.target.value)}
                      placeholder="123"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="complement">Complemento</Label>
                    <Input
                      id="complement"
                      value={formData.complement}
                      onChange={(e) => handleChange("complement", e.target.value)}
                      placeholder="Apto, Sala, etc"
                    />
                  </div>
                  <div>
                    <Label htmlFor="neighborhood">Bairro</Label>
                    <Input
                      id="neighborhood"
                      value={formData.neighborhood}
                      onChange={(e) => handleChange("neighborhood", e.target.value)}
                      placeholder="Nome do bairro"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleChange("city", e.target.value)}
                      placeholder="Cidade"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">Estado</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => handleChange("state", e.target.value)}
                      placeholder="UF"
                      maxLength={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="zipCode">CEP</Label>
                    <Input
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={(e) => handleChange("zipCode", e.target.value)}
                      placeholder="00000-000"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Social Tab */}
            {activeTab === "social" && (
              <>
                <div>
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    value={formData.instagram}
                    onChange={(e) => handleChange("instagram", e.target.value)}
                    placeholder="@usuario"
                  />
                </div>
                <div>
                  <Label htmlFor="facebook">Facebook</Label>
                  <Input
                    id="facebook"
                    value={formData.facebook}
                    onChange={(e) => handleChange("facebook", e.target.value)}
                    placeholder="facebook.com/usuario"
                  />
                </div>
                <div>
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <Input
                    id="linkedin"
                    value={formData.linkedin}
                    onChange={(e) => handleChange("linkedin", e.target.value)}
                    placeholder="linkedin.com/in/usuario"
                  />
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => handleChange("website", e.target.value)}
                    placeholder="https://exemplo.com"
                  />
                </div>
              </>
            )}

            {/* Negócio Tab */}
            {activeTab === "negocio" && (
              <>
                <div>
                  <Label htmlFor="segment">Segmento</Label>
                  <Input
                    id="segment"
                    value={formData.segment}
                    onChange={(e) => handleChange("segment", e.target.value)}
                    placeholder="Ex: Tecnologia, Varejo, Serviços"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="totalRevenue">Receita Total (R$)</Label>
                    <Input
                      id="totalRevenue"
                      type="number"
                      step="0.01"
                      value={formData.totalRevenue}
                      onChange={(e) => handleChange("totalRevenue", e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lifetimeValue">LTV (R$)</Label>
                    <Input
                      id="lifetimeValue"
                      type="number"
                      step="0.01"
                      value={formData.lifetimeValue}
                      onChange={(e) => handleChange("lifetimeValue", e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleChange("status", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Ativo</SelectItem>
                      <SelectItem value="INACTIVE">Inativo</SelectItem>
                      <SelectItem value="CHURNED">Churned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="observations">Observações</Label>
                  <Textarea
                    id="observations"
                    value={formData.observations}
                    onChange={(e) => handleChange("observations", e.target.value)}
                    placeholder="Notas e observações sobre o cliente..."
                    rows={4}
                  />
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 p-6 border-t bg-gray-50">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar Cliente"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
