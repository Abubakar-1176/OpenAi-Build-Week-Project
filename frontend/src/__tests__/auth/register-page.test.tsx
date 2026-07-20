import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/lib/api", () => ({
  api: { post: vi.fn(), get: vi.fn() },
}));

import { api } from "@/lib/api";
import RegisterPage from "@/app/(auth)/register/page";

function axiosError(detail: string) {
  return { isAxiosError: true, response: { data: { detail } } };
}

describe("RegisterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("defaults to the customer role", () => {
    render(<RegisterPage />);
    const customerButton = screen.getByRole("button", { name: /I need a service/i });
    expect(customerButton).toHaveClass("border-primary");
  });

  it("switches role when 'I provide a service' is clicked", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.click(screen.getByRole("button", { name: /I provide a service/i }));
    expect(screen.getByRole("button", { name: /I provide a service/i })).toHaveClass("border-primary");
    expect(screen.getByRole("button", { name: /I need a service/i })).not.toHaveClass("border-primary");
  });

  it("validates required fields", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("Enter your full name")).toBeInTheDocument();
    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
  });

  it("registers then logs in on success, matching the two-step flow the backend expects", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: { id: 1, email: "sara@example.com" } }); // register
    vi.mocked(api.post).mockResolvedValueOnce({
      data: { access_token: "tok456", token_type: "bearer", user_role: "CUSTOMER" },
    }); // login

    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.type(screen.getByLabelText("Full name"), "Sara Malik");
    await user.type(screen.getByLabelText("Email"), "sara@example.com");
    await user.type(screen.getByLabelText("Password"), "testpass123");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(api.post).toHaveBeenNthCalledWith(
        1,
        "/auth/register",
        expect.objectContaining({ name: "Sara Malik", email: "sara@example.com", role: "CUSTOMER" })
      );
    });
    await waitFor(() => {
      expect(api.post).toHaveBeenNthCalledWith(2, "/auth/login", {
        email: "sara@example.com",
        password: "testpass123",
      });
    });
  });

  it("shows a duplicate-email error from the server", async () => {
    vi.mocked(api.post).mockRejectedValueOnce(axiosError("An account with this email already exists"));
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.type(screen.getByLabelText("Full name"), "Dup User");
    await user.type(screen.getByLabelText("Email"), "dup@example.com");
    await user.type(screen.getByLabelText("Password"), "testpass123");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("An account with this email already exists")).toBeInTheDocument();
  });
});
