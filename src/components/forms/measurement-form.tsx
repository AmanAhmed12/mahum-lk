"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Textarea } from "@/components/ui/input";
import { apiJson } from "@/lib/api/client";
import { measurementSchema, type MeasurementInput } from "@/lib/validators/orders";

export interface MeasurementRecord extends MeasurementInput {
  id: string;
}

interface MeasurementFormProps {
  initialValues?: MeasurementRecord;
  onSuccess: (measurement: MeasurementRecord) => void;
  onCancel?: () => void;
}

const FIELDS: Array<{ name: keyof MeasurementInput; label: string }> = [
  { name: "heightCm", label: "Height (cm)" },
  { name: "chestCm", label: "Chest (cm)" },
  { name: "waistCm", label: "Waist (cm)" },
  { name: "hipCm", label: "Hip (cm)" },
  { name: "shoulderCm", label: "Shoulder (cm)" },
  { name: "sleeveLengthCm", label: "Sleeve Length (cm)" },
  { name: "inseamCm", label: "Inseam (cm)" },
];

export function MeasurementForm({ initialValues, onSuccess, onCancel }: MeasurementFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MeasurementInput>({
    resolver: zodResolver(measurementSchema),
    defaultValues: initialValues ?? { label: "" },
  });

  async function onSubmit(values: MeasurementInput) {
    try {
      const measurement = initialValues
        ? await apiJson<{ measurement: MeasurementRecord }>(`/api/measurements/${initialValues.id}`, {
            method: "PATCH",
            body: JSON.stringify(values),
          }).then((d) => d.measurement)
        : await apiJson<{ measurement: MeasurementRecord }>("/api/measurements", {
            method: "POST",
            body: JSON.stringify(values),
          }).then((d) => d.measurement);

      toast.success(initialValues ? "Measurement profile updated." : "Measurement profile saved.");
      onSuccess(measurement);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save measurement profile.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="label">Profile Name</Label>
        <Input id="label" placeholder="e.g. My Shirt Measurements" {...register("label")} />
        <FieldError message={errors.label?.message} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {FIELDS.map((field) => (
          <div key={field.name}>
            <Label htmlFor={field.name}>{field.label}</Label>
            <Input
              id={field.name}
              type="number"
              step="0.1"
              {...register(field.name, {
                setValueAs: (value) => (value === "" || value === null ? undefined : Number(value)),
              })}
            />
          </div>
        ))}
      </div>

      <div>
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea id="notes" {...register("notes")} />
      </div>

      <div className="flex gap-2">
        <Button type="submit" isLoading={isSubmitting}>
          {initialValues ? "Save Changes" : "Save Measurement Profile"}
        </Button>
        {onCancel ? (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}
