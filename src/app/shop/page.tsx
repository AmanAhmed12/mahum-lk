import Link from "next/link";

import { ProductCard } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

interface ShopPageProps {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const where = {
    isActive: true,
    ...(params.category ? { category: { slug: params.category } } : {}),
    ...(params.q
      ? {
          OR: [
            { name: { contains: params.q, mode: "insensitive" as const } },
            { description: { contains: params.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [products, total, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { images: true, inventory: true, reviews: { select: { rating: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function pageHref(targetPage: number) {
    const sp = new URLSearchParams();
    if (params.q) sp.set("q", params.q);
    if (params.category) sp.set("category", params.category);
    if (targetPage > 1) sp.set("page", String(targetPage));
    const query = sp.toString();
    return `/shop${query ? `?${query}` : ""}`;
  }

  return (
    <div className="container-page py-10">
      <h1 className="text-2xl font-bold text-foreground">Shop</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Browse sewing supplies, fashion accessories and upscale goods.
      </p>

      <div className="mt-6 flex flex-col gap-6 lg:flex-row">
        <aside className="w-full shrink-0 lg:w-56">
          <form action="/shop" className="mb-6">
            <Input name="q" placeholder="Search products..." defaultValue={params.q} />
          </form>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
            Categories
          </p>
          <nav className="flex flex-col gap-1">
            <Link
              href="/shop"
              className={cn(
                "rounded-md px-3 py-2 text-sm",
                !params.category ? "bg-brand-50 text-brand-700" : "text-neutral-600 hover:bg-surface-muted",
              )}
            >
              All Categories
            </Link>
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/shop?category=${category.slug}`}
                className={cn(
                  "rounded-md px-3 py-2 text-sm",
                  params.category === category.slug
                    ? "bg-brand-50 text-brand-700"
                    : "text-neutral-600 hover:bg-surface-muted",
                )}
              >
                {category.name}
              </Link>
            ))}
          </nav>
        </aside>

        <div className="flex-1">
          {products.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              {totalPages > 1 ? (
                <div className="mt-8 flex items-center justify-center gap-2">
                  {page > 1 ? (
                    <Link href={pageHref(page - 1)}>
                      <Button variant="secondary" size="sm">
                        Previous
                      </Button>
                    </Link>
                  ) : (
                    <Button variant="secondary" size="sm" disabled>
                      Previous
                    </Button>
                  )}
                  <span className="text-sm text-neutral-600">
                    Page {page} of {totalPages}
                  </span>
                  {page < totalPages ? (
                    <Link href={pageHref(page + 1)}>
                      <Button variant="secondary" size="sm">
                        Next
                      </Button>
                    </Link>
                  ) : (
                    <Button variant="secondary" size="sm" disabled>
                      Next
                    </Button>
                  )}
                </div>
              ) : null}
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-border-muted p-16 text-center text-sm text-neutral-500">
              No products found. Try a different search or category.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
