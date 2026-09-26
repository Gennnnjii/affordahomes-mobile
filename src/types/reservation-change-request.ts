import type { Reservation } from "@/types/reservation";

export type ReservationChangeRequestStatus = "pending" | "approved" | "rejected";

export interface AgentSummary {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
    mobile?: string | null;
    profile_picture?: string | null;
}

export interface ClientSummary {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
    phone?: string | null;
}

export interface PropertySummary {
    id: string;
    title?: string | null;
    description?: string | null;
    address?: string | null;
    province?: string | null;
    city_municipality?: string | null;
    project?: string | null;
    property_type?: string | null;
    block?: string | null;
    lot_number?: string | null;
    price?: string | number | null;
    status?: string | null;
    main_image?: string | null;
    agent_id?: string | null;
    client_id?: string | null;
    agent?: AgentSummary | null;
}

export interface ReservationChangeRequest {
    id: string;
    reservation_id: string;
    client_id: string;
    old_property_id: string | null;
    new_property_id: string | null;
    old_inventory_lot_id: string | null;
    new_inventory_lot_id: string | null;
    old_agreed_price: string | null;
    new_agreed_price: string | null;
    reason: string;
    status: ReservationChangeRequestStatus;
    admin_remarks: string | null;
    approved_at: string | null;
    rejected_at: string | null;
    created_at: string | null;
    updated_at: string | null;
    reservation?: Reservation | null;
    client?: ClientSummary | null;
    old_property?: PropertySummary | null;
    new_property?: PropertySummary | null;
}

export type CreateReservationChangeRequestPayload =
    | {
          reservation_id: string;
          new_property_id: string;
          new_inventory_lot_id?: never;
          reason: string;
      }
    | {
          reservation_id: string;
          new_property_id?: never;
          new_inventory_lot_id: string;
          reason: string;
      };
