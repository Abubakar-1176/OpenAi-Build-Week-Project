export type UserRole = "CUSTOMER" | "PROVIDER" | "ADMIN";

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface Provider {
  id: number;
  user_id: number;
  category: Category;
  description: string | null;
  experience: number | null;
  hourly_rate: number | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  profile_image: string | null;
  verified: boolean;
  average_rating: number;
  created_at: string;
  provider_name: string | null;
}

export type BookingStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "COMPLETED" | "CANCELLED";
export type PaymentStatus = "PENDING" | "PAID" | "COMPLETED";
export type PaymentMethod = "CASH" | "DEMO_ONLINE";

export interface Booking {
  id: number;
  customer_id: number;
  provider_id: number;
  booking_date: string;
  booking_time: string;
  address: string | null;
  notes: string | null;
  status: BookingStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: number;
  booking_id: number;
  customer_id: number;
  provider_id: number;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface ApiError {
  detail: string | { msg: string }[];
}

export interface Availability {
  id: number;
  provider_id: number;
  day: string;
  start_time: string;
  end_time: string;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}
