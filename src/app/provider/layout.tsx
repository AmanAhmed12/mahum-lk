"use client";

import { ClipboardList } from "lucide-react";
import type { ReactNode } from "react";

import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";

const ITEMS = [{ href: "/provider", label: "Assigned Orders", icon: ClipboardList }];

export default function ProviderLayout({ children }: { children: ReactNode }) {
  return (
    <div className="container-page flex flex-col gap-8 py-10 lg:flex-row">
      <DashboardSidebar title="Service Provider" items={ITEMS} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
