import { notFound, redirect } from "next/navigation";

import { DeleteEntityButton } from "@/components/admin/delete-entity-button";
import { ProductForm, type ProductFormInitialValues } from "@/components/forms/product-form";
import { getCurrentUser } from "@/lib/auth/session";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/");

  const { id } = await params;

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id }, include: { images: true, inventory: true } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!product) notFound();

  const initialValues: ProductFormInitialValues = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    sku: product.sku,
    price: Number(product.price),
    discountPrice: product.discountPrice ? Number(product.discountPrice) : undefined,
    categoryId: product.categoryId,
    isActive: product.isActive,
    images: product.images.map((img) => ({ url: img.url, publicId: img.publicId })),
    quantity: product.inventory?.quantity ?? 0,
    reorderLevel: product.inventory?.reorderLevel ?? 5,
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Edit Product</h1>
        <DeleteEntityButton
          url={`/api/products/${product.id}`}
          confirmMessage={`Delete "${product.name}"? This cannot be undone.`}
          redirectTo="/admin/products"
        />
      </div>
      <div className="mt-6">
        <ProductForm categories={categories} initialValues={initialValues} />
      </div>
    </div>
  );
}
