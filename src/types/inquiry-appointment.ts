import type {
    AgentSummary,
    ClientSummary,
    PropertySummary,
} from "@/types/reservation-change-request";

export type InquiryStatus = "pending" | "responded" | "closed";
export type ClientAppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface ClientInquiry extends Record<string, unknown> {
    id: string;
    subject: string;
    message: string;
    status: InquiryStatus;
    source: string | null;
    agent_id: string | null;
    client_id: string;
    property_id: string | null;
    property_model_id: string | null;
    preferred_inventory_lot_id: string | null;
    preferred_lot_selected_at: string | null;
    conversation_summary: string | null;
    last_ai_message: string | null;
    created_at: string | null;
    updated_at: string | null;
    agent?: AgentSummary | null;
    client?: ClientSummary | null;
    property?: PropertySummary | null;
}

interface InquiryPayloadBase {
    subject: string;
    message: string;
}

type GenericInquiryTarget = {
    property_id?: never;
    property_model_id?: never;
    preferred_inventory_lot_id?: never;
};

type LegacyInquiryTarget = {
    property_id: string;
    property_model_id?: never;
    preferred_inventory_lot_id?: never;
};

type NormalizedInquiryTarget = {
    property_id?: never;
    property_model_id: string;
    preferred_inventory_lot_id?: string;
};

type InquiryTarget = GenericInquiryTarget | LegacyInquiryTarget | NormalizedInquiryTarget;

export type CreateInquiryPayload = InquiryPayloadBase & InquiryTarget;

export type CreateAIInquiryPayload = InquiryPayloadBase & InquiryTarget & {
    conversation_summary?: string | null;
    last_ai_message?: string | null;
};

export interface UpdateInquiryPreferredLotPayload {
    preferred_inventory_lot_id: string;
}

export interface AppointmentSlipSummary {
    id: string;
    slip_number?: string | null;
    details?: string | null;
    slip_image_url?: string | null;
    request_valid_until?: string | null;
    accomplishment_signed_at?: string | null;
    accomplishment_valid_until?: string | null;
    appointment_id?: string;
    client_id?: string;
    agent_id?: string;
    created_at?: string | null;
    updated_at?: string | null;
}

export interface ClientAppointment extends Record<string, unknown> {
    id: string;
    schedule: string;
    location: string;
    status: ClientAppointmentStatus;
    notes: string | null;
    agent_id: string;
    client_id: string;
    property_id: string | null;
    inquiry_id: string | null;
    development_project_id: string | null;
    property_model_id: string | null;
    inventory_lot_id: string | null;
    created_at: string | null;
    updated_at: string | null;
    agent?: AgentSummary | null;
    client?: ClientSummary | null;
    property?: PropertySummary | null;
    slip?: AppointmentSlipSummary | null;
}

export interface CreateClientAppointmentPayload {
    inquiry_id: string;
    schedule: string;
    location: string;
    notes?: string;
}

export interface CreateAgentAppointmentPayload extends CreateClientAppointmentPayload {
    client_id?: string;
    property_id?: string;
}
