import type { Reservation } from "@/types/reservation";
import type { ClientSummary } from "@/types/reservation-change-request";

export type ReservationCancellationRequestStatus =
    | "pending"
    | "approved"
    | "rejected";

export interface ReservationCancellationRequest {
    id: string;
    reservation_id: string;
    client_id: string;
    reason: string;
    status: ReservationCancellationRequestStatus;
    acknowledged_at?: string | null;
    admin_remarks?: string | null;
    approved_at?: string | null;
    rejected_at?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    reservation?: Reservation | null;
    client?: ClientSummary | null;
}

export interface CreateReservationCancellationRequestPayload {
    reservation_id: string;
    reason: string;
    acknowledged: true;
}
