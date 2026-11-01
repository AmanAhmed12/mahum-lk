import { NextResponse } from "next/server";

import { ForbiddenError, handleApiError, NotFoundError } from "@/lib/api/errors";
import { requireRole } from "@/lib/auth/rbac";
import prisma from "@/lib/prisma";
import { orderStatusSchema } from "@/lib/validators/orders";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const ORDER_INCLUDE = {
  items: { include: { product: { include: { images: true } }, service: true, measurement: true } },
  payment: true,
  delivery: true,
  customer: { include: { user: { select: { name: true, email: true, phone: true } } } },
  provider: { include: { user: { select: { name: true, email: true, phone: true } } } },
} as const;

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const user = await requireRole();
    const { id } = await params;

    const order = await prisma.order.findUnique({ where: { id }, include: ORDER_INCLUDE });
    if (!order) throw new NotFoundError("Order not found.");

    const isOwnerCustomer = user.role === "CUSTOMER" && order.customerId === user.customerProfileId;
    const isAssignedProvider = user.role === "SERVICE_PROVIDER" && order.providerId === user.providerProfileId;
    const isAdmin = user.role === "ADMIN";

    if (!isOwnerCustomer && !isAssignedProvider && !isAdmin) {
      throw new ForbiddenError("You cannot view this order.");
    }

    return NextResponse.json({ order });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const user = await requireRole(["ADMIN", "SERVICE_PROVIDER"]);
    const { id } = await params;
    const body = await request.json();
    const input = orderStatusSchema.parse(body);

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundError("Order not found.");

    if (user.role === "SERVICE_PROVIDER" && order.providerId !== user.providerProfileId) {
      throw new ForbiddenError("This order is not assigned to you.");
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { status: input.status },
      include: ORDER_INCLUDE,
    });

    return NextResponse.json({ order: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
