import prisma from "@/lib/prisma";

export async function getAdminStats() {
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
    recentOrders,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({
      where: { type: "TAILORING", status: { in: ["PENDING", "CONFIRMED", "IN_PROGRESS"] } },
    }),
    prisma.customerProfile.count(),
    prisma.customerProfile.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.inventory.findMany({ include: { product: { select: { id: true, name: true, slug: true } } } }),
    prisma.payment.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { customer: { include: { user: { select: { name: true } } } } },
    }),
  ]);

  const lowStockProducts = allInventory.filter((inv) => inv.quantity <= inv.reorderLevel);

  return {
    totalOrders,
    pendingTailoringOrders,
    totalCustomers,
    newCustomersThisMonth,
    totalProducts,
    lowStockProducts,
    totalRevenue: Number(revenueResult._sum.amount ?? 0),
    recentOrders,
  };
}

export type AdminStats = Awaited<ReturnType<typeof getAdminStats>>;
