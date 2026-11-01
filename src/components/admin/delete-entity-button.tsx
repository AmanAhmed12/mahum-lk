"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";

export function DeleteEntityButton({
  url,
  confirmMessage,
  redirectTo,
  label = "Delete",
}: {
  url: string;
  confirmMessage: string;
  redirectTo?: string;
  label?: string;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = React.useState(false);

  async function handleDelete() {
    if (!confirm(confirmMessage)) return;
    setIsDeleting(true);
    try {
      const response = await apiFetch(url, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Delete failed.");
      }
      toast.success("Deleted successfully.");
      if (redirectTo) {
        router.push(redirectTo);
      }
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Button type="button" variant="danger" size="sm" isLoading={isDeleting} onClick={handleDelete}>
      <Trash2 className="h-4 w-4" /> {label}
    </Button>
  );
}
