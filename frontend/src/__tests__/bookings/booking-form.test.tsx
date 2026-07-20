import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/lib/api", () => ({
  api: { post: vi.fn(), get: vi.fn() },
}));

import { api } from "@/lib/api";
import { saveSession, clearSession } from "@/lib/auth";
import { BookingForm } from "@/components/bookings/booking-form";

function axiosError(detail: string) {
  return { isAxiosError: true, response: { data: { detail } } };
}

describe("BookingForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearSession();
  });

  it("prompts to log in when the visitor is not authenticated", () => {
    render(<BookingForm providerId={1} />);
    expect(screen.getByText(/log in as a customer to book/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Request booking" })).not.toBeInTheDocument();
  });

  it("blocks provider accounts from booking themselves", () => {
    saveSession("tok123", "PROVIDER");
    render(<BookingForm providerId={1} />);
    expect(screen.getByText(/only customer accounts can book services/i)).toBeInTheDocument();
  });

  it("shows the booking form for a logged-in customer, defaulting to Cash", () => {
    saveSession("tok123", "CUSTOMER");
    render(<BookingForm providerId={1} />);

    expect(screen.getByRole("button", { name: "Request booking" })).toBeInTheDocument();
    const cashOption = screen.getByRole("button", { name: /cash/i });
    expect(cashOption.className).toMatch(/border-primary/);
  });

  it("switches the selected payment method and shows the demo disclaimer", async () => {
    saveSession("tok123", "CUSTOMER");
    const user = userEvent.setup();
    render(<BookingForm providerId={1} />);

    expect(screen.queryByText(/no real payment gateway/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /pay online \(demo\)/i }));

    expect(screen.getByText(/no real payment gateway is connected/i)).toBeInTheDocument();
  });

  it("submits the booking with the selected payment method", async () => {
    saveSession("tok123", "CUSTOMER");
    vi.mocked(api.post).mockResolvedValueOnce({ data: { id: 1 } });
    const user = userEvent.setup();
    render(<BookingForm providerId={7} />);

    await user.click(screen.getByRole("button", { name: /pay online \(demo\)/i }));
    await user.type(screen.getByLabelText("Date"), "2026-09-01");
    await user.type(screen.getByLabelText("Time"), "10:00");
    await user.type(screen.getByLabelText("Service address"), "House 12, Gulberg, Lahore");
    await user.click(screen.getByRole("button", { name: "Request booking" }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/bookings", {
        provider_id: 7,
        date: "2026-09-01",
        time: "10:00:00",
        address: "House 12, Gulberg, Lahore",
        notes: undefined,
        payment_method: "DEMO_ONLINE",
      });
    });
    expect(await screen.findByText(/booking requested/i)).toBeInTheDocument();
  });

  it("requires a service address before submitting", async () => {
    saveSession("tok123", "CUSTOMER");
    const user = userEvent.setup();
    render(<BookingForm providerId={1} />);

    await user.type(screen.getByLabelText("Date"), "2026-09-01");
    await user.type(screen.getByLabelText("Time"), "10:00");
    await user.click(screen.getByRole("button", { name: "Request booking" }));

    expect(await screen.findByText(/enter the service address/i)).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it("shows the server's conflict error on a double-booked slot", async () => {
    saveSession("tok123", "CUSTOMER");
    vi.mocked(api.post).mockRejectedValueOnce(axiosError("Selected time slot is not available"));
    const user = userEvent.setup();
    render(<BookingForm providerId={1} />);

    await user.type(screen.getByLabelText("Date"), "2026-09-01");
    await user.type(screen.getByLabelText("Time"), "10:00");
    await user.type(screen.getByLabelText("Service address"), "Somewhere");
    await user.click(screen.getByRole("button", { name: "Request booking" }));

    expect(await screen.findByText("Selected time slot is not available")).toBeInTheDocument();
  });
});
