import Image from "next/image";
import { Check } from "lucide-react";
import type { ReactNode } from "react";

import { StatusBadge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

const STATUS_STEPS = ["PENDING", "CONFIRMED", "IN_PROGRESS", "READY", "DELIVERED"] as const;

export interface OrderDetailData {
  id: string;
  type: string;
  status: string;
  totalAmount: number;
  notes: string | null;
  createdAt: Date | string;
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    product: { name: string; images: { url: string }[] } | null;
    service: { name: string } | null;
    measurement: { label: string } | null;
  }>;
  payment: { amount: number; method: string; status: string; transactionRef: string | null } | null;
  delivery: {
    address: string;
    city: string;
    method: string;
    status: string;
    trackingNumber: string | null;
  } | null;
  customer: { user: { name: string; email: string; phone: string | null } } | null;
  provider: { user: { name: string; email: string } } | null;
}

export function OrderDetail({
  order,
  showCustomer = false,
  showProvider = false,
  extraActions,
}: {
  order: OrderDetailData;
  showCustomer?: boolean;
  showProvider?: boolean;
  extraActions?: ReactNode;
}) {
  const isCancelled = order.status === "CANCELLED";
  const currentStepIndex = STATUS_STEPS.indexOf(order.status as (typeof STATUS_STEPS)[number]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            {order.type === "TAILORING" ? "Tailoring Order" : "Product Order"} #{order.id.slice(-8)}
          </h1>
          <p className="text-sm text-neutral-500">Placed on {formatDate(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={order.status} />
          {extraActions}
        </div>
      </div>

      {!isCancelled ? (
        <div className="flex items-center">
          {STATUS_STEPS.map((step, index) => {
            const reached = index <= currentStepIndex;
            return (
              <div key={step} className="flex flex-1 items-center last:flex-none">
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold",
                    reached ? "border-brand-600 bg-brand-600 text-white" : "border-border-muted text-neutral-400",
                  )}
                >
                  {reached ? <Check className="h-3.5 w-3.5" /> : index + 1}
                </div>
                {index < STATUS_STEPS.length - 1 ? (
                  <div className={cn("mx-1 h-0.5 flex-1", reached ? "bg-brand-600" : "bg-border-muted")} />
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 text-sm">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-surface-muted">
                {item.product?.images[0] ? (
                  <Image src={item.product.images[0].url} alt={item.product.name} fill className="object-cover" />
                ) : null}
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">
                  {item.product?.name ?? item.service?.name ?? "Item"}
                </p>
                {item.measurement ? (
                  <p className="text-xs text-neutral-500">Measurement: {item.measurement.label}</p>
                ) : null}
                <p className="text-xs text-neutral-500">Qty: {item.quantity}</p>
              </div>
              <p className="font-medium text-foreground">
                {formatCurrency(item.unitPrice * item.quantity)}
              </p>
            </div>
          ))}
          <div className="flex justify-between border-t border-border-muted pt-3 text-sm font-semibold">
            <span>Total</span>
            <span>{formatCurrency(order.totalAmount)}</span>
          </div>
          {order.notes ? (
            <p className="rounded-md bg-surface-muted p-3 text-xs text-neutral-600">
              <strong>Notes:</strong> {order.notes}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {order.payment ? (
          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-neutral-600">
              <p>Amount: {formatCurrency(order.payment.amount)}</p>
              <p>Method: {order.payment.method.replaceAll("_", " ")}</p>
              <p className="flex items-center gap-2">
                Status: <StatusBadge status={order.payment.status} />
              </p>
              {order.payment.transactionRef ? <p>Reference: {order.payment.transactionRef}</p> : null}
            </CardContent>
          </Card>
        ) : null}

        {order.delivery ? (
          <Card>
            <CardHeader>
              <CardTitle>Delivery</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-neutral-600">
              <p>Address: {order.delivery.address}, {order.delivery.city}</p>
              <p>Method: {order.delivery.method}</p>
              <p className="flex items-center gap-2">
                Status: <StatusBadge status={order.delivery.status} />
              </p>
              {order.delivery.trackingNumber ? <p>Tracking #: {order.delivery.trackingNumber}</p> : null}
            </CardContent>
          </Card>
        ) : null}
      </div>

      {showCustomer && order.customer ? (
        <Card>
          <CardHeader>
            <CardTitle>Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-neutral-600">
            <p>{order.customer.user.name}</p>
            <p>{order.customer.user.email}</p>
            {order.customer.user.phone ? <p>{order.customer.user.phone}</p> : null}
          </CardContent>
        </Card>
      ) : null}

      {showProvider && order.provider ? (
        <Card>
          <CardHeader>
            <CardTitle>Assigned Service Provider</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-neutral-600">
            <p>{order.provider.user.name}</p>
            <p>{order.provider.user.email}</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
