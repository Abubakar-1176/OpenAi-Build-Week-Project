import { cn } from "@/lib/utils";

type Tone = "neutral" | "primary" | "accent" | "success" | "danger";

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "bg-black/5 text-foreground/70",
  primary: "bg-primary-soft text-primary",
  accent: "bg-accent-soft text-accent",
  success: "bg-success-soft text-success",
  danger: "bg-danger-soft text-danger",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        TONE_CLASSES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

const BOOKING_STATUS_TONE: Record<string, Tone> = {
  PENDING: "accent",
  ACCEPTED: "primary",
  COMPLETED: "success",
  REJECTED: "danger",
  CANCELLED: "neutral",
};

export function BookingStatusBadge({ status }: { status: string }) {
  return <Badge tone={BOOKING_STATUS_TONE[status] ?? "neutral"}>{status}</Badge>;
}

const PAYMENT_STATUS_TONE: Record<string, Tone> = {
  PENDING: "neutral",
  PAID: "primary",
  COMPLETED: "success",
};

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  PENDING: "Payment pending",
  PAID: "Paid",
  COMPLETED: "Payment settled",
};

export function PaymentStatusBadge({ status }: { status: string }) {
  return <Badge tone={PAYMENT_STATUS_TONE[status] ?? "neutral"}>{PAYMENT_STATUS_LABEL[status] ?? status}</Badge>;
}
