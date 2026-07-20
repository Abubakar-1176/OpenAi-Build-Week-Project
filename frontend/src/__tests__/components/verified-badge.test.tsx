import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { VerifiedBadge } from "@/components/ui/verified-badge";

describe("VerifiedBadge", () => {
  it("has an accessible label identifying it as a verified provider marker", () => {
    render(<VerifiedBadge />);
    expect(screen.getByLabelText("Verified provider")).toBeInTheDocument();
  });

  it("renders at the small size with reduced dimensions", () => {
    render(<VerifiedBadge size="sm" />);
    expect(screen.getByLabelText("Verified provider")).toHaveClass("h-5", "w-5");
  });

  it("renders at the default medium size", () => {
    render(<VerifiedBadge />);
    expect(screen.getByLabelText("Verified provider")).toHaveClass("h-6", "w-6");
  });
});
