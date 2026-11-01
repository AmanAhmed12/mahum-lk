import { NextResponse } from "next/server";

import { handleApiError, ForbiddenError } from "@/lib/api/errors";
import { requireRole } from "@/lib/auth/rbac";
import prisma from "@/lib/prisma";
import { measurementSchema } from "@/lib/validators/orders";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireRole(["CUSTOMER"]);
    if (!user.customerProfileId) throw new ForbiddenError("No customer profile found.");

    const measurements = await prisma.measurement.findMany({
      where: { customerId: user.customerProfileId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ measurements });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole(["CUSTOMER"]);
    if (!user.customerProfileId) throw new ForbiddenError("No customer profile found.");

    const body = await request.json();
    const input = measurementSchema.parse(body);

    const measurement = await prisma.measurement.create({
      data: { ...input, customerId: user.customerProfileId },
    });
    return NextResponse.json({ measurement }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
