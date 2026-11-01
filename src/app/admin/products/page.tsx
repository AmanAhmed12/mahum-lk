"use client";

import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageSpinner } from "@/components/ui/spinner";
import { apiFetch, apiJson } from "@/lib/api/client";
import { formatCurrency } from "@/lib/utils";

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  price: string;
  isActive: boolean;
  images: { url: string }[];
  inventory: { quantity: number } | null;
  category: { name: string };
}

export default function AdminProductsPage() {
  const [products, setProducts] = React.useState<ProductRow[] | null>(null);

  const load = React.useCallback(() => {
    apiJson<{ products: ProductRow[] }>("/api/products?includeInactive=true&pageSize=48")
      .then((data) => setProducts(data.products))
      .catch(() => toast.error("Could not load products."));
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(product: ProductRow) {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    const response = await apiFetch(`/api/products/${product.id}`, { method: "DELETE" });
    if (response.ok) {
      toast.success("Product deleted.");
      load();
    } else {
      toast.error("Could not delete product.");
    }
  }

  if (products === null) return <PageSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Products</h1>
        <Link href="/admin/products/new">
          <Button size="sm">
            <Plus className="h-4 w-4" /> New Product
          </Button>
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border-muted">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-muted text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border-muted">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-surface-muted">
                <td className="flex items-center gap-3 px-4 py-3">
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-surface-muted">
                    {product.images[0] ? (
                      <Image src={product.images[0].url} alt={product.name} fill className="object-cover" />
                    ) : null}
                  </div>
                  {product.name}
                </td>
                <td className="px-4 py-3">{product.category.name}</td>
                <td className="px-4 py-3">{formatCurrency(product.price)}</td>
                <td className="px-4 py-3">{product.inventory?.quantity ?? 0}</td>
                <td className="px-4 py-3">
                  <Badge variant={product.isActive ? "success" : "neutral"}>
                    {product.isActive ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="rounded-md p-1.5 text-neutral-500 hover:bg-white"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(product)}
                      className="rounded-md p-1.5 text-neutral-500 hover:bg-white"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 ? (
          <p className="p-10 text-center text-sm text-neutral-500">No products yet.</p>
        ) : null}
      </div>
    </div>
  );
}
