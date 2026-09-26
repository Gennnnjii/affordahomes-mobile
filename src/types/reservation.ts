export type ReservationStatus = "active" | "cancelled" | "sold";

export interface CreateReservationPayload {
  inquiry_id: string;
  property_id?: string;
  remarks?: string;
}

export interface CancelReservationPayload {
  reason: string;
}

export interface Reservation {
  id: string;
  property_id: string | null;
  inventory_lot_id: string | null;
  agreed_price: string | null;
  client_id: string;
  agent_id: string;
  inquiry_id: string;
  status: ReservationStatus;
  remarks: string | null;
  reserved_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  sold_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  property?: Record<string, unknown> | null;
  client?: Record<string, unknown> | null;
  agent?: Record<string, unknown> | null;
  inquiry?: Record<string, unknown> | null;
}
