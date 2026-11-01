import { NextResponse } from "next/server";

import { handleApiError, NotFoundError } from "@/lib/api/errors";
import { requireRole } from "@/lib/auth/rbac";
import { destroyAsset } from "@/lib/cloudinary";
import prisma from "@/lib/prisma";
import { productSchema } from "@/lib/validators/catalogue";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    await requireRole(["ADMIN"]);
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true, images: true, inventory: true },
    });
    if (!product) throw new NotFoundError("Product not found.");
    return NextResponse.json({ product });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    await requireRole(["ADMIN"]);
    const { id } = await params;
    const body = await request.json();
    const input = productSchema.partial().parse(body);

    const existing = await prisma.product.findUnique({ where: { id }, include: { images: true } });
    if (!existing) throw new NotFoundError("Product not found.");

    const removedImages = input.images
      ? existing.images.filter((img) => !input.images!.some((next) => next.publicId === img.publicId))
      : [];

    const product = await prisma.$transaction(async (tx) => {
      if (input.images) {
        await tx.productImage.deleteMany({ where: { productId: id } });
      }

      await tx.product.update({
        where: { id },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.slug !== undefined ? { slug: input.slug } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.sku !== undefined ? { sku: input.sku } : {}),
          ...(input.price !== undefined ? { price: input.price } : {}),
          ...(input.discountPrice !== undefined ? { discountPrice: input.discountPrice } : {}),
          ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
          ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
          ...(input.images ? { images: { create: input.images.map((img) => ({ url: img.url, publicId: img.publicId })) } } : {}),
        },
      });

      if (input.quantity !== undefined || input.reorderLevel !== undefined) {
        await tx.inventory.upsert({
          where: { productId: id },
          create: { productId: id, quantity: input.quantity ?? 0, reorderLevel: input.reorderLevel ?? 5 },
          update: {
            ...(input.quantity !== undefined ? { quantity: input.quantity } : {}),
            ...(input.reorderLevel !== undefined ? { reorderLevel: input.reorderLevel } : {}),
          },
        });
      }

      return tx.product.findUniqueOrThrow({
        where: { id },
        include: { category: true, images: true, inventory: true },
      });
    });

    await Promise.all(removedImages.map((img) => destroyAsset(img.publicId)));

    return NextResponse.json({ product });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    await requireRole(["ADMIN"]);
    const { id } = await params;

    const product = await prisma.product.findUnique({ where: { id }, include: { images: true } });
    if (!product) throw new NotFoundError("Product not found.");

    await prisma.product.delete({ where: { id } });
    await Promise.all(product.images.map((img) => destroyAsset(img.publicId)));

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
