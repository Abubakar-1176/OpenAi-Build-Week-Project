import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

export function StarRating({
  rating,
  size = "sm",
  showValue = true,
}: {
  rating: number;
  size?: "sm" | "md";
  showValue?: boolean;
}) {
  const dims = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";
  const rounded = Math.round(rating);

  return (
    <span className="inline-flex items-center gap-1">
      <span className="flex items-center">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn(dims, i < rounded ? "fill-accent text-accent" : "fill-none text-border")}
          />
        ))}
      </span>
      {showValue && (
        <span className="font-tabular text-xs text-muted">{rating > 0 ? rating.toFixed(1) : "New"}</span>
      )}
    </span>
  );
}
