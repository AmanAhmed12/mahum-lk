import Link from "next/link";
import { ArrowRight, Ruler, ShieldCheck, Truck } from "lucide-react";

import { CategoryCard } from "@/components/product/category-card";
import { ProductCard } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getHomeData() {
  const [categories, newArrivals, services] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" },
      take: 8,
      include: { _count: { select: { products: true } } },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { images: true, inventory: true, reviews: { select: { rating: true } } },
    }),
    prisma.service.findMany({ where: { isActive: true }, take: 3, orderBy: { name: "asc" } }),
  ]);
  return { categories, newArrivals, services };
}

export default async function HomePage() {
  const { categories, newArrivals, services } = await getHomeData();

  return (
    <div>
      <section className="bg-brand-50">
        <div className="container-page grid gap-8 py-14 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">
              Tailoring &amp; Fashion Accessories
            </p>
            <h1 className="mt-3 text-3xl font-bold leading-tight text-foreground sm:text-4xl lg:text-5xl">
              We bring the best craft &amp; accessories, at the best price.
            </h1>
            <p className="mt-4 max-w-md text-neutral-600">
              Shop sewing supplies, fancy accessories and upscale goods, or request a custom
              tailoring order with your own measurements — all tracked online.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/shop">
                <Button size="lg">
                  Shop Now <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/services/request">
                <Button size="lg" variant="outline">
                  Request Tailoring
                </Button>
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <Truck className="mx-auto h-6 w-6 text-brand-600" />
              <p className="mt-2 text-xs font-medium text-neutral-600">Island-wide delivery</p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <Ruler className="mx-auto h-6 w-6 text-brand-600" />
              <p className="mt-2 text-xs font-medium text-neutral-600">Custom measurements</p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <ShieldCheck className="mx-auto h-6 w-6 text-brand-600" />
              <p className="mt-2 text-xs font-medium text-neutral-600">Secure online ordering</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Shop by Category</h2>
          <Link href="/shop" className="text-sm font-medium text-brand-700 hover:underline">
            View all
          </Link>
        </div>
        {categories.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        ) : (
          <EmptyState text="Categories will appear here once an admin adds them." />
        )}
      </section>

      <section className="container-page py-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">New Arrivals</h2>
          <Link href="/shop" className="text-sm font-medium text-brand-700 hover:underline">
            View all
          </Link>
        </div>
        {newArrivals.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <EmptyState text="Products will appear here once an admin adds them." />
        )}
      </section>

      <section className="bg-surface-muted py-12">
        <div className="container-page">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Tailoring Services</h2>
            <Link href="/services" className="text-sm font-medium text-brand-700 hover:underline">
              View all
            </Link>
          </div>
          {services.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-3">
              {services.map((service) => (
                <div key={service.id} className="rounded-xl border border-border-muted bg-white p-5">
                  <h3 className="font-semibold text-foreground">{service.name}</h3>
                  <p className="mt-1 line-clamp-3 text-sm text-neutral-600">{service.description}</p>
                  <p className="mt-3 text-sm font-semibold text-brand-700">
                    From LKR {Number(service.basePrice).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState text="Tailoring services will appear here once an admin adds them." />
          )}
        </div>
      </section>

      <section className="container-page py-12">
        <h2 className="mb-6 text-xl font-semibold text-foreground">What Our Customers Say</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              name: "Nadia P.",
              quote: "The tailoring order tracking made everything so transparent. Loved it!",
            },
            {
              name: "Ishan K.",
              quote: "Great accessory selection and fast island-wide delivery.",
            },
            {
              name: "Fathima R.",
              quote: "Customer service team was responsive about my custom measurements.",
            },
          ].map((review) => (
            <div key={review.name} className="rounded-xl border border-border-muted bg-white p-5">
              <p className="text-sm text-neutral-600">&ldquo;{review.quote}&rdquo;</p>
              <p className="mt-3 text-sm font-semibold text-foreground">{review.name}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border-muted p-10 text-center text-sm text-neutral-500">
      {text}
    </div>
  );
}
