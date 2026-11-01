import { notFound } from "next/navigation";

import { ProductCard } from "@/components/product/product-card";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;

  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) notFound();

  const products = await prisma.product.findMany({
    where: { categoryId: category.id, isActive: true },
    include: { images: true, inventory: true, reviews: { select: { rating: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="container-page py-10">
      <h1 className="text-2xl font-bold text-foreground">{category.name}</h1>
      <p className="mt-1 text-sm text-neutral-600">{products.length} products</p>

      {products.length > 0 ? (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-dashed border-border-muted p-16 text-center text-sm text-neutral-500">
          No products in this category yet.
        </div>
      )}
    </div>
  );
}
