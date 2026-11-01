"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const totalPrice = useCartStore((s) => s.totalPrice());

  if (items.length === 0) {
    return (
      <div className="container-page flex flex-col items-center justify-center py-20 text-center">
        <ShoppingBag className="h-12 w-12 text-neutral-300" />
        <h1 className="mt-4 text-xl font-semibold text-foreground">Your cart is empty</h1>
        <p className="mt-2 text-sm text-neutral-500">Browse the shop and add some products.</p>
        <Link href="/shop" className="mt-6">
          <Button>Continue Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <h1 className="text-2xl font-bold text-foreground">Your Cart</h1>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.productId}
              className="flex items-center gap-4 rounded-xl border border-border-muted p-4"
            >
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-surface-muted">
                {item.image ? (
                  <Image src={item.image} alt={item.name} fill className="object-cover" />
                ) : null}
              </div>
              <div className="flex-1">
                <Link href={`/shop/${item.slug}`} className="text-sm font-medium text-foreground hover:text-brand-700">
                  {item.name}
                </Link>
                <p className="mt-1 text-sm text-brand-700">{formatCurrency(item.price)}</p>
              </div>
              <div className="flex items-center rounded-md border border-border-muted">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity(item.productId, item.quantity - 1)}
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center text-sm">{item.quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity(item.productId, item.quantity + 1)}
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <button
                onClick={() => removeItem(item.productId)}
                aria-label="Remove item"
                className="p-2 text-neutral-400 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="h-fit rounded-xl border border-border-muted p-5">
          <h2 className="font-semibold text-foreground">Order Summary</h2>
          <div className="mt-4 flex justify-between text-sm text-neutral-600">
            <span>Subtotal</span>
            <span>{formatCurrency(totalPrice)}</span>
          </div>
          <p className="mt-1 text-xs text-neutral-400">Delivery fee calculated at checkout.</p>
          <Link href="/checkout" className="mt-4 block">
            <Button className="w-full">Proceed to Checkout</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
