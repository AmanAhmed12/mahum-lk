"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { apiJson } from "@/lib/api/client";

interface ProviderOption {
  id: string;
  user: { name: string };
}

export function AssignProvider({
  orderId,
  providers,
  currentProviderId,
}: {
  orderId: string;
  providers: ProviderOption[];
  currentProviderId: string | null;
}) {
  const router = useRouter();
  const [providerId, setProviderId] = React.useState(currentProviderId ?? providers[0]?.id ?? "");
  const [isSaving, setIsSaving] = React.useState(false);

  async function handleAssign() {
    if (!providerId) return;
    setIsSaving(true);
    try {
      await apiJson(`/api/orders/${orderId}/assign`, {
        method: "POST",
        body: JSON.stringify({ providerId }),
      });
      toast.success("Provider assigned.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not assign provider.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assign Service Provider</CardTitle>
      </CardHeader>
      <CardContent className="flex gap-2">
        {providers.length > 0 ? (
          <>
            <Select value={providerId} onChange={(e) => setProviderId(e.target.value)}>
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.user.name}
                </option>
              ))}
            </Select>
            <Button size="sm" isLoading={isSaving} onClick={handleAssign}>
              Assign
            </Button>
          </>
        ) : (
          <p className="text-sm text-neutral-500">No service providers available yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
