import Image from "next/image";
import Link from "next/link";

export interface CategoryCardData {
  name: string;
  slug: string;
  imageUrl: string | null;
  _count?: { products: number };
}

export function CategoryCard({ category }: { category: CategoryCardData }) {
  return (
    <Link
      href={`/category/${category.slug}`}
      className="group block overflow-hidden rounded-xl border border-border-muted bg-white text-center transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[4/3] bg-surface-muted">
        {category.imageUrl ? (
          <Image
            src={category.imageUrl}
            alt={category.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(min-width: 1024px) 20vw, 40vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-neutral-400">
            {category.name}
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-sm font-medium text-foreground">{category.name}</p>
        {category._count ? (
          <p className="text-xs text-neutral-500">{category._count.products} items</p>
        ) : null}
      </div>
    </Link>
  );
}
