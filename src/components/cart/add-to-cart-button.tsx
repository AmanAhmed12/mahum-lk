"use client";

import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";

import { Button, type ButtonProps } from "@/components/ui/button";
import { useCartStore } from "@/store/cartStore";

interface AddToCartButtonProps extends Omit<ButtonProps, "onClick"> {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    image: string | null;
    stock: number;
  };
  quantity?: number;
}

export function AddToCartButton({ product, quantity = 1, children, ...props }: AddToCartButtonProps) {
  const addItem = useCartStore((s) => s.addItem);

  function handleClick() {
    if (product.stock <= 0) {
      toast.error("This product is out of stock.");
      return;
    }
    addItem(
      {
        productId: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        image: product.image,
        maxQuantity: product.stock,
      },
      quantity,
    );
    toast.success(`${product.name} added to cart.`);
  }

  return (
    <Button onClick={handleClick} disabled={product.stock <= 0} {...props}>
      {children ?? (
        <>
          <ShoppingCart className="h-4 w-4" /> Add to Cart
        </>
      )}
    </Button>
  );
}
