import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, DollarSign, Package, ShoppingCart, Users } from "lucide-react";

import { StatusBadge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminStats } from "@/lib/admin/stats";
import { getCurrentUser } from "@/lib/auth/session";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?from=/admin");
  if (user.role !== "ADMIN") redirect("/");

  const stats = await getAdminStats();

  const kpis = [
    { label: "Total Orders", value: stats.totalOrders, icon: ShoppingCart },
    { label: "Revenue (Paid)", value: formatCurrency(stats.totalRevenue), icon: DollarSign },
    { label: "Customers", value: stats.totalCustomers, icon: Users },
    { label: "Active Products", value: stats.totalProducts, icon: Package },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-neutral-600">
          {stats.pendingTailoringOrders} pending tailoring order(s) · {stats.newCustomersThisMonth} new
          customer(s) this month
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="flex items-center gap-3 p-5">
              <div className="rounded-full bg-brand-50 p-2.5 text-brand-700">
                <kpi.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-neutral-500">{kpi.label}</p>
                <p className="text-lg font-semibold text-foreground">{kpi.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentOrders.length > 0 ? (
              <div className="divide-y divide-border-muted">
                {stats.recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/admin/orders/${order.id}`}
                    className="flex items-center justify-between py-2.5 text-sm hover:text-brand-700"
                  >
                    <span>
                      #{order.id.slice(-8)} · {order.customer.user.name}
                    </span>
                    <span className="flex items-center gap-2">
                      {formatDate(order.createdAt)}
                      <StatusBadge status={order.status} />
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-500">No orders yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" /> Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.lowStockProducts.length > 0 ? (
              <div className="divide-y divide-border-muted">
                {stats.lowStockProducts.map((inv) => (
                  <Link
                    key={inv.id}
                    href={`/admin/products/${inv.productId}`}
                    className="flex items-center justify-between py-2.5 text-sm hover:text-brand-700"
                  >
                    <span>{inv.product.name}</span>
                    <span className="text-amber-600">
                      {inv.quantity} left (reorder at {inv.reorderLevel})
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-500">All products are well stocked.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
