"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { apiFetch } from "@/lib/api/client";

const ORDER_STATUSES = ["PENDING", "CONFIRMED", "IN_PROGRESS", "READY", "DELIVERED", "CANCELLED"];
const DELIVERY_STATUSES = ["PENDING", "DISPATCHED", "OUT_FOR_DELIVERY", "DELIVERED", "FAILED"];
const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED", "REFUNDED"];

export function OrderStatusControls({
  orderId,
  initialStatus,
  initialDeliveryStatus,
  initialPaymentStatus,
  initialTrackingNumber,
}: {
  orderId: string;
  initialStatus: string;
  initialDeliveryStatus?: string;
  initialPaymentStatus?: string;
  initialTrackingNumber?: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = React.useState(initialStatus);
  const [deliveryStatus, setDeliveryStatus] = React.useState(initialDeliveryStatus ?? "PENDING");
  const [paymentStatus, setPaymentStatus] = React.useState(initialPaymentStatus ?? "PENDING");
  const [trackingNumber, setTrackingNumber] = React.useState(initialTrackingNumber ?? "");
  const [savingField, setSavingField] = React.useState<string | null>(null);

  async function save(field: string, request: () => Promise<Response>) {
    setSavingField(field);
    try {
      const response = await request();
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Update failed.");
      }
      toast.success("Updated successfully.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed.");
    } finally {
      setSavingField(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Update Order</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <Label htmlFor="orderStatus">Order Status</Label>
          <div className="flex gap-2">
            <Select id="orderStatus" value={status} onChange={(e) => setStatus(e.target.value)}>
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replaceAll("_", " ")}
                </option>
              ))}
            </Select>
            <Button
              type="button"
              size="sm"
              isLoading={savingField === "status"}
              onClick={() =>
                save("status", () =>
                  apiFetch(`/api/orders/${orderId}`, {
                    method: "PATCH",
                    body: JSON.stringify({ status }),
                  }),
                )
              }
            >
              Save
            </Button>
          </div>
        </div>

        <div>
          <Label htmlFor="deliveryStatus">Delivery Status</Label>
          <div className="flex gap-2">
            <Select
              id="deliveryStatus"
              value={deliveryStatus}
              onChange={(e) => setDeliveryStatus(e.target.value)}
            >
              {DELIVERY_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replaceAll("_", " ")}
                </option>
              ))}
            </Select>
            <Button
              type="button"
              size="sm"
              isLoading={savingField === "delivery"}
              onClick={() =>
                save("delivery", () =>
                  apiFetch(`/api/deliveries/${orderId}`, {
                    method: "PATCH",
                    body: JSON.stringify({ status: deliveryStatus, trackingNumber }),
                  }),
                )
              }
            >
              Save
            </Button>
          </div>
          <Input
            className="mt-2"
            placeholder="Tracking number (optional)"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="paymentStatus">Payment Status</Label>
          <div className="flex gap-2">
            <Select
              id="paymentStatus"
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
            >
              {PAYMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
            <Button
              type="button"
              size="sm"
              isLoading={savingField === "payment"}
              onClick={() =>
                save("payment", () =>
                  apiFetch(`/api/payments/${orderId}`, {
                    method: "PATCH",
                    body: JSON.stringify({ status: paymentStatus }),
                  }),
                )
              }
            >
              Save
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
