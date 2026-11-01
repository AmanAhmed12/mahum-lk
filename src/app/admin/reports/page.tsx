import { redirect } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminStats } from "@/lib/admin/stats";
import { getCurrentUser } from "@/lib/auth/session";
import prisma from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?from=/admin/reports");
  if (user.role !== "ADMIN") redirect("/");

  const [stats, statusBreakdown, paymentBreakdown] = await Promise.all([
    getAdminStats(),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.payment.groupBy({ by: ["method", "status"], _count: { _all: true }, _sum: { amount: true } }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-foreground">Reports</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Orders by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {statusBreakdown.map((row) => (
                <li key={row.status} className="flex justify-between">
                  <span className="text-neutral-600">{row.status.replaceAll("_", " ")}</span>
                  <span className="font-medium text-foreground">{row._count._all}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payments by Method &amp; Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {paymentBreakdown.map((row) => (
                <li key={`${row.method}-${row.status}`} className="flex justify-between">
                  <span className="text-neutral-600">
                    {row.method.replaceAll("_", " ")} · {row.status}
                  </span>
                  <span className="font-medium text-foreground">
                    {row._count._all} ({formatCurrency(Number(row._sum.amount ?? 0))})
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Low Stock Products</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.lowStockProducts.length > 0 ? (
            <div className="divide-y divide-border-muted">
              {stats.lowStockProducts.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span>{inv.product.name}</span>
                  <span className="text-amber-600">
                    {inv.quantity} in stock (reorder at {inv.reorderLevel})
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-500">All products are well stocked.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
