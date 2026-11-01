"use client";

import * as React from "react";
import { Mail, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      toast.success("Thanks for reaching out! We'll get back to you soon.");
      event.currentTarget.reset();
      setIsSubmitting(false);
    }, 600);
  }

  return (
    <div className="container-page grid gap-10 py-14 lg:grid-cols-2">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Contact Us</h1>
        <p className="mt-3 text-neutral-600">
          Questions about an order, a tailoring request, or our products? Reach out — we&apos;re
          happy to help.
        </p>
        <ul className="mt-6 space-y-3 text-sm text-neutral-600">
          <li className="flex items-center gap-2">
            <MapPin className="h-4 w-4" /> 123 Main Street, Colombo, Sri Lanka
          </li>
          <li className="flex items-center gap-2">
            <Phone className="h-4 w-4" /> +94 11 234 5678
          </li>
          <li className="flex items-center gap-2">
            <Mail className="h-4 w-4" /> hello@mahum.lk
          </li>
        </ul>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border-muted p-5">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div>
          <Label htmlFor="message">Message</Label>
          <Textarea id="message" name="message" required />
        </div>
        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Send Message
        </Button>
      </form>
    </div>
  );
}
