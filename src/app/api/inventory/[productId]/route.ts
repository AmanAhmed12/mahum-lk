import { NextResponse } from "next/server";

import { handleApiError, NotFoundError } from "@/lib/api/errors";
import { requireRole } from "@/lib/auth/rbac";
import prisma from "@/lib/prisma";
import { inventorySchema } from "@/lib/validators/catalogue";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ productId: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    await requireRole(["ADMIN"]);
    const { productId } = await params;
    const body = await request.json();
    const input = inventorySchema.parse(body);

    const existing = await prisma.inventory.findUnique({ where: { productId } });
    if (!existing) throw new NotFoundError("Inventory record not found for this product.");

    const inventory = await prisma.inventory.update({ where: { productId }, data: input });
    return NextResponse.json({ inventory });
  } catch (error) {
    return handleApiError(error);
  }
}
