import { NextResponse } from "next/server";

import { ForbiddenError, handleApiError, NotFoundError } from "@/lib/api/errors";
import { requireRole } from "@/lib/auth/rbac";
import prisma from "@/lib/prisma";
import { paymentUpdateSchema } from "@/lib/validators/orders";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ orderId: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const user = await requireRole();
    const { orderId } = await params;

    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { payment: true } });
    if (!order) throw new NotFoundError("Order not found.");

    const canView =
      user.role === "ADMIN" ||
      (user.role === "CUSTOMER" && order.customerId === user.customerProfileId) ||
      (user.role === "SERVICE_PROVIDER" && order.providerId === user.providerProfileId);
    if (!canView) throw new ForbiddenError("You cannot view this payment.");

    return NextResponse.json({ payment: order.payment });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const user = await requireRole(["ADMIN", "SERVICE_PROVIDER"]);
    const { orderId } = await params;
    const body = await request.json();
    const input = paymentUpdateSchema.parse(body);

    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { payment: true } });
    if (!order || !order.payment) throw new NotFoundError("Payment record not found.");

    if (user.role === "SERVICE_PROVIDER" && order.providerId !== user.providerProfileId) {
      throw new ForbiddenError("This order is not assigned to you.");
    }

    const payment = await prisma.payment.update({
      where: { orderId },
      data: { status: input.status, transactionRef: input.transactionRef || null },
    });

    return NextResponse.json({ payment });
  } catch (error) {
    return handleApiError(error);
  }
}
