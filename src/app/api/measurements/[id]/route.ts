import { NextResponse } from "next/server";

import { ForbiddenError, handleApiError, NotFoundError } from "@/lib/api/errors";
import { requireRole } from "@/lib/auth/rbac";
import prisma from "@/lib/prisma";
import { measurementSchema } from "@/lib/validators/orders";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function loadOwnedMeasurement(id: string, customerProfileId: string) {
  const measurement = await prisma.measurement.findUnique({ where: { id } });
  if (!measurement) throw new NotFoundError("Measurement profile not found.");
  if (measurement.customerId !== customerProfileId) {
    throw new ForbiddenError("This measurement profile does not belong to you.");
  }
  return measurement;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const user = await requireRole(["CUSTOMER"]);
    if (!user.customerProfileId) throw new ForbiddenError("No customer profile found.");
    const { id } = await params;
    await loadOwnedMeasurement(id, user.customerProfileId);

    const body = await request.json();
    const input = measurementSchema.partial().parse(body);

    const measurement = await prisma.measurement.update({ where: { id }, data: input });
    return NextResponse.json({ measurement });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const user = await requireRole(["CUSTOMER"]);
    if (!user.customerProfileId) throw new ForbiddenError("No customer profile found.");
    const { id } = await params;
    await loadOwnedMeasurement(id, user.customerProfileId);

    await prisma.measurement.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
