import { LayoutDashboard, Ruler, ShoppingBag } from "lucide-react";
import type { ReactNode } from "react";

import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";

const ITEMS = [
  { href: "/account", label: "Profile", icon: LayoutDashboard },
  { href: "/account/measurements", label: "Measurements", icon: Ruler },
  { href: "/account/orders", label: "My Orders", icon: ShoppingBag },
];

export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <div className="container-page flex flex-col gap-8 py-10 lg:flex-row">
      <DashboardSidebar title="My Account" items={ITEMS} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
