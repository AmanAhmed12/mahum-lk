"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import * as React from "react";
import { CheckCircle2, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { apiFetch, apiJson } from "@/lib/api/client";

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 6; // ~12 seconds total

interface OrderPaymentStatus {
  order: { id: string; payment: { status: string } | null };
}

function PayHereReturnContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const [status, setStatus] = React.useState<"checking" | "paid" | "pending">("checking");

  React.useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    let attempts = 0;

    async function poll() {
      try {
        // Actively ask PayHere for the latest status (works even on
        // localhost, since this is an outbound call) — this is a no-op if
        // PAYHERE_APP_ID/SECRET aren't configured. `trustReturn: true` only
        // takes effect if PAYHERE_TRUST_RETURN_REDIRECT="true" is set on the
        // server (dev/academic-only shortcut — see lib/payhere.ts).
        await apiFetch("/api/payments/payhere/confirm", {
          method: "POST",
          body: JSON.stringify({ orderId, trustReturn: true }),
        });

        const data = await apiJson<OrderPaymentStatus>(`/api/orders/${orderId}`);
        if (cancelled) return;
        if (data.order.payment?.status === "PAID") {
          setStatus("paid");
          return;
        }
      } catch {
        // keep polling — the order should exist, this is likely a transient blip
      }
      if (cancelled) return;
      attempts += 1;
      if (attempts >= MAX_POLL_ATTEMPTS) {
        setStatus("pending");
      } else {
        setTimeout(poll, POLL_INTERVAL_MS);
      }
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (!orderId) {
    return <p className="text-sm text-neutral-500">Missing order reference.</p>;
  }

  if (status === "checking") {
    return (
      <>
        <Spinner className="h-10 w-10" />
        <h1 className="mt-4 text-xl font-bold text-foreground">Confirming your payment...</h1>
        <p className="mt-2 max-w-md text-sm text-neutral-600">
          PayHere is notifying us of your payment result. This usually takes a few seconds.
        </p>
      </>
    );
  }

  if (status === "paid") {
    return (
      <>
        <CheckCircle2 className="h-12 w-12 text-green-600" />
        <h1 className="mt-4 text-xl font-bold text-foreground">Payment successful!</h1>
        <p className="mt-2 max-w-md text-sm text-neutral-600">
          Thank you — your payment has been confirmed and your order is on its way to being processed.
        </p>
        <Link href={`/account/orders/${orderId}`} className="mt-6">
          <Button>View Order</Button>
        </Link>
      </>
    );
  }

  return (
    <>
      <Clock className="h-12 w-12 text-amber-500" />
      <h1 className="mt-4 text-xl font-bold text-foreground">Payment is still being confirmed</h1>
      <p className="mt-2 max-w-md text-sm text-neutral-600">
        We haven&apos;t received final confirmation from PayHere yet. This can take a little longer —
        check your order page in a minute, or contact us if the payment status doesn&apos;t update.
      </p>
      <Link href={`/account/orders/${orderId}`} className="mt-6">
        <Button variant="secondary">View Order</Button>
      </Link>
    </>
  );
}

export default function PayHereReturnPage() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center text-center">
      <Suspense>
        <PayHereReturnContent />
      </Suspense>
    </div>
  );
}
