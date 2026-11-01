import Link from "next/link";
import { Compass } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center text-center">
      <Compass className="h-12 w-12 text-brand-600" />
      <h1 className="mt-4 text-2xl font-bold text-foreground">Page Not Found</h1>
      <p className="mt-2 max-w-md text-sm text-neutral-600">
        The page you&apos;re looking for doesn&apos;t exist or may have been moved.
      </p>
      <Link href="/" className="mt-6">
        <Button>Back to Home</Button>
      </Link>
    </div>
  );
}
