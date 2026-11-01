import { redirect } from "next/navigation";

import { ProductForm } from "@/components/forms/product-form";
import { getCurrentUser } from "@/lib/auth/session";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/");

  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <h1 className="text-xl font-bold text-foreground">New Product</h1>
      {categories.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-500">
          Create a category first before adding products.
        </p>
      ) : (
        <div className="mt-6">
          <ProductForm categories={categories} />
        </div>
      )}
    </div>
  );
}
