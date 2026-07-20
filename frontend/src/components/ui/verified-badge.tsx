import { cn } from "@/lib/utils";

export function VerifiedBadge({
  size = "md",
  className,
}: {
  size?: "sm" | "md";
  className?: string;
}) {
  const dims = size === "sm" ? "h-5 w-5" : "h-6 w-6";
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-accent ring-2 ring-primary ring-offset-2 ring-offset-card",
        dims,
        className
      )}
      title="Verified provider"
      aria-label="Verified provider"
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-[55%] w-[55%]" aria-hidden="true">
        <path
          d="M5 13l4 4L19 7"
          stroke="white"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
