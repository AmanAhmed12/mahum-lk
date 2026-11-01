import { NextResponse } from "next/server";

import { handleApiError } from "@/lib/api/errors";
import { requireRole } from "@/lib/auth/rbac";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRole(["ADMIN"]);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [
      totalOrders,
      pendingTailoringOrders,
      totalCustomers,
      newCustomersThisMonth,
      totalProducts,
      allInventory,
      revenueResult,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { type: "TAILORING", status: { in: ["PENDING", "CONFIRMED", "IN_PROGRESS"] } } }),
      prisma.customerProfile.count(),
      prisma.customerProfile.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.inventory.findMany({
        include: { product: { select: { id: true, name: true, slug: true } } },
      }),
      prisma.payment.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
    ]);

    const lowStockProducts = allInventory.filter((inv) => inv.quantity <= inv.reorderLevel);

    const recentOrders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        customer: { include: { user: { select: { name: true } } } },
      },
    });

    return NextResponse.json({
      totalOrders,
      pendingTailoringOrders,
      totalCustomers,
      newCustomersThisMonth,
      totalProducts,
      lowStockProducts,
      totalRevenue: Number(revenueResult._sum.amount ?? 0),
      recentOrders,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
