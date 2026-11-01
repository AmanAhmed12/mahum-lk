import { TailoringRequestForm } from "@/components/forms/tailoring-request-form";

export default function TailoringRequestPage() {
  return (
    <div className="container-page max-w-xl py-10">
      <h1 className="text-2xl font-bold text-foreground">Request a Tailoring Service</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Choose a service, select or add your measurements, and submit your request.
      </p>
      <div className="mt-6">
        <TailoringRequestForm />
      </div>
    </div>
  );
}
