import Link from "next/link";
import { ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function ForbiddenPage() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center text-center">
      <ShieldAlert className="h-12 w-12 text-brand-600" />
      <h1 className="mt-4 text-2xl font-bold text-foreground">Access Denied</h1>
      <p className="mt-2 max-w-md text-sm text-neutral-600">
        You don&apos;t have permission to view this page. If you think this is a mistake, contact
        an administrator.
      </p>
      <Link href="/" className="mt-6">
        <Button>Back to Home</Button>
      </Link>
    </div>
  );
}
