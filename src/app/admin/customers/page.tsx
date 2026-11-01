import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";
import prisma from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/");

  const customers = await prisma.customerProfile.findMany({
    include: { user: true, _count: { select: { orders: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-xl font-bold text-foreground">Customers</h1>
      <p className="mt-1 text-sm text-neutral-600">{customers.length} registered customer(s).</p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border-muted">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-muted text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Orders</th>
              <th className="px-4 py-3">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-muted">
            {customers.map((customer) => (
              <tr key={customer.id} className="hover:bg-surface-muted">
                <td className="px-4 py-3">{customer.user.name}</td>
                <td className="px-4 py-3">{customer.user.email}</td>
                <td className="px-4 py-3">{customer.user.phone ?? "—"}</td>
                <td className="px-4 py-3">{customer._count.orders}</td>
                <td className="px-4 py-3">{formatDate(customer.user.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {customers.length === 0 ? (
          <p className="p-10 text-center text-sm text-neutral-500">No customers yet.</p>
        ) : null}
      </div>
    </div>
  );
}
