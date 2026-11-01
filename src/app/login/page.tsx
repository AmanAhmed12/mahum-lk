"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import { apiJson } from "@/lib/api/client";
import { loginSchema, type LoginInput } from "@/lib/validators/auth";
import { useAuthStore } from "@/store/authStore";
import type { AuthUser } from "@/types";

const ROLE_HOME: Record<string, string> = {
  ADMIN: "/admin",
  SERVICE_PROVIDER: "/provider",
  CUSTOMER: "/account",
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useAuthStore((s) => s.setUser);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginInput) {
    try {
      const data = await apiJson<{ user: AuthUser }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(values),
      });
      setUser(data.user);
      toast.success(`Welcome back, ${data.user.name}!`);
      const from = searchParams.get("from");
      router.push(from || ROLE_HOME[data.user.role] || "/");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not log in.");
    }
  }

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-sm rounded-xl border border-border-muted p-6 shadow-sm">
        <h1 className="text-xl font-bold text-foreground">Log in to Mahum.lk</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")} />
            <FieldError message={errors.email?.message} />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" {...register("password")} />
            <FieldError message={errors.password?.message} />
          </div>
          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Log in
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-neutral-600">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-brand-700 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
