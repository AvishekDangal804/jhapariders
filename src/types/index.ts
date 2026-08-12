// Shared domain types for JhapaRide.
// Kept in sync with the Postgres enums defined in the Supabase migrations (Phase 3).

export type UserRole = "passenger" | "rider" | "admin";

export type UserStatus = "active" | "suspended" | "deleted";

export type VerificationStatus = "pending" | "approved" | "rejected";

export type VehicleType = "bike" | "car";

export type VehicleStatus = "pending" | "approved" | "rejected" | "suspended";

export type ServiceType = "bike" | "car" | "parcel";

export type RideStatus =
  | "searching"
  | "driver_assigned"
  | "driver_arriving"
  | "driver_arrived"
  | "ride_started"
  | "ride_completed"
  | "payment_pending"
  | "paid"
  | "cancelled"
  | "no_driver_found";

export type PaymentMethod = "cash" | "online" | "wallet";

export type PaymentStatus = "pending" | "success" | "failed" | "refunded";

export type WalletOwnerType = "passenger" | "rider" | "platform";

export type WalletTransactionType =
  | "credit"
  | "debit"
  | "commission"
  | "refund"
  | "withdrawal"
  | "adjustment";

export type WithdrawalStatus =
  | "pending"
  | "approved"
  | "processing"
  | "completed"
  | "rejected";

export type SupportCategory =
  | "ride_problem"
  | "payment_problem"
  | "rider_problem"
  | "passenger_problem"
  | "account_problem"
  | "safety_issue";

export type SupportTicketStatus = "open" | "in_progress" | "resolved" | "closed";

export type ReportTargetType = "rider" | "passenger" | "ride" | "review";

export type CancelledByRole = "passenger" | "rider" | "admin" | "system";

export type NotificationType =
  | "ride_request"
  | "ride_accepted"
  | "rider_arriving"
  | "rider_arrived"
  | "ride_started"
  | "ride_completed"
  | "payment_success"
  | "payment_failed"
  | "rating"
  | "system"
  | "promotion";

export type PlatformStatus = "online" | "maintenance" | "offline";

export type CouponDiscountType = "flat" | "percentage";

export type ReportStatus = "open" | "investigating" | "resolved" | "dismissed";

export type EmergencyStatus = "active" | "acknowledged" | "resolved";

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface Address extends GeoPoint {
  address: string;
}

export interface FareBreakdown {
  serviceType: ServiceType;
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  waitingCharge: number;
  surgeMultiplier: number;
  subtotal: number;
  discount: number;
  total: number;
  currency: "NPR";
}

export interface Ride {
  id: string;
  passengerId: string;
  passengerName: string | null;
  riderId: string | null;
  riderName: string | null;
  serviceType: ServiceType;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  destinationAddress: string;
  destinationLat: number;
  destinationLng: number;
  distanceKm: number | null;
  estimatedDurationMinutes: number | null;
  estimatedFare: number | null;
  finalFare: number | null;
  commissionRate: number | null;
  platformShare: number | null;
  riderShare: number | null;
  status: RideStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  createdAt: string;
  acceptedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
}

export interface Profile {
  id: string;
  role: UserRole;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl: string | null;
  address: string | null;
  status: UserStatus;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}

export interface Rating {
  id: string;
  rideId: string;
  raterId: string;
  rateeId: string;
  stars: number;
  review: string | null;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  category: SupportCategory;
  subject: string;
  description: string;
  status: SupportTicketStatus;
  rideId: string | null;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SupportMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string | null;
  isAdmin: boolean;
  message: string;
  createdAt: string;
}

export interface EmergencyEvent {
  id: string;
  rideId: string;
  userId: string;
  userName: string | null;
  lat: number;
  lng: number;
  description: string | null;
  status: EmergencyStatus;
  createdAt: string;
  resolvedAt: string | null;
}
