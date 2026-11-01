import Link from "next/link";
import { Mail, MapPin, Phone, Scissors, Share2 } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border-muted bg-surface-muted">
      <div className="container-page grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-serif text-lg font-bold text-brand-700">
            <Scissors className="h-5 w-5" />
            Mahum.lk
          </div>
          <p className="mt-3 text-sm text-neutral-600">
            Tailoring, fashion accessories and upscale goods — now with online ordering,
            customisation requests and order tracking.
          </p>
          <div className="mt-4 flex items-center gap-2 text-sm text-neutral-500">
            <Share2 className="h-4 w-4" /> Follow us on social media
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground">Shop</h3>
          <ul className="mt-3 space-y-2 text-sm text-neutral-600">
            <li><Link href="/shop" className="hover:text-brand-700">All Products</Link></li>
            <li><Link href="/services" className="hover:text-brand-700">Tailoring Services</Link></li>
            <li><Link href="/services/request" className="hover:text-brand-700">Request Customisation</Link></li>
            <li><Link href="/cart" className="hover:text-brand-700">Cart</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground">Company</h3>
          <ul className="mt-3 space-y-2 text-sm text-neutral-600">
            <li><Link href="/about" className="hover:text-brand-700">About Us</Link></li>
            <li><Link href="/stores" className="hover:text-brand-700">Our Stores</Link></li>
            <li><Link href="/contact" className="hover:text-brand-700">Contact Us</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground">Get in touch</h3>
          <ul className="mt-3 space-y-2 text-sm text-neutral-600">
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0" /> 123 Main Street, Colombo, Sri Lanka
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0" /> +94 11 234 5678
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0" /> hello@mahum.lk
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border-muted py-4 text-center text-xs text-neutral-500">
        © {new Date().getFullYear()} Mahum.lk. All rights reserved.
      </div>
    </footer>
  );
}
