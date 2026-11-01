"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { PageSpinner } from "@/components/ui/spinner";
import { apiJson } from "@/lib/api/client";

interface ProviderRecord {
  id: string;
  specialization: string | null;
  experienceYears: number | null;
  user: { name: string; email: string; phone: string | null };
  _count: { orders: number };
}

export default function AdminProvidersPage() {
  const [providers, setProviders] = React.useState<ProviderRecord[] | null>(null);
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "SERVICE_PROVIDER",
    specialization: "",
    experienceYears: "",
  });
  const [isSaving, setIsSaving] = React.useState(false);

  const load = React.useCallback(() => {
    apiJson<{ providers: ProviderRecord[] }>("/api/admin/providers")
      .then((data) => setProviders(data.providers))
      .catch(() => toast.error("Could not load service providers."));
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    try {
      await apiJson("/api/admin/providers", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          experienceYears: form.experienceYears ? Number(form.experienceYears) : undefined,
        }),
      });
      toast.success("Staff account created.");
      setOpen(false);
      setForm({ name: "", email: "", phone: "", password: "", role: "SERVICE_PROVIDER", specialization: "", experienceYears: "" });
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create account.");
    } finally {
      setIsSaving(false);
    }
  }

  if (providers === null) return <PageSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Staff &amp; Service Providers</h1>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> New Staff Account
        </Button>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border-muted">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-muted text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Specialization</th>
              <th className="px-4 py-3">Experience</th>
              <th className="px-4 py-3">Assigned Orders</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-muted">
            {providers.map((provider) => (
              <tr key={provider.id} className="hover:bg-surface-muted">
                <td className="px-4 py-3">{provider.user.name}</td>
                <td className="px-4 py-3">{provider.user.email}</td>
                <td className="px-4 py-3">{provider.specialization ?? "—"}</td>
                <td className="px-4 py-3">{provider.experienceYears ?? "—"} yrs</td>
                <td className="px-4 py-3">{provider._count.orders}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {providers.length === 0 ? (
          <p className="p-10 text-center text-sm text-neutral-500">No service providers yet.</p>
        ) : null}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="New Staff Account">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <Label htmlFor="staffRole">Role</Label>
            <Select
              id="staffRole"
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            >
              <option value="SERVICE_PROVIDER">Service Provider</option>
              <option value="ADMIN">Administrator</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="staffName">Name</Label>
            <Input id="staffName" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <Label htmlFor="staffEmail">Email</Label>
            <Input
              id="staffEmail"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="staffPhone">Phone</Label>
            <Input id="staffPhone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          </div>
          <div>
            <Label htmlFor="staffPassword">Temporary Password</Label>
            <Input
              id="staffPassword"
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            />
          </div>
          {form.role === "SERVICE_PROVIDER" ? (
            <>
              <div>
                <Label htmlFor="specialization">Specialization</Label>
                <Input
                  id="specialization"
                  placeholder="e.g. Men's formal wear"
                  value={form.specialization}
                  onChange={(e) => setForm((f) => ({ ...f, specialization: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="experienceYears">Years of Experience</Label>
                <Input
                  id="experienceYears"
                  type="number"
                  value={form.experienceYears}
                  onChange={(e) => setForm((f) => ({ ...f, experienceYears: e.target.value }))}
                />
              </div>
            </>
          ) : null}
          <Button type="submit" className="w-full" isLoading={isSaving}>
            Create Account
          </Button>
        </form>
      </Modal>
    </div>
  );
}
