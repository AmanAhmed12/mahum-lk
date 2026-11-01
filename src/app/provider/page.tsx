import Link from "next/link";
import { redirect } from "next/navigation";

import { StatusBadge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/auth/session";
import prisma from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProviderDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?from=/provider");
  if (user.role !== "SERVICE_PROVIDER" || !user.providerProfileId) redirect("/");

  const orders = await prisma.order.findMany({
    where: { providerId: user.providerProfileId },
    orderBy: { createdAt: "desc" },
    include: { customer: { include: { user: { select: { name: true } } } } },
  });

  const activeCount = orders.filter((o) => !["DELIVERED", "CANCELLED"].includes(o.status)).length;

  return (
    <div>
      <h1 className="text-xl font-bold text-foreground">My Assigned Orders</h1>
      <p className="mt-1 text-sm text-neutral-600">{activeCount} active order(s) of {orders.length} total.</p>

      {orders.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border-muted p-10 text-center text-sm text-neutral-500">
          No orders have been assigned to you yet.
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-border-muted">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-muted text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-muted">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-surface-muted">
                  <td className="px-4 py-3">
                    <Link href={`/provider/orders/${order.id}`} className="font-medium text-brand-700 hover:underline">
                      #{order.id.slice(-8)}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{order.customer.user.name}</td>
                  <td className="px-4 py-3">{formatDate(order.createdAt)}</td>
                  <td className="px-4 py-3">{formatCurrency(order.totalAmount.toString())}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={order.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
