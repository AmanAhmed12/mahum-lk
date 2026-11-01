"use client";

import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageSpinner } from "@/components/ui/spinner";
import { apiFetch, apiJson } from "@/lib/api/client";

interface ProductRow {
  id: string;
  name: string;
  sku: string;
  inventory: { quantity: number; reorderLevel: number } | null;
}

export default function AdminInventoryPage() {
  const [products, setProducts] = React.useState<ProductRow[] | null>(null);
  const [edits, setEdits] = React.useState<Record<string, { quantity: number; reorderLevel: number }>>({});
  const [savingId, setSavingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    apiJson<{ products: ProductRow[] }>("/api/products?includeInactive=true&pageSize=48")
      .then((data) => {
        setProducts(data.products);
        setEdits(
          Object.fromEntries(
            data.products.map((p) => [
              p.id,
              { quantity: p.inventory?.quantity ?? 0, reorderLevel: p.inventory?.reorderLevel ?? 5 },
            ]),
          ),
        );
      })
      .catch(() => toast.error("Could not load inventory."));
  }, []);

  async function handleSave(productId: string) {
    setSavingId(productId);
    try {
      const response = await apiFetch(`/api/inventory/${productId}`, {
        method: "PATCH",
        body: JSON.stringify(edits[productId]),
      });
      if (!response.ok) throw new Error("Could not update inventory.");
      toast.success("Inventory updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update inventory.");
    } finally {
      setSavingId(null);
    }
  }

  if (products === null) return <PageSpinner />;

  return (
    <div>
      <h1 className="text-xl font-bold text-foreground">Inventory</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Update stock levels and reorder thresholds for each product.
      </p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border-muted">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-muted text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Quantity</th>
              <th className="px-4 py-3">Reorder Level</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border-muted">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-4 py-3">{product.name}</td>
                <td className="px-4 py-3 text-neutral-500">{product.sku}</td>
                <td className="px-4 py-3">
                  <Input
                    type="number"
                    className="w-24"
                    value={edits[product.id]?.quantity ?? 0}
                    onChange={(e) =>
                      setEdits((prev) => ({
                        ...prev,
                        [product.id]: { ...prev[product.id], quantity: Number(e.target.value) || 0 },
                      }))
                    }
                  />
                </td>
                <td className="px-4 py-3">
                  <Input
                    type="number"
                    className="w-24"
                    value={edits[product.id]?.reorderLevel ?? 5}
                    onChange={(e) =>
                      setEdits((prev) => ({
                        ...prev,
                        [product.id]: { ...prev[product.id], reorderLevel: Number(e.target.value) || 0 },
                      }))
                    }
                  />
                </td>
                <td className="px-4 py-3">
                  <Button size="sm" isLoading={savingId === product.id} onClick={() => handleSave(product.id)}>
                    Save
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
