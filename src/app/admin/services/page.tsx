"use client";

import * as React from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { PageSpinner } from "@/components/ui/spinner";
import { apiFetch, apiJson } from "@/lib/api/client";
import { formatCurrency } from "@/lib/utils";

interface ServiceRecord {
  id: string;
  name: string;
  description: string;
  basePrice: string;
  isActive: boolean;
}

export default function AdminServicesPage() {
  const [services, setServices] = React.useState<ServiceRecord[] | null>(null);
  const [editing, setEditing] = React.useState<ServiceRecord | "new" | null>(null);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [basePrice, setBasePrice] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);

  const load = React.useCallback(() => {
    apiJson<{ services: ServiceRecord[] }>("/api/services?includeInactive=true")
      .then((data) => setServices(data.services))
      .catch(() => toast.error("Could not load services."));
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setName("");
    setDescription("");
    setBasePrice("");
    setEditing("new");
  }

  function openEdit(service: ServiceRecord) {
    setName(service.name);
    setDescription(service.description);
    setBasePrice(service.basePrice);
    setEditing(service);
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    try {
      const payload = { name, description, basePrice: Number(basePrice), isActive: true };
      if (editing === "new") {
        await apiJson("/api/services", { method: "POST", body: JSON.stringify(payload) });
        toast.success("Service created.");
      } else if (editing) {
        await apiJson(`/api/services/${editing.id}`, { method: "PATCH", body: JSON.stringify(payload) });
        toast.success("Service updated.");
      }
      setEditing(null);
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save service.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleActive(service: ServiceRecord) {
    try {
      await apiJson(`/api/services/${service.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !service.isActive }),
      });
      load();
    } catch {
      toast.error("Could not update service.");
    }
  }

  async function handleDelete(service: ServiceRecord) {
    if (!confirm(`Deactivate "${service.name}"?`)) return;
    const response = await apiFetch(`/api/services/${service.id}`, { method: "DELETE" });
    if (response.ok) {
      toast.success("Service deactivated.");
      load();
    } else {
      toast.error("Could not deactivate service.");
    }
  }

  if (services === null) return <PageSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Tailoring Services</h1>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4" /> New Service
        </Button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {services.map((service) => (
          <div key={service.id} className="rounded-xl border border-border-muted p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-foreground">{service.name}</p>
                <p className="mt-1 text-sm text-neutral-600">{service.description}</p>
                <p className="mt-2 text-sm font-semibold text-brand-700">{formatCurrency(service.basePrice)}</p>
              </div>
              <Badge
                variant={service.isActive ? "success" : "neutral"}
                className="cursor-pointer"
                onClick={() => handleToggleActive(service)}
              >
                {service.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div className="mt-3 flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => openEdit(service)}>
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
              <Button variant="danger" size="sm" onClick={() => handleDelete(service)}>
                <Trash2 className="h-3.5 w-3.5" /> Deactivate
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "New Service" : "Edit Service"}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" required value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="basePrice">Base Price (LKR)</Label>
            <Input
              id="basePrice"
              type="number"
              step="0.01"
              required
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" isLoading={isSaving}>
            Save Service
          </Button>
        </form>
      </Modal>
    </div>
  );
}
