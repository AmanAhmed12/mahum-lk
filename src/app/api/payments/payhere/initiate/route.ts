import { NextResponse } from "next/server";
import { z } from "zod";

import { BadRequestError, ForbiddenError, handleApiError, NotFoundError } from "@/lib/api/errors";
import { requireRole } from "@/lib/auth/rbac";
import { buildPayHereCheckoutFields, PAYHERE_CHECKOUT_URL } from "@/lib/payhere";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ orderId: z.string().min(1) });

export async function POST(request: Request) {
  try {
    const user = await requireRole(["CUSTOMER"]);
    if (!user.customerProfileId) throw new ForbiddenError("No customer profile found.");

    const { orderId } = bodySchema.parse(await request.json());

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payment: true,
        delivery: true,
        customer: { include: { user: true } },
        items: { include: { product: true, service: true } },
      },
    });

    if (!order) throw new NotFoundError("Order not found.");
    if (order.customerId !== user.customerProfileId) {
      throw new ForbiddenError("This order does not belong to you.");
    }
    if (!order.payment) throw new BadRequestError("This order has no payment record.");
    if (order.payment.method !== "CARD") {
      throw new BadRequestError("This order was not placed with card payment.");
    }
    if (order.payment.status === "PAID") {
      throw new BadRequestError("This order has already been paid.");
    }
    if (!order.delivery) throw new BadRequestError("This order has no delivery address on file.");

    const [firstName, ...rest] = order.customer.user.name.trim().split(/\s+/);
    const lastName = rest.join(" ") || "-";
    const itemsLabel =
      order.items
        .map((item) => item.product?.name ?? item.service?.name ?? "Item")
        .join(", ") || `Mahum.lk Order #${order.id.slice(-8)}`;

    const fields = buildPayHereCheckoutFields({
      orderId: order.id,
      amount: Number(order.payment.amount),
      items: itemsLabel,
      firstName,
      lastName,
      email: order.customer.user.email,
      phone: order.customer.user.phone ?? "",
      address: order.delivery.address,
      city: order.delivery.city,
    });

    return NextResponse.json({ checkoutUrl: PAYHERE_CHECKOUT_URL, fields });
  } catch (error) {
    return handleApiError(error);
  }
}
