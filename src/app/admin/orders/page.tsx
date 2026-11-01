import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge, StatusBadge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth/session";
import prisma from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ORDER_STATUSES } from "@/types";

export const dynamic = "force-dynamic";

interface AdminOrdersPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?from=/admin/orders");
  if (user.role !== "ADMIN") redirect("/");

  const { status } = await searchParams;

  const orders = await prisma.order.findMany({
    where: status ? { status: status as (typeof ORDER_STATUSES)[number] } : {},
    orderBy: { createdAt: "desc" },
    include: {
      customer: { include: { user: { select: { name: true } } } },
      provider: { include: { user: { select: { name: true } } } },
    },
  });

  return (
    <div>
      <h1 className="text-xl font-bold text-foreground">Orders</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/admin/orders">
          <Badge variant={!status ? "brand" : "neutral"} className="cursor-pointer">
            All
          </Badge>
        </Link>
        {ORDER_STATUSES.map((s) => (
          <Link key={s} href={`/admin/orders?status=${s}`}>
            <Badge variant={status === s ? "brand" : "neutral"} className="cursor-pointer">
              {s.replaceAll("_", " ")}
            </Badge>
          </Link>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border-muted">
        <table className="w-full text-left text-sm">
          <thead className={cn("bg-surface-muted text-xs uppercase text-neutral-500")}>
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Provider</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-muted">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-surface-muted">
                <td className="px-4 py-3">
                  <Link href={`/admin/orders/${order.id}`} className="font-medium text-brand-700 hover:underline">
                    #{order.id.slice(-8)}
                  </Link>
                </td>
                <td className="px-4 py-3">{order.type === "TAILORING" ? "Tailoring" : "Product"}</td>
                <td className="px-4 py-3">{order.customer.user.name}</td>
                <td className="px-4 py-3">{order.provider?.user.name ?? "Unassigned"}</td>
                <td className="px-4 py-3">{formatDate(order.createdAt)}</td>
                <td className="px-4 py-3">{formatCurrency(order.totalAmount.toString())}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={order.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 ? (
          <p className="p-10 text-center text-sm text-neutral-500">No orders found.</p>
        ) : null}
      </div>
    </div>
  );
}
