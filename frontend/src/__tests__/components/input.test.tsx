import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input } from "@/components/ui/input";

describe("Input", () => {
  it("renders with a placeholder", () => {
    render(<Input placeholder="you@example.com" />);
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
  });

  it("calls onChange as the user types", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Input placeholder="name" onChange={onChange} />);

    await user.type(screen.getByPlaceholderText("name"), "Ali");
    expect(onChange).toHaveBeenCalledTimes(3); // once per character
  });

  it("applies the error border style when error is true", () => {
    render(<Input placeholder="email" error />);
    expect(screen.getByPlaceholderText("email")).toHaveClass("border-danger");
  });

  it("does not apply the error style by default", () => {
    render(<Input placeholder="email" />);
    expect(screen.getByPlaceholderText("email")).not.toHaveClass("border-danger");
  });
});
