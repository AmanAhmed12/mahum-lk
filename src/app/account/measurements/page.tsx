"use client";

import * as React from "react";
import { Pencil, Plus, Ruler, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { MeasurementForm, type MeasurementRecord } from "@/components/forms/measurement-form";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { PageSpinner } from "@/components/ui/spinner";
import { apiFetch, apiJson } from "@/lib/api/client";

export default function MeasurementsPage() {
  const [measurements, setMeasurements] = React.useState<MeasurementRecord[] | null>(null);
  const [modalState, setModalState] = React.useState<{ mode: "create" | "edit"; record?: MeasurementRecord } | null>(null);

  const load = React.useCallback(() => {
    apiJson<{ measurements: MeasurementRecord[] }>("/api/measurements")
      .then((data) => setMeasurements(data.measurements))
      .catch(() => toast.error("Could not load measurement profiles."));
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this measurement profile?")) return;
    const response = await apiFetch(`/api/measurements/${id}`, { method: "DELETE" });
    if (response.ok) {
      toast.success("Measurement profile deleted.");
      setMeasurements((prev) => prev?.filter((m) => m.id !== id) ?? null);
    } else {
      toast.error("Could not delete measurement profile.");
    }
  }

  if (measurements === null) return <PageSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">My Measurement Profiles</h1>
        <Button onClick={() => setModalState({ mode: "create" })} size="sm">
          <Plus className="h-4 w-4" /> Add Profile
        </Button>
      </div>

      {measurements.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border-muted p-10 text-center text-sm text-neutral-500">
          <Ruler className="mx-auto mb-3 h-8 w-8 text-neutral-300" />
          No measurement profiles yet. Add one to request tailoring services faster.
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {measurements.map((m) => (
            <div key={m.id} className="rounded-xl border border-border-muted p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-foreground">{m.label}</p>
                <div className="flex gap-1">
                  <button
                    onClick={() => setModalState({ mode: "edit", record: m })}
                    className="rounded-md p-1.5 text-neutral-500 hover:bg-surface-muted"
                    aria-label="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="rounded-md p-1.5 text-neutral-500 hover:bg-surface-muted"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <dl className="mt-2 grid grid-cols-2 gap-1 text-xs text-neutral-600">
                {m.heightCm ? <div>Height: {m.heightCm}cm</div> : null}
                {m.chestCm ? <div>Chest: {m.chestCm}cm</div> : null}
                {m.waistCm ? <div>Waist: {m.waistCm}cm</div> : null}
                {m.hipCm ? <div>Hip: {m.hipCm}cm</div> : null}
                {m.shoulderCm ? <div>Shoulder: {m.shoulderCm}cm</div> : null}
                {m.sleeveLengthCm ? <div>Sleeve: {m.sleeveLengthCm}cm</div> : null}
                {m.inseamCm ? <div>Inseam: {m.inseamCm}cm</div> : null}
              </dl>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalState !== null}
        onClose={() => setModalState(null)}
        title={modalState?.mode === "edit" ? "Edit Measurement Profile" : "Add Measurement Profile"}
      >
        <MeasurementForm
          initialValues={modalState?.record}
          onSuccess={(record) => {
            setMeasurements((prev) => {
              if (!prev) return [record];
              const exists = prev.some((m) => m.id === record.id);
              return exists ? prev.map((m) => (m.id === record.id ? record : m)) : [record, ...prev];
            });
            setModalState(null);
          }}
          onCancel={() => setModalState(null)}
        />
      </Modal>
    </div>
  );
}
