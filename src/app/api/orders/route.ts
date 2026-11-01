import { NextRequest, NextResponse } from "next/server";

import { BadRequestError, ForbiddenError, handleApiError } from "@/lib/api/errors";
import { requireRole } from "@/lib/auth/rbac";
import prisma from "@/lib/prisma";
import { checkoutSchema, tailoringRequestSchema } from "@/lib/validators/orders";
import { ORDER_STATUSES, type OrderStatus } from "@/types";

export const dynamic = "force-dynamic";

const ORDER_INCLUDE = {
  items: { include: { product: { include: { images: true } }, service: true, measurement: true } },
  payment: true,
  delivery: true,
  customer: { include: { user: { select: { name: true, email: true, phone: true } } } },
  provider: { include: { user: { select: { name: true, email: true, phone: true } } } },
} as const;

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole();
    const statusParam = request.nextUrl.searchParams.get("status");
    const statusFilter: OrderStatus | undefined = ORDER_STATUSES.includes(statusParam as OrderStatus)
      ? (statusParam as OrderStatus)
      : undefined;

    let where = {};
    if (user.role === "CUSTOMER") {
      if (!user.customerProfileId) throw new ForbiddenError("No customer profile found.");
      where = { customerId: user.customerProfileId };
    } else if (user.role === "SERVICE_PROVIDER") {
      if (!user.providerProfileId) throw new ForbiddenError("No service provider profile found.");
      where = { providerId: user.providerProfileId };
    }
    // ADMIN sees all orders (where stays {}).

    const orders = await prisma.order.findMany({
      where: { ...where, ...(statusFilter ? { status: statusFilter } : {}) },
      include: ORDER_INCLUDE,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole(["CUSTOMER"]);
    if (!user.customerProfileId) throw new ForbiddenError("No customer profile found.");
    const customerId = user.customerProfileId;

    const body = await request.json();

    if (body?.type === "TAILORING") {
      const input = tailoringRequestSchema.parse(body);

      const [service, measurement] = await Promise.all([
        prisma.service.findUnique({ where: { id: input.serviceId } }),
        prisma.measurement.findUnique({ where: { id: input.measurementId } }),
      ]);
      if (!service || !service.isActive) throw new BadRequestError("Selected service is unavailable.");
      if (!measurement || measurement.customerId !== customerId) {
        throw new BadRequestError("Selected measurement profile is invalid.");
      }

      const unitPrice = Number(service.basePrice);
      const totalAmount = unitPrice * input.quantity;

      const order = await prisma.order.create({
        data: {
          customerId,
          type: "TAILORING",
          status: "PENDING",
          totalAmount,
          notes: input.notes || null,
          items: {
            create: [
              {
                serviceId: service.id,
                measurementId: measurement.id,
                quantity: input.quantity,
                unitPrice,
              },
            ],
          },
          payment: { create: { amount: totalAmount, method: input.paymentMethod, status: "PENDING" } },
          delivery: { create: { address: input.address, city: input.city, status: "PENDING" } },
        },
        include: ORDER_INCLUDE,
      });

      return NextResponse.json({ order }, { status: 201 });
    }

    const input = checkoutSchema.parse(body);

    const productIds = input.items.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { inventory: true },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestError("One or more products in your cart no longer exist.");
    }

    const order = await prisma.$transaction(
      async (tx) => {
        let totalAmount = 0;
        const itemsData: Array<{ productId: string; quantity: number; unitPrice: number }> = [];

        for (const line of input.items) {
          const product = products.find((p) => p.id === line.productId)!;
          if (!product.isActive) {
            throw new BadRequestError(`"${product.name}" is no longer available.`);
          }

          const decremented = await tx.inventory.updateMany({
            where: { productId: product.id, quantity: { gte: line.quantity } },
            data: { quantity: { decrement: line.quantity } },
          });
          if (decremented.count !== 1) {
            throw new BadRequestError(`"${product.name}" does not have enough stock.`);
          }

          const unitPrice = Number(product.discountPrice ?? product.price);
          totalAmount += unitPrice * line.quantity;
          itemsData.push({ productId: product.id, quantity: line.quantity, unitPrice });
        }

        return tx.order.create({
          data: {
            customerId,
            type: "PRODUCT",
            status: "PENDING",
            totalAmount,
            items: { create: itemsData },
            payment: { create: { amount: totalAmount, method: input.paymentMethod, status: "PENDING" } },
            delivery: { create: { address: input.address, city: input.city, status: "PENDING" } },
          },
          include: ORDER_INCLUDE,
        });
      },
      // Neon's serverless (HTTP/WebSocket) driver can add noticeable
      // per-query latency, especially on a cold connection — the 5s default
      // interactive-transaction timeout is too tight for a multi-query
      // transaction like this one.
      { timeout: 15_000, maxWait: 10_000 },
    );

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
