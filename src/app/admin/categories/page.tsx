"use client";

import Image from "next/image";
import * as React from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ImageUploader, type UploadedImage } from "@/components/forms/image-uploader";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { PageSpinner } from "@/components/ui/spinner";
import { apiFetch, apiJson } from "@/lib/api/client";
import { slugify } from "@/lib/utils";

interface CategoryRecord {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  publicId: string | null;
  _count: { products: number };
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = React.useState<CategoryRecord[] | null>(null);
  const [editing, setEditing] = React.useState<CategoryRecord | "new" | null>(null);
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [images, setImages] = React.useState<UploadedImage[]>([]);
  const [isSaving, setIsSaving] = React.useState(false);

  const load = React.useCallback(() => {
    apiJson<{ categories: CategoryRecord[] }>("/api/categories")
      .then((data) => setCategories(data.categories))
      .catch(() => toast.error("Could not load categories."));
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setName("");
    setSlug("");
    setImages([]);
    setEditing("new");
  }

  function openEdit(category: CategoryRecord) {
    setName(category.name);
    setSlug(category.slug);
    setImages(category.imageUrl && category.publicId ? [{ url: category.imageUrl, publicId: category.publicId }] : []);
    setEditing(category);
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        name,
        slug: slug || slugify(name),
        imageUrl: images[0]?.url ?? null,
        publicId: images[0]?.publicId ?? null,
      };
      if (editing === "new") {
        await apiJson("/api/categories", { method: "POST", body: JSON.stringify(payload) });
        toast.success("Category created.");
      } else if (editing) {
        await apiJson(`/api/categories/${editing.id}`, { method: "PATCH", body: JSON.stringify(payload) });
        toast.success("Category updated.");
      }
      setEditing(null);
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save category.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(category: CategoryRecord) {
    if (!confirm(`Delete category "${category.name}"?`)) return;
    const response = await apiFetch(`/api/categories/${category.id}`, { method: "DELETE" });
    if (response.ok) {
      toast.success("Category deleted.");
      load();
    } else {
      const data = await response.json().catch(() => null);
      toast.error(data?.error ?? "Could not delete category.");
    }
  }

  if (categories === null) return <PageSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Categories</h1>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4" /> New Category
        </Button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <div key={category.id} className="rounded-xl border border-border-muted p-4">
            <div className="flex items-center gap-3">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-surface-muted">
                {category.imageUrl ? (
                  <Image src={category.imageUrl} alt={category.name} fill className="object-cover" />
                ) : null}
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{category.name}</p>
                <p className="text-xs text-neutral-500">{category._count.products} products</p>
              </div>
              <button onClick={() => openEdit(category)} className="rounded-md p-1.5 text-neutral-500 hover:bg-surface-muted">
                <Pencil className="h-4 w-4" />
              </button>
              <button onClick={() => handleDelete(category)} className="rounded-md p-1.5 text-neutral-500 hover:bg-surface-muted">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "New Category" : "Edit Category"}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (editing === "new") setSlug(slugify(e.target.value));
              }}
            />
          </div>
          <div>
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" required value={slug} onChange={(e) => setSlug(slugify(e.target.value))} />
          </div>
          <div>
            <Label>Image</Label>
            <ImageUploader folder="mahum/categories" value={images} onChange={setImages} />
          </div>
          <Button type="submit" className="w-full" isLoading={isSaving}>
            Save Category
          </Button>
        </form>
      </Modal>
    </div>
  );
}
