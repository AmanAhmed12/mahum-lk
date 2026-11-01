"use client";

import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { redirectToPayHereCheckout } from "@/lib/payhere-client";

export function PayNowButton({ orderId }: { orderId: string }) {
  const [isRedirecting, setIsRedirecting] = React.useState(false);

  async function handleClick() {
    setIsRedirecting(true);
    try {
      await redirectToPayHereCheckout(orderId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not start payment.");
      setIsRedirecting(false);
    }
  }

  return (
    <Button size="sm" onClick={handleClick} isLoading={isRedirecting}>
      Pay Now
    </Button>
  );
}
