import { NextRequest, NextResponse } from "next/server";

import { handleApiError } from "@/lib/api/errors";
import { requireRole } from "@/lib/auth/rbac";
import prisma from "@/lib/prisma";
import { productSchema } from "@/lib/validators/catalogue";

export const dynamic = "force-dynamic";

const PAGE_SIZE_DEFAULT = 12;

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl;
    const slug = url.searchParams.get("slug");

    if (slug) {
      const product = await prisma.product.findUnique({
        where: { slug },
        include: {
          category: true,
          images: true,
          inventory: true,
          reviews: { orderBy: { createdAt: "desc" }, include: { customer: { include: { user: true } } } },
        },
      });
      return NextResponse.json({ product });
    }

    const categorySlug = url.searchParams.get("category") || undefined;
    const search = url.searchParams.get("q") || undefined;
    const page = Math.max(1, Number(url.searchParams.get("page") ?? "1") || 1);
    const pageSize = Math.min(
      48,
      Math.max(1, Number(url.searchParams.get("pageSize") ?? String(PAGE_SIZE_DEFAULT)) || PAGE_SIZE_DEFAULT),
    );
    const includeInactive = url.searchParams.get("includeInactive") === "true";

    const where = {
      ...(includeInactive ? {} : { isActive: true }),
      ...(categorySlug ? { category: { slug: categorySlug } } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { description: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    if (includeInactive) {
      await requireRole(["ADMIN"]);
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true, images: true, inventory: true, reviews: { select: { rating: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireRole(["ADMIN"]);
    const body = await request.json();
    const input = productSchema.parse(body);

    const product = await prisma.product.create({
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description,
        sku: input.sku,
        price: input.price,
        discountPrice: input.discountPrice ?? null,
        categoryId: input.categoryId,
        isActive: input.isActive,
        images: { create: input.images.map((image) => ({ url: image.url, publicId: image.publicId })) },
        inventory: { create: { quantity: input.quantity, reorderLevel: input.reorderLevel } },
      },
      include: { category: true, images: true, inventory: true },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
