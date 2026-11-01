import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Star } from "lucide-react";

import { QuantityAddToCart } from "@/components/cart/quantity-add-to-cart";
import { ReviewForm } from "@/components/product/review-form";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/auth/session";
import prisma from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  const [product, user] = await Promise.all([
    prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        images: true,
        inventory: true,
        reviews: {
          orderBy: { createdAt: "desc" },
          include: { customer: { include: { user: { select: { name: true } } } } },
        },
      },
    }),
    getCurrentUser(),
  ]);

  if (!product || !product.isActive) notFound();

  const price = Number(product.price);
  const discountPrice = product.discountPrice ? Number(product.discountPrice) : null;
  const hasDiscount = discountPrice != null && discountPrice < price;
  const stock = product.inventory?.quantity ?? 0;
  const avgRating = product.reviews.length
    ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
    : 0;

  return (
    <div className="container-page py-10">
      <nav className="mb-6 text-sm text-neutral-500">
        <Link href="/shop" className="hover:text-brand-700">
          Shop
        </Link>
        {" / "}
        <Link href={`/category/${product.category.slug}`} className="hover:text-brand-700">
          {product.category.name}
        </Link>
        {" / "}
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-xl bg-surface-muted">
          {product.images[0] ? (
            <Image
              src={product.images[0].url}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 40vw, 100vw"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-neutral-400">
              No image
            </div>
          )}
        </div>

        <div>
          <h1 className="text-2xl font-bold text-foreground">{product.name}</h1>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex items-center gap-1 text-amber-500">
              <Star className="h-4 w-4 fill-current" />
              <span className="text-sm text-neutral-600">
                {avgRating ? avgRating.toFixed(1) : "No reviews yet"} ({product.reviews.length})
              </span>
            </div>
            {stock > 0 ? (
              <Badge variant="success">In stock ({stock})</Badge>
            ) : (
              <Badge variant="danger">Out of stock</Badge>
            )}
          </div>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-2xl font-bold text-brand-700">
              {formatCurrency(hasDiscount ? discountPrice! : price)}
            </span>
            {hasDiscount ? (
              <span className="text-base text-neutral-400 line-through">{formatCurrency(price)}</span>
            ) : null}
          </div>

          <p className="mt-4 whitespace-pre-line text-sm text-neutral-600">{product.description}</p>
          <p className="mt-2 text-xs text-neutral-400">SKU: {product.sku}</p>

          <div className="mt-6">
            <QuantityAddToCart
              product={{
                id: product.id,
                name: product.name,
                slug: product.slug,
                price: hasDiscount ? discountPrice! : price,
                image: product.images[0]?.url ?? null,
                stock,
              }}
            />
          </div>
        </div>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Customer Reviews</h2>
          {product.reviews.length > 0 ? (
            <div className="mt-4 space-y-4">
              {product.reviews.map((review) => (
                <div key={review.id} className="rounded-xl border border-border-muted p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">
                      {review.customer.user.name}
                    </p>
                    <span className="text-xs text-neutral-400">{formatDate(review.createdAt)}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 ${i < review.rating ? "fill-current" : "text-neutral-300"}`}
                      />
                    ))}
                  </div>
                  {review.comment ? (
                    <p className="mt-2 text-sm text-neutral-600">{review.comment}</p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-neutral-500">No reviews yet. Be the first to review!</p>
          )}
        </div>

        {user?.role === "CUSTOMER" ? <ReviewForm productId={product.id} /> : null}
      </div>
    </div>
  );
}
