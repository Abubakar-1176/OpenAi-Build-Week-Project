import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/lib/api", () => ({
  api: { post: vi.fn(), get: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

import { api } from "@/lib/api";
import { BookingCard } from "@/components/bookings/booking-card";
import type { Booking } from "@/types";

function makeBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: 1,
    customer_id: 1,
    provider_id: 1,
    booking_date: "2026-09-01",
    booking_time: "10:00:00",
    address: "House 12, Gulberg",
    notes: null,
    status: "PENDING",
    payment_status: "PENDING",
    payment_method: "CASH",
    created_at: "2026-07-01T00:00:00Z",
    updated_at: "2026-07-01T00:00:00Z",
    ...overrides,
  };
}

describe("BookingCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows Accept/Reject to a provider on a pending booking", () => {
    render(<BookingCard booking={makeBooking()} viewerRole="PROVIDER" onChanged={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Accept" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reject" })).toBeInTheDocument();
  });

  it("does not show Accept/Reject to a customer", () => {
    render(<BookingCard booking={makeBooking()} viewerRole="CUSTOMER" onChanged={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Accept" })).not.toBeInTheDocument();
  });

  it("shows Mark completed to a provider only once accepted", () => {
    render(
      <BookingCard booking={makeBooking({ status: "ACCEPTED" })} viewerRole="PROVIDER" onChanged={vi.fn()} />
    );
    expect(screen.getByRole("button", { name: "Mark completed" })).toBeInTheDocument();
  });

  it("shows a review button to the customer once completed, and calls onReview", async () => {
    const onReview = vi.fn();
    const user = userEvent.setup();
    render(
      <BookingCard
        booking={makeBooking({ status: "COMPLETED" })}
        viewerRole="CUSTOMER"
        onChanged={vi.fn()}
        onReview={onReview}
      />
    );
    await user.click(screen.getByRole("button", { name: "Leave a review" }));
    expect(onReview).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
  });

  it("hides Cancel once a booking is completed", () => {
    render(
      <BookingCard booking={makeBooking({ status: "COMPLETED" })} viewerRole="CUSTOMER" onChanged={vi.fn()} />
    );
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
  });

  it("shows Cancel while a booking is still pending", () => {
    render(<BookingCard booking={makeBooking()} viewerRole="CUSTOMER" onChanged={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("calls PUT /bookings/{id}/accept and refreshes on accept", async () => {
    vi.mocked(api.put).mockResolvedValueOnce({ data: {} });
    const onChanged = vi.fn();
    const user = userEvent.setup();
    render(<BookingCard booking={makeBooking()} viewerRole="PROVIDER" onChanged={onChanged} />);

    await user.click(screen.getByRole("button", { name: "Accept" }));

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith("/bookings/1/accept");
      expect(onChanged).toHaveBeenCalled();
    });
  });

  it("calls DELETE /bookings/{id} on cancel", async () => {
    vi.mocked(api.delete).mockResolvedValueOnce({ data: {} });
    const onChanged = vi.fn();
    const user = userEvent.setup();
    render(<BookingCard booking={makeBooking()} viewerRole="CUSTOMER" onChanged={onChanged} />);

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith("/bookings/1");
      expect(onChanged).toHaveBeenCalled();
    });
  });

  it("surfaces the server error message if an action fails", async () => {
    vi.mocked(api.put).mockRejectedValueOnce({
      isAxiosError: true,
      response: { data: { detail: "Cannot accept a booking that is ACCEPTED" } },
    });
    const user = userEvent.setup();
    render(<BookingCard booking={makeBooking()} viewerRole="PROVIDER" onChanged={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Accept" }));

    expect(await screen.findByText("Cannot accept a booking that is ACCEPTED")).toBeInTheDocument();
  });

  it("displays the payment method and status", () => {
    render(
      <BookingCard
        booking={makeBooking({ payment_method: "DEMO_ONLINE", payment_status: "PAID" })}
        viewerRole="CUSTOMER"
        onChanged={vi.fn()}
      />
    );
    expect(screen.getByText("Online (demo)")).toBeInTheDocument();
    expect(screen.getByText("Paid")).toBeInTheDocument();
  });

  it("labels a cash booking correctly", () => {
    render(<BookingCard booking={makeBooking()} viewerRole="CUSTOMER" onChanged={vi.fn()} />);
    expect(screen.getByText("Cash")).toBeInTheDocument();
    expect(screen.getByText("Payment pending")).toBeInTheDocument();
  });
});
