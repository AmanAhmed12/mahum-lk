import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

type DecimalLike = number | string | { toString(): string };

export interface ProductCardData {
  id: string;
  name: string;
  slug: string;
  price: DecimalLike;
  discountPrice: DecimalLike | null;
  images: { url: string }[];
  inventory: { quantity: number } | null;
  reviews: { rating: number }[];
}

export function ProductCard({ product }: { product: ProductCardData }) {
  const price = Number(product.price);
  const discountPrice = product.discountPrice ? Number(product.discountPrice) : null;
  const hasDiscount = discountPrice != null && discountPrice < price;
  const discountPct = hasDiscount ? Math.round(((price - discountPrice!) / price) * 100) : 0;
  const image = product.images[0]?.url;
  const avgRating = product.reviews.length
    ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
    : 0;
  const outOfStock = !product.inventory || product.inventory.quantity <= 0;

  return (
    <Link
      href={`/shop/${product.slug}`}
      className="group block overflow-hidden rounded-xl border border-border-muted bg-white transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-square bg-surface-muted">
        {image ? (
          <Image
            src={image}
            alt={product.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(min-width: 1024px) 25vw, 50vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-neutral-400">
            No image
          </div>
        )}
        {hasDiscount ? (
          <Badge variant="danger" className="absolute left-2 top-2">
            -{discountPct}%
          </Badge>
        ) : null}
        {outOfStock ? (
          <Badge variant="neutral" className="absolute right-2 top-2">
            Out of stock
          </Badge>
        ) : null}
      </div>
      <div className="p-3">
        <p className="line-clamp-2 min-h-10 text-sm font-medium text-foreground">{product.name}</p>
        <div className="mt-1 flex items-center gap-1 text-amber-500">
          <Star className="h-3.5 w-3.5 fill-current" />
          <span className="text-xs text-neutral-500">
            {avgRating ? avgRating.toFixed(1) : "No reviews"}
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-sm font-semibold text-brand-700">
            {formatCurrency(hasDiscount ? discountPrice! : price)}
          </span>
          {hasDiscount ? (
            <span className="text-xs text-neutral-400 line-through">{formatCurrency(price)}</span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
