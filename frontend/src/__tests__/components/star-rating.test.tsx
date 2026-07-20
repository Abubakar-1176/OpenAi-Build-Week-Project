import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StarRating } from "@/components/ui/star-rating";

describe("StarRating", () => {
  it("shows the numeric rating by default", () => {
    render(<StarRating rating={4.2} />);
    expect(screen.getByText("4.2")).toBeInTheDocument();
  });

  it("shows 'New' for a zero rating instead of 0.0", () => {
    render(<StarRating rating={0} />);
    expect(screen.getByText("New")).toBeInTheDocument();
  });

  it("hides the numeric value when showValue is false", () => {
    render(<StarRating rating={5} showValue={false} />);
    expect(screen.queryByText("5.0")).not.toBeInTheDocument();
  });

  it("renders exactly 5 star icons regardless of rating", () => {
    const { container } = render(<StarRating rating={3} />);
    const stars = container.querySelectorAll("svg");
    expect(stars).toHaveLength(5);
  });
});
