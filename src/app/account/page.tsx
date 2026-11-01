import Link from "next/link";
import { redirect } from "next/navigation";

import { StatusBadge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";
import prisma from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const ROLE_HOME: Record<string, string> = { ADMIN: "/admin", SERVICE_PROVIDER: "/provider" };

export default async function AccountOverviewPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?from=/account");
  if (user.role !== "CUSTOMER" || !user.customerProfileId) redirect(ROLE_HOME[user.role] ?? "/");

  const [profile, recentOrders] = await Promise.all([
    prisma.customerProfile.findUnique({
      where: { id: user.customerProfileId },
      include: { user: true, _count: { select: { orders: true, measurements: true } } },
    }),
    prisma.order.findMany({
      where: { customerId: user.customerProfileId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>My Profile</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm text-neutral-700 sm:grid-cols-2">
          <p><span className="text-neutral-400">Name:</span> {profile?.user.name}</p>
          <p><span className="text-neutral-400">Email:</span> {profile?.user.email}</p>
          <p><span className="text-neutral-400">Phone:</span> {profile?.user.phone ?? "—"}</p>
          <p><span className="text-neutral-400">Address:</span> {profile?.address ?? "—"}</p>
          <p><span className="text-neutral-400">Total Orders:</span> {profile?._count.orders ?? 0}</p>
          <p><span className="text-neutral-400">Saved Measurement Profiles:</span> {profile?._count.measurements ?? 0}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {recentOrders.length > 0 ? (
            <div className="divide-y divide-border-muted">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/account/orders/${order.id}`}
                  className="flex items-center justify-between py-3 text-sm hover:bg-surface-muted"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {order.type === "TAILORING" ? "Tailoring Order" : "Product Order"} #{order.id.slice(-8)}
                    </p>
                    <p className="text-neutral-400">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-foreground">{formatCurrency(order.totalAmount.toString())}</span>
                    <StatusBadge status={order.status} />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-500">You haven&apos;t placed any orders yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
