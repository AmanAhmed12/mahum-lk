import Link from "next/link";

import { Button } from "@/components/ui/button";
import prisma from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const services = await prisma.service.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });

  return (
    <div className="container-page py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tailoring Services</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Choose a service and request a custom tailoring order with your own measurements.
          </p>
        </div>
        <Link href="/services/request">
          <Button>Request Customisation</Button>
        </Link>
      </div>

      {services.length > 0 ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <div key={service.id} className="rounded-xl border border-border-muted bg-white p-5">
              <h2 className="font-semibold text-foreground">{service.name}</h2>
              <p className="mt-2 text-sm text-neutral-600">{service.description}</p>
              <p className="mt-3 text-sm font-semibold text-brand-700">
                From {formatCurrency(service.basePrice.toString())}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-xl border border-dashed border-border-muted p-16 text-center text-sm text-neutral-500">
          No tailoring services available yet.
        </div>
      )}
    </div>
  );
}
