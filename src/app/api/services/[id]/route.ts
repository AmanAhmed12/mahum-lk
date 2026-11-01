import { NextResponse } from "next/server";

import { handleApiError, NotFoundError } from "@/lib/api/errors";
import { requireRole } from "@/lib/auth/rbac";
import prisma from "@/lib/prisma";
import { serviceSchema } from "@/lib/validators/catalogue";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    await requireRole(["ADMIN"]);
    const { id } = await params;
    const body = await request.json();
    const input = serviceSchema.partial().parse(body);

    const existing = await prisma.service.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Service not found.");

    const service = await prisma.service.update({ where: { id }, data: input });
    return NextResponse.json({ service });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    await requireRole(["ADMIN"]);
    const { id } = await params;
    const existing = await prisma.service.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Service not found.");

    // Services referenced by past orders are deactivated instead of hard-deleted
    // so order history stays intact.
    await prisma.service.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
