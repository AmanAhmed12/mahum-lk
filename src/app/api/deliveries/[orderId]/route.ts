import { NextResponse } from "next/server";

import { ForbiddenError, handleApiError, NotFoundError } from "@/lib/api/errors";
import { requireRole } from "@/lib/auth/rbac";
import prisma from "@/lib/prisma";
import { deliveryUpdateSchema } from "@/lib/validators/orders";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ orderId: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const user = await requireRole(["ADMIN", "SERVICE_PROVIDER"]);
    const { orderId } = await params;
    const body = await request.json();
    const input = deliveryUpdateSchema.parse(body);

    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { delivery: true } });
    if (!order || !order.delivery) throw new NotFoundError("Delivery record not found.");

    if (user.role === "SERVICE_PROVIDER" && order.providerId !== user.providerProfileId) {
      throw new ForbiddenError("This order is not assigned to you.");
    }

    const delivery = await prisma.delivery.update({
      where: { orderId },
      data: {
        status: input.status,
        trackingNumber: input.trackingNumber || null,
        deliveredAt: input.status === "DELIVERED" ? new Date() : order.delivery.deliveredAt,
      },
    });

    if (input.status === "DELIVERED" && order.status !== "DELIVERED") {
      await prisma.order.update({ where: { id: orderId }, data: { status: "DELIVERED" } });
    }

    return NextResponse.json({ delivery });
  } catch (error) {
    return handleApiError(error);
  }
}
