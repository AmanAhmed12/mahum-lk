import { MapPin, Phone } from "lucide-react";

const STORES = [
  { name: "Mahum.lk — Colombo", address: "123 Main Street, Colombo 03", phone: "+94 11 234 5678" },
  { name: "Mahum.lk — Kandy", address: "45 Temple Road, Kandy", phone: "+94 81 234 5678" },
];

export default function StoresPage() {
  return (
    <div className="container-page max-w-3xl py-14">
      <h1 className="text-2xl font-bold text-foreground">Our Stores</h1>
      <div className="mt-6 space-y-4">
        {STORES.map((store) => (
          <div key={store.name} className="rounded-xl border border-border-muted p-5">
            <h2 className="font-semibold text-foreground">{store.name}</h2>
            <p className="mt-2 flex items-center gap-2 text-sm text-neutral-600">
              <MapPin className="h-4 w-4" /> {store.address}
            </p>
            <p className="mt-1 flex items-center gap-2 text-sm text-neutral-600">
              <Phone className="h-4 w-4" /> {store.phone}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
