"use client";

import * as React from "react";
import { Toaster } from "sonner";

import { apiJson } from "@/lib/api/client";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import type { AuthUser } from "@/types";

export function Providers({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const markInitialized = useAuthStore((s) => s.markInitialized);

  React.useEffect(() => {
    useCartStore.persist.rehydrate();
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    apiJson<{ user: AuthUser | null }>("/api/auth/me")
      .then((data) => {
        if (!cancelled) setUser(data.user);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) markInitialized();
      });
    return () => {
      cancelled = true;
    };
  }, [setUser, markInitialized]);

  return (
    <>
      {children}
      <Toaster richColors position="top-center" />
    </>
  );
}
