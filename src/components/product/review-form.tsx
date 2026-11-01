"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { apiJson } from "@/lib/api/client";

export function ReviewForm({ productId }: { productId: string }) {
  const router = useRouter();
  const [rating, setRating] = React.useState(5);
  const [comment, setComment] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await apiJson("/api/reviews", {
        method: "POST",
        body: JSON.stringify({ productId, rating, comment }),
      });
      toast.success("Thanks for your review!");
      setComment("");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not submit review.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-border-muted p-4">
      <p className="text-sm font-medium text-foreground">Write a review</p>
      <div className="mt-2 flex gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            type="button"
            key={value}
            onClick={() => setRating(value)}
            aria-label={`${value} star`}
            className="p-0.5"
          >
            <Star
              className={`h-5 w-5 ${value <= rating ? "fill-amber-400 text-amber-400" : "text-neutral-300"}`}
            />
          </button>
        ))}
      </div>
      <Textarea
        className="mt-2"
        placeholder="Share your experience with this product..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <Button type="submit" size="sm" className="mt-3" isLoading={isSubmitting}>
        Submit Review
      </Button>
      <p className="mt-2 text-xs text-neutral-500">
        You can review a product after it has been delivered to you.
      </p>
    </form>
  );
}
