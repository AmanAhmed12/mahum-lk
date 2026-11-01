"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { PageSpinner } from "@/components/ui/spinner";
import { apiJson } from "@/lib/api/client";
import { formatCurrency } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isInitialized } = useAuthStore((s) => ({ user: s.user, isInitialized: s.isInitialized }));
  const items = useCartStore((s) => s.items);
  const totalPrice = useCartStore((s) => s.totalPrice());
  const clearCart = useCartStore((s) => s.clear);

  const [address, setAddress] = React.useState("");
  const [city, setCity] = React.useState("");
  const [paymentMethod, setPaymentMethod] = React.useState("COD");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (isInitialized && !user) {
      router.replace("/login?from=/checkout");
    }
  }, [isInitialized, user, router]);

  if (!isInitialized || !user) return <PageSpinner />;

  if (items.length === 0) {
    return (
      <div className="container-page py-16 text-center text-sm text-neutral-500">
        Your cart is empty. <a className="text-brand-700 underline" href="/shop">Go shopping</a>.
      </div>
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const data = await apiJson<{ order: { id: string } }>("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          address,
          city,
          paymentMethod,
        }),
      });
      clearCart();
      toast.success("Order placed!");
      router.push(`/account/orders/${data.order.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not place order.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container-page py-10">
      <h1 className="text-2xl font-bold text-foreground">Checkout</h1>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border-muted p-5">
          <div>
            <Label htmlFor="address">Delivery Address</Label>
            <Textarea
              id="address"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="House No, Street, Area"
            />
          </div>
          <div>
            <Label htmlFor="city">City</Label>
            <Input id="city" required value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Select
              id="paymentMethod"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="COD">Cash on Delivery</option>
              <option value="CARD">Card Payment</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
            </Select>
          </div>
          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Place Order
          </Button>
        </form>

        <div className="h-fit rounded-xl border border-border-muted p-5">
          <h2 className="font-semibold text-foreground">Order Summary</h2>
          <ul className="mt-3 space-y-2 text-sm text-neutral-600">
            {items.map((item) => (
              <li key={item.productId} className="flex justify-between">
                <span>
                  {item.name} × {item.quantity}
                </span>
                <span>{formatCurrency(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between border-t border-border-muted pt-3 text-sm font-semibold text-foreground">
            <span>Total</span>
            <span>{formatCurrency(totalPrice)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
