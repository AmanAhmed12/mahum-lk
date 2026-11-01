"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled app error:", error);
  }, [error]);

  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center text-center">
      <AlertTriangle className="h-12 w-12 text-red-500" />
      <h1 className="mt-4 text-2xl font-bold text-foreground">Something went wrong</h1>
      <p className="mt-2 max-w-md text-sm text-neutral-600">
        An unexpected error occurred. You can try again, or head back to the homepage.
      </p>
      <Button onClick={() => reset()} className="mt-6">
        Try again
      </Button>
    </div>
  );
}
