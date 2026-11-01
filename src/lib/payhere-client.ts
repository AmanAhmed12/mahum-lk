"use client";

import { apiJson } from "@/lib/api/client";

/**
 * Builds a hidden HTML form with the given fields and submits it, navigating
 * the browser to PayHere's hosted checkout page. PayHere's Checkout API only
 * accepts a standard form POST (no JS SDK / redirect-by-fetch option), so
 * this is the standard integration pattern.
 */
export function submitToPayHere(checkoutUrl: string, fields: Record<string, string>) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = checkoutUrl;
  form.style.display = "none";

  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
}

/**
 * Fetches PayHere checkout fields for an already-created order (one whose
 * Payment.method is "CARD" and still PENDING) and redirects the browser to
 * PayHere's hosted checkout page to complete payment.
 */
export async function redirectToPayHereCheckout(orderId: string): Promise<void> {
  const data = await apiJson<{ checkoutUrl: string; fields: Record<string, string> }>(
    "/api/payments/payhere/initiate",
    { method: "POST", body: JSON.stringify({ orderId }) },
  );
  submitToPayHere(data.checkoutUrl, data.fields);
}
