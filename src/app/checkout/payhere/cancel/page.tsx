"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

function PayHereCancelContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");

  return (
    <>
      <XCircle className="h-12 w-12 text-red-500" />
      <h1 className="mt-4 text-xl font-bold text-foreground">Payment cancelled</h1>
      <p className="mt-2 max-w-md text-sm text-neutral-600">
        You cancelled the payment on PayHere, so no money was taken. Your order was saved and is
        waiting for payment — you can try paying again from your order page.
      </p>
      <div className="mt-6 flex gap-3">
        {orderId ? (
          <Link href={`/account/orders/${orderId}`}>
            <Button variant="secondary">View Order</Button>
          </Link>
        ) : null}
        <Link href="/shop">
          <Button>Continue Shopping</Button>
        </Link>
      </div>
    </>
  );
}

export default function PayHereCancelPage() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center text-center">
      <Suspense>
        <PayHereCancelContent />
      </Suspense>
    </div>
  );
}
