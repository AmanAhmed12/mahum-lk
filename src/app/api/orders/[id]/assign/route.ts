import { NextResponse } from "next/server";

import { BadRequestError, handleApiError, NotFoundError } from "@/lib/api/errors";
import { requireRole } from "@/lib/auth/rbac";
import prisma from "@/lib/prisma";
import { assignProviderSchema } from "@/lib/validators/orders";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    await requireRole(["ADMIN"]);
    const { id } = await params;
    const body = await request.json();
    const input = assignProviderSchema.parse(body);

    const [order, provider] = await Promise.all([
      prisma.order.findUnique({ where: { id } }),
      prisma.serviceProviderProfile.findUnique({ where: { id: input.providerId } }),
    ]);
    if (!order) throw new NotFoundError("Order not found.");
    if (!provider) throw new BadRequestError("Selected service provider does not exist.");

    const updated = await prisma.order.update({
      where: { id },
      data: {
        providerId: provider.id,
        status: order.status === "PENDING" ? "CONFIRMED" : order.status,
      },
      include: {
        provider: { include: { user: { select: { name: true, email: true } } } },
      },
    });

    return NextResponse.json({ order: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
