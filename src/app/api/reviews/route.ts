import { NextRequest, NextResponse } from "next/server";

import { BadRequestError, ForbiddenError, handleApiError } from "@/lib/api/errors";
import { requireRole } from "@/lib/auth/rbac";
import prisma from "@/lib/prisma";
import { reviewSchema } from "@/lib/validators/catalogue";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const productId = request.nextUrl.searchParams.get("productId");
    if (!productId) throw new BadRequestError("productId is required.");

    const reviews = await prisma.review.findMany({
      where: { productId },
      orderBy: { createdAt: "desc" },
      include: { customer: { include: { user: { select: { name: true } } } } },
    });
    return NextResponse.json({ reviews });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole(["CUSTOMER"]);
    if (!user.customerProfileId) throw new ForbiddenError("No customer profile found.");

    const body = await request.json();
    const input = reviewSchema.parse(body);

    const purchased = await prisma.orderItem.findFirst({
      where: {
        productId: input.productId,
        order: { customerId: user.customerProfileId, status: "DELIVERED" },
      },
    });
    if (!purchased) {
      throw new BadRequestError("You can only review products from a delivered order.");
    }

    const existingReview = await prisma.review.findFirst({
      where: { productId: input.productId, customerId: user.customerProfileId },
    });
    if (existingReview) {
      throw new BadRequestError("You have already reviewed this product.");
    }

    const review = await prisma.review.create({
      data: {
        productId: input.productId,
        customerId: user.customerProfileId,
        rating: input.rating,
        comment: input.comment || null,
      },
    });
    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
