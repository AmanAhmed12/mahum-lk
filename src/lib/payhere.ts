import "server-only";

import crypto from "crypto";

import prisma from "@/lib/prisma";

/**
 * PayHere (https://www.payhere.lk) Checkout API integration — free sandbox,
 * no SDK required (just an MD5-signed form POST + a server-to-server
 * webhook). Docs: https://support.payhere.lk/api-&-mobile-sdk/checkout-api
 */

export const PAYHERE_MODE = (process.env.PAYHERE_MODE || "sandbox").toLowerCase();

const PAYHERE_BASE_URL = PAYHERE_MODE === "live" ? "https://www.payhere.lk" : "https://sandbox.payhere.lk";

export const PAYHERE_CHECKOUT_URL = `${PAYHERE_BASE_URL}/pay/checkout`;

export const PAYHERE_CURRENCY = "LKR";

/**
 * DEV/ACADEMIC-ONLY SHORTCUT. When enabled, the return page is allowed to
 * mark a payment as PAID purely because the browser was redirected to
 * return_url — with NO verification against PayHere at all (no webhook, no
 * OAuth check). PayHere only sends the browser to return_url after a
 * successful payment (a cancelled/failed attempt goes to cancel_url
 * instead), so this is a reasonable assumption for a local demo — but it is
 * NOT secure: a signed-in customer could visit their own
 * /checkout/payhere/return?order_id=... URL directly and mark an unpaid
 * order "Paid" without ever paying. Never enable this for a real deployment
 * or with real money — use the notify webhook (works once you're on a
 * public URL) for anything that matters.
 */
export function isTrustReturnRedirectEnabled(): boolean {
  return process.env.PAYHERE_TRUST_RETURN_REDIRECT === "true";
}

function getCredentials() {
  const merchantId = process.env.PAYHERE_MERCHANT_ID;
  const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
  if (!merchantId || !merchantSecret) {
    throw new Error(
      "PAYHERE_MERCHANT_ID / PAYHERE_MERCHANT_SECRET are not set. Copy .env.example to .env and fill them in with your free PayHere sandbox credentials.",
    );
  }
  return { merchantId, merchantSecret };
}

function md5(value: string): string {
  return crypto.createHash("md5").update(value).digest("hex");
}

/** PayHere requires amounts formatted with exactly 2 decimals, "." separator, no thousands separator. */
export function formatPayHereAmount(amount: number): string {
  return amount.toFixed(2);
}

export interface PayHereCheckoutFields {
  merchant_id: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
  order_id: string;
  items: string;
  currency: string;
  amount: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  hash: string;
}

export interface BuildCheckoutInput {
  orderId: string;
  amount: number;
  items: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
}

/** Builds the full set of fields to POST to PAYHERE_CHECKOUT_URL, including the signature hash. */
export function buildPayHereCheckoutFields(input: BuildCheckoutInput): PayHereCheckoutFields {
  const { merchantId, merchantSecret } = getCredentials();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const amount = formatPayHereAmount(input.amount);
  const hashedSecret = md5(merchantSecret).toUpperCase();
  const hash = md5(`${merchantId}${input.orderId}${amount}${PAYHERE_CURRENCY}${hashedSecret}`).toUpperCase();

  return {
    merchant_id: merchantId,
    return_url: `${appUrl}/checkout/payhere/return?order_id=${input.orderId}`,
    cancel_url: `${appUrl}/checkout/payhere/cancel?order_id=${input.orderId}`,
    notify_url: `${appUrl}/api/payments/payhere/notify`,
    order_id: input.orderId,
    items: input.items.slice(0, 200),
    currency: PAYHERE_CURRENCY,
    amount,
    first_name: input.firstName || "Customer",
    last_name: input.lastName || "",
    email: input.email,
    phone: input.phone || "0000000000",
    address: input.address,
    city: input.city,
    country: "Sri Lanka",
    hash,
  };
}

export interface PayHereNotifyPayload {
  merchant_id: string;
  order_id: string;
  payment_id: string;
  payhere_amount: string;
  payhere_currency: string;
  status_code: string;
  md5sig: string;
  method?: string;
}

/** Verifies the md5sig PayHere sends to notify_url matches our own computed signature. */
export function verifyPayHereNotify(payload: PayHereNotifyPayload): boolean {
  const { merchantSecret } = getCredentials();
  const hashedSecret = md5(merchantSecret).toUpperCase();
  const localSig = md5(
    `${payload.merchant_id}${payload.order_id}${payload.payhere_amount}${payload.payhere_currency}${payload.status_code}${hashedSecret}`,
  ).toUpperCase();
  return localSig === payload.md5sig.toUpperCase();
}

/**
 * PayHere status_code meanings:
 *   2  = success (PAID)
 *   0  = pending
 *  -1  = canceled by user
 *  -2  = failed
 *  -3  = charged back
 */
export function mapPayHereStatusCode(statusCode: string): "PAID" | "PENDING" | "FAILED" | "REFUNDED" {
  switch (statusCode) {
    case "2":
      return "PAID";
    case "0":
      return "PENDING";
    case "-3":
      return "REFUNDED";
    default:
      return "FAILED";
  }
}

// ---------------------------------------------------------------------------
// Active status check ("Retrieve Payment" API) — OPTIONAL.
//
// notify_url above only works once your app is on a public URL, since it's
// PayHere calling INTO your server. This section is the opposite direction:
// OUR server calls OUT to PayHere to actively ask "what happened to this
// payment?", which works fine from localhost too. It requires a separate
// pair of credentials (an OAuth "App", not your Merchant ID/Secret) — see
// README for where to create one. If PAYHERE_APP_ID/PAYHERE_APP_SECRET are
// not set, these functions simply no-op and the app falls back to waiting
// for the webhook, so nothing breaks if you skip this.
// ---------------------------------------------------------------------------

interface CachedToken {
  token: string;
  expiresAt: number;
}

let cachedToken: CachedToken | null = null;

async function getPayHereAccessToken(): Promise<string | null> {
  const appId = process.env.PAYHERE_APP_ID;
  const appSecret = process.env.PAYHERE_APP_SECRET;
  if (!appId || !appSecret) return null;

  if (cachedToken && cachedToken.expiresAt > Date.now() + 5_000) {
    return cachedToken.token;
  }

  try {
    const basicAuth = Buffer.from(`${appId}:${appSecret}`).toString("base64");
    const response = await fetch(`${PAYHERE_BASE_URL}/merchant/v1/oauth/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      console.error("PayHere OAuth token request failed:", response.status, await response.text().catch(() => ""));
      return null;
    }

    const data = (await response.json()) as { access_token?: string; expires_in?: number };
    if (!data.access_token) return null;

    cachedToken = {
      token: data.access_token,
      expiresAt: Date.now() + (Number(data.expires_in) || 3600) * 1000,
    };
    return cachedToken.token;
  } catch (error) {
    console.error("PayHere OAuth token request error:", error);
    return null;
  }
}

export interface RetrievedPayHerePayment {
  orderId: string;
  paymentId: string;
  statusCode: string;
  amount: string;
  currency: string;
}

/**
 * Actively asks PayHere for the current status of an order's payment.
 * Returns null if OAuth isn't configured, PayHere hasn't recorded a
 * payment attempt for this order yet, or the request fails — callers should
 * treat null as "unknown, try again later" rather than an error.
 */
export async function retrievePayHerePaymentStatus(orderId: string): Promise<RetrievedPayHerePayment | null> {
  const token = await getPayHereAccessToken();
  if (!token) return null;

  try {
    const response = await fetch(
      `${PAYHERE_BASE_URL}/merchant/v1/payment/search?order_id=${encodeURIComponent(orderId)}`,
      { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10_000) },
    );

    if (!response.ok) {
      console.error("PayHere payment search failed:", response.status, await response.text().catch(() => ""));
      return null;
    }

    const data = (await response.json()) as Record<string, unknown>;
    const list = (Array.isArray(data.data) ? data.data : Array.isArray(data.payments) ? data.payments : []) as Array<
      Record<string, unknown>
    >;
    const entry = list[0];
    if (!entry) return null;

    return {
      orderId: String(entry.order_id ?? orderId),
      paymentId: String(entry.payment_id ?? ""),
      statusCode: String(entry.status_code ?? ""),
      amount: String(entry.payhere_amount ?? entry.amount ?? ""),
      currency: String(entry.payhere_currency ?? entry.currency ?? PAYHERE_CURRENCY),
    };
  } catch (error) {
    console.error("PayHere payment search error:", error);
    return null;
  }
}

export interface ApplyPayHereResultInput {
  orderId: string;
  paymentId: string;
  amount: string;
  statusCode: string;
}

export type ApplyPayHereResult =
  | { ok: true; status: "PAID" | "PENDING" | "FAILED" | "REFUNDED" }
  | { ok: false; reason: "unknown_order" | "amount_mismatch" };

/**
 * Shared by both the notify webhook and the active "confirm" check: applies
 * a PayHere payment result to our Payment/Order rows, with the same
 * amount-tamper guard either path takes.
 */
export async function applyPayHereResult(input: ApplyPayHereResultInput): Promise<ApplyPayHereResult> {
  const order = await prisma.order.findUnique({ where: { id: input.orderId }, include: { payment: true } });
  if (!order || !order.payment) return { ok: false, reason: "unknown_order" };

  const paidAmount = Number(input.amount.replace(/,/g, ""));
  const expectedAmount = Number(order.payment.amount);
  if (!Number.isFinite(paidAmount) || Math.abs(paidAmount - expectedAmount) > 0.01) {
    console.error("PayHere: amount mismatch", { orderId: order.id, paidAmount, expectedAmount });
    return { ok: false, reason: "amount_mismatch" };
  }

  const newStatus = mapPayHereStatusCode(input.statusCode);

  if (order.payment.status !== newStatus) {
    await prisma.payment.update({
      where: { orderId: order.id },
      data: { status: newStatus, transactionRef: input.paymentId || null },
    });
  }

  if (newStatus === "PAID" && order.status === "PENDING") {
    await prisma.order.update({ where: { id: order.id }, data: { status: "CONFIRMED" } });
  }

  return { ok: true, status: newStatus };
}
