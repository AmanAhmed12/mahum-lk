import { applyPayHereResult, verifyPayHereNotify } from "@/lib/payhere";

export const dynamic = "force-dynamic";

/**
 * PayHere's server-to-server webhook (IPN). Called directly by PayHere's
 * servers — never by the browser — so there is no session cookie here.
 * The MD5 signature check below IS the authentication for this route.
 *
 * Must be reachable at a PUBLIC URL (not localhost) for PayHere to call it.
 * See src/app/api/payments/payhere/confirm/route.ts for the localhost-safe
 * active check that complements this.
 */
export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const get = (key: string) => String(form.get(key) ?? "");

    const payload = {
      merchant_id: get("merchant_id"),
      order_id: get("order_id"),
      payment_id: get("payment_id"),
      payhere_amount: get("payhere_amount"),
      payhere_currency: get("payhere_currency"),
      status_code: get("status_code"),
      md5sig: get("md5sig"),
    };

    if (!payload.order_id || !payload.md5sig) {
      return new Response("Missing fields", { status: 400 });
    }

    if (!verifyPayHereNotify(payload)) {
      console.error("PayHere notify: signature verification failed", payload);
      return new Response("Invalid signature", { status: 400 });
    }

    const result = await applyPayHereResult({
      orderId: payload.order_id,
      paymentId: payload.payment_id,
      amount: payload.payhere_amount,
      statusCode: payload.status_code,
    });

    if (!result.ok) {
      const statusCode = result.reason === "unknown_order" ? 404 : 400;
      return new Response(result.reason, { status: statusCode });
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("PayHere notify error:", error);
    return new Response("Error", { status: 500 });
  }
}
