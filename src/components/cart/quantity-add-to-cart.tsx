"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";

import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { Button } from "@/components/ui/button";

export function QuantityAddToCart({
  product,
}: {
  product: { id: string; name: string; slug: string; price: number; image: string | null; stock: number };
}) {
  const [quantity, setQuantity] = React.useState(1);

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center rounded-md border border-border-muted">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          aria-label="Decrease quantity"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="w-10 text-center text-sm font-medium">{quantity}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setQuantity((q) => Math.min(product.stock || 1, q + 1))}
          aria-label="Increase quantity"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <AddToCartButton product={product} quantity={quantity} className="flex-1" />
    </div>
  );
}
