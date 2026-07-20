import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/lib/api", () => ({
  api: { post: vi.fn(), get: vi.fn() },
}));

import { api } from "@/lib/api";
import LoginPage from "@/app/(auth)/login/page";

function axiosError(detail: string) {
  return { isAxiosError: true, response: { data: { detail } } };
}

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows validation errors when submitted empty", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByText("Email is required")).toBeInTheDocument();
    expect(screen.getByText("Password is required")).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it("rejects an invalid email format", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText("Email"), "not-an-email");
    await user.type(screen.getByLabelText("Password"), "somepassword");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByText("Enter a valid email")).toBeInTheDocument();
  });

  it("submits valid credentials to /auth/login", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: { access_token: "tok123", token_type: "bearer", user_role: "CUSTOMER" },
    });
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText("Email"), "ali@example.com");
    await user.type(screen.getByLabelText("Password"), "testpass123");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/auth/login", {
        email: "ali@example.com",
        password: "testpass123",
      });
    });
  });

  it("shows the server's error message on failed login", async () => {
    vi.mocked(api.post).mockRejectedValueOnce(axiosError("Incorrect email or password"));
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText("Email"), "ali@example.com");
    await user.type(screen.getByLabelText("Password"), "wrongpassword");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByText("Incorrect email or password")).toBeInTheDocument();
  });
});
