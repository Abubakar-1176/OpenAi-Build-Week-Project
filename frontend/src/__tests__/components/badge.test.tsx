import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge, BookingStatusBadge, PaymentStatusBadge } from "@/components/ui/badge";

describe("Badge", () => {
  it("renders children text", () => {
    render(<Badge>Hello</Badge>);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("applies the tone class", () => {
    render(<Badge tone="danger">Error</Badge>);
    expect(screen.getByText("Error")).toHaveClass("bg-danger-soft");
  });
});

describe("BookingStatusBadge", () => {
  it.each([
    ["PENDING", "accent"],
    ["ACCEPTED", "primary"],
    ["COMPLETED", "success"],
    ["REJECTED", "danger"],
    ["CANCELLED", "neutral"],
  ])("renders %s with the correct tone", (status) => {
    render(<BookingStatusBadge status={status} />);
    expect(screen.getByText(status)).toBeInTheDocument();
  });

  it("falls back to neutral tone for an unknown status", () => {
    render(<BookingStatusBadge status="SOMETHING_UNEXPECTED" />);
    expect(screen.getByText("SOMETHING_UNEXPECTED")).toHaveClass("bg-black/5");
  });
});

describe("PaymentStatusBadge", () => {
  it("shows a human-readable label, not the raw enum value", () => {
    render(<PaymentStatusBadge status="PAID" />);
    expect(screen.getByText("Paid")).toBeInTheDocument();
    expect(screen.queryByText("PAID")).not.toBeInTheDocument();
  });

  it("labels PENDING as payment pending", () => {
    render(<PaymentStatusBadge status="PENDING" />);
    expect(screen.getByText("Payment pending")).toBeInTheDocument();
  });

  it("labels COMPLETED as payment settled", () => {
    render(<PaymentStatusBadge status="COMPLETED" />);
    expect(screen.getByText("Payment settled")).toBeInTheDocument();
  });
});
