"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Menu, Scissors, ShoppingCart, User, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/services", label: "Tailoring Services" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const ROLE_HOME: Record<string, string> = {
  ADMIN: "/admin",
  SERVICE_PROVIDER: "/provider",
  CUSTOMER: "/account",
};

export function Header() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const totalItems = useCartStore((s) => s.totalItems());
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  async function handleLogout() {
    await apiFetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    toast.success("Signed out.");
    router.push("/");
    router.refresh();
  }

  function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    router.push(query ? `/shop?q=${encodeURIComponent(query)}` : "/shop");
    setMobileOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border-muted bg-white">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-serif text-xl font-bold text-brand-700">
          <Scissors className="h-6 w-6" />
          Mahum.lk
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-neutral-700 hover:text-brand-700"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <form onSubmit={handleSearch} className="hidden max-w-xs flex-1 lg:block">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products..."
            type="search"
          />
        </form>

        <div className="flex items-center gap-2">
          <Link
            href="/cart"
            className="relative rounded-md p-2 text-neutral-700 hover:bg-surface-muted"
            aria-label="Cart"
          >
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[11px] font-semibold text-white">
                {totalItems > 9 ? "9+" : totalItems}
              </span>
            ) : null}
          </Link>

          {user ? (
            <div className="hidden items-center gap-2 lg:flex">
              <Link
                href={ROLE_HOME[user.role] ?? "/account"}
                className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-surface-muted"
              >
                <User className="h-4 w-4" /> {user.name.split(" ")[0]}
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Log out
              </Button>
            </div>
          ) : (
            <div className="hidden items-center gap-2 lg:flex">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Sign up</Button>
              </Link>
            </div>
          )}

          <button
            className="rounded-md p-2 text-neutral-700 hover:bg-surface-muted lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div
        className={cn(
          "overflow-hidden border-t border-border-muted bg-white transition-[max-height] lg:hidden",
          mobileOpen ? "max-h-[28rem]" : "max-h-0 border-t-0",
        )}
      >
        <div className="container-page flex flex-col gap-3 py-4">
          <form onSubmit={handleSearch}>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products..."
              type="search"
            />
          </form>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="text-sm font-medium text-neutral-700 hover:text-brand-700"
            >
              {link.label}
            </Link>
          ))}
          <div className="h-px bg-border-muted" />
          {user ? (
            <>
              <Link href={ROLE_HOME[user.role] ?? "/account"} onClick={() => setMobileOpen(false)} className="text-sm font-medium text-neutral-700">
                My Account ({user.name})
              </Link>
              <Button variant="secondary" size="sm" onClick={handleLogout}>
                Log out
              </Button>
            </>
          ) : (
            <div className="flex gap-2">
              <Link href="/login" className="flex-1" onClick={() => setMobileOpen(false)}>
                <Button variant="secondary" size="sm" className="w-full">
                  Log in
                </Button>
              </Link>
              <Link href="/register" className="flex-1" onClick={() => setMobileOpen(false)}>
                <Button size="sm" className="w-full">
                  Sign up
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
