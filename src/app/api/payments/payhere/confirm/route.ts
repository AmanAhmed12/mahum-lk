import { NextResponse } from "next/server";
import { z } from "zod";

import { ForbiddenError, handleApiError, NotFoundError } from "@/lib/api/errors";
import { requireRole } from "@/lib/auth/rbac";
import { applyPayHereResult, isTrustReturnRedirectEnabled, retrievePayHerePaymentStatus } from "@/lib/payhere";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  orderId: z.string().min(1),
  // Only ever sent by /checkout/payhere/return — see isTrustReturnRedirectEnabled().
  trustReturn: z.boolean().optional(),
});

/**
 * Actively asks PayHere "what happened to this payment?" instead of waiting
 * for the notify webhook — this is the direction that works from localhost,
 * since it's OUR server calling OUT to PayHere. Requires PAYHERE_APP_ID /
 * PAYHERE_APP_SECRET to be configured; if they aren't, this is a harmless
 * no-op and the app falls back to the webhook as usual.
 */
export async function POST(request: Request) {
  try {
    const user = await requireRole();
    const { orderId, trustReturn } = bodySchema.parse(await request.json());

    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { payment: true } });
    if (!order) throw new NotFoundError("Order not found.");

    const isOwner = user.role === "CUSTOMER" && order.customerId === user.customerProfileId;
    if (!isOwner && user.role !== "ADMIN") {
      throw new ForbiddenError("You cannot check this order's payment.");
    }

    if (!order.payment || order.payment.status === "PAID") {
      return NextResponse.json({ checked: true, status: order.payment?.status ?? null });
    }

    const retrieved = await retrievePayHerePaymentStatus(orderId);

    if (retrieved) {
      const result = await applyPayHereResult({
        orderId,
        paymentId: retrieved.paymentId,
        amount: retrieved.amount,
        statusCode: retrieved.statusCode,
      });
      return NextResponse.json({ checked: true, status: result.ok ? result.status : order.payment.status });
    }

    // OAuth not configured, or PayHere has no record yet. As a dev/academic
    // fallback ONLY (never on in production), trust that the browser being
    // redirected here at all means the sandbox payment succeeded.
    if (trustReturn && order.payment.method === "CARD" && isTrustReturnRedirectEnabled()) {
      const result = await applyPayHereResult({
        orderId,
        paymentId: `TRUSTED-RETURN-${Date.now()}`,
        amount: order.payment.amount.toString(),
        statusCode: "2", // PAID
      });
      return NextResponse.json({
        checked: true,
        status: result.ok ? result.status : order.payment.status,
        trusted: true,
      });
    }

    return NextResponse.json({ checked: false, status: order.payment.status });
  } catch (error) {
    return handleApiError(error);
  }
}
