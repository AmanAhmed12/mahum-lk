import { NextResponse } from "next/server";

import { BadRequestError, handleApiError, NotFoundError } from "@/lib/api/errors";
import { requireRole } from "@/lib/auth/rbac";
import { destroyAsset } from "@/lib/cloudinary";
import prisma from "@/lib/prisma";
import { categorySchema } from "@/lib/validators/catalogue";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    await requireRole(["ADMIN"]);
    const { id } = await params;
    const body = await request.json();
    const input = categorySchema.partial().parse(body);

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Category not found.");

    const category = await prisma.category.update({ where: { id }, data: input });
    return NextResponse.json({ category });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    await requireRole(["ADMIN"]);
    const { id } = await params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!category) throw new NotFoundError("Category not found.");
    if (category._count.products > 0) {
      throw new BadRequestError("Move or delete the products in this category first.");
    }

    await prisma.category.delete({ where: { id } });
    if (category.publicId) await destroyAsset(category.publicId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
