"use client";

import {
  BarChart3,
  Boxes,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Tags,
  Users,
  Wrench,
} from "lucide-react";
import type { ReactNode } from "react";

import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";

const ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/inventory", label: "Inventory", icon: Boxes },
  { href: "/admin/services", label: "Tailoring Services", icon: Wrench },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/providers", label: "Staff & Providers", icon: Users },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="container-page flex flex-col gap-8 py-10 lg:flex-row">
      <DashboardSidebar title="Admin" items={ITEMS} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
