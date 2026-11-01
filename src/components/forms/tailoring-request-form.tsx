"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { MeasurementForm, type MeasurementRecord } from "@/components/forms/measurement-form";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { PageSpinner } from "@/components/ui/spinner";
import { apiJson } from "@/lib/api/client";
import { formatCurrency } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

interface ServiceRecord {
  id: string;
  name: string;
  description: string;
  basePrice: string;
}

export function TailoringRequestForm() {
  const router = useRouter();
  const { user, isInitialized } = useAuthStore((s) => ({ user: s.user, isInitialized: s.isInitialized }));

  const [services, setServices] = React.useState<ServiceRecord[]>([]);
  const [measurements, setMeasurements] = React.useState<MeasurementRecord[]>([]);
  const [loadingData, setLoadingData] = React.useState(true);
  const [showNewMeasurement, setShowNewMeasurement] = React.useState(false);

  const [serviceId, setServiceId] = React.useState("");
  const [measurementId, setMeasurementId] = React.useState("");
  const [quantity, setQuantity] = React.useState(1);
  const [address, setAddress] = React.useState("");
  const [city, setCity] = React.useState("");
  const [paymentMethod, setPaymentMethod] = React.useState("COD");
  const [notes, setNotes] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!isInitialized || !user) return;
    Promise.all([
      apiJson<{ services: ServiceRecord[] }>("/api/services"),
      apiJson<{ measurements: MeasurementRecord[] }>("/api/measurements"),
    ])
      .then(([serviceData, measurementData]) => {
        setServices(serviceData.services);
        setMeasurements(measurementData.measurements);
        if (serviceData.services[0]) setServiceId(serviceData.services[0].id);
        if (measurementData.measurements[0]) setMeasurementId(measurementData.measurements[0].id);
      })
      .catch(() => toast.error("Could not load services or measurements."))
      .finally(() => setLoadingData(false));
  }, [isInitialized, user]);

  if (!isInitialized) return <PageSpinner />;

  if (!user) {
    return (
      <div className="container-page py-16 text-center text-sm text-neutral-500">
        Please{" "}
        <a href="/login?from=/services/request" className="text-brand-700 underline">
          log in
        </a>{" "}
        as a customer to request a tailoring service.
      </div>
    );
  }

  if (loadingData) return <PageSpinner />;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!serviceId || !measurementId) {
      toast.error("Please choose a service and a measurement profile.");
      return;
    }
    setIsSubmitting(true);
    try {
      const data = await apiJson<{ order: { id: string } }>("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          type: "TAILORING",
          serviceId,
          measurementId,
          quantity,
          address,
          city,
          paymentMethod,
          notes,
        }),
      });
      toast.success("Tailoring request submitted!");
      router.push(`/account/orders/${data.order.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not submit request.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (services.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border-muted p-10 text-center text-sm text-neutral-500">
        No tailoring services are available right now. Please check back later.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-border-muted p-5">
      <div>
        <Label htmlFor="service">Service</Label>
        <Select id="service" value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name} — {formatCurrency(service.basePrice)}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor="measurement">Measurement Profile</Label>
          <button
            type="button"
            className="text-xs font-medium text-brand-700 hover:underline"
            onClick={() => setShowNewMeasurement((v) => !v)}
          >
            {showNewMeasurement ? "Cancel" : "+ Add new profile"}
          </button>
        </div>
        {measurements.length > 0 ? (
          <Select id="measurement" value={measurementId} onChange={(e) => setMeasurementId(e.target.value)}>
            {measurements.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </Select>
        ) : (
          <p className="text-sm text-neutral-500">
            You have no saved measurement profiles yet. Add one below.
          </p>
        )}
        {showNewMeasurement ? (
          <div className="mt-3 rounded-lg bg-surface-muted p-4">
            <MeasurementForm
              onSuccess={(measurement) => {
                setMeasurements((prev) => [measurement, ...prev]);
                setMeasurementId(measurement.id);
                setShowNewMeasurement(false);
              }}
              onCancel={() => setShowNewMeasurement(false)}
            />
          </div>
        ) : null}
      </div>

      <div>
        <Label htmlFor="quantity">Quantity</Label>
        <Input
          id="quantity"
          type="number"
          min={1}
          max={20}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value) || 1)}
        />
      </div>

      <div>
        <Label htmlFor="address">Delivery / Pickup Address</Label>
        <Textarea id="address" required value={address} onChange={(e) => setAddress(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="city">City</Label>
        <Input id="city" required value={city} onChange={(e) => setCity(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="paymentMethod">Payment Method</Label>
        <Select id="paymentMethod" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
          <option value="COD">Cash on Delivery</option>
          <option value="CARD">Card Payment</option>
          <option value="BANK_TRANSFER">Bank Transfer</option>
        </Select>
      </div>
      <div>
        <Label htmlFor="notes">Notes for the tailor (optional)</Label>
        <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <Button type="submit" className="w-full" isLoading={isSubmitting} disabled={!measurementId}>
        Submit Request
      </Button>
    </form>
  );
}
