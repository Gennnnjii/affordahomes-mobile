export type OpenHouseEventStatus = "upcoming" | "ongoing" | "completed" | "cancelled";

export type OpenHouseRegistrationStatus = "registered";

export interface OpenHouseEvent {
    id: string;
    title: string;
    project: string | null;
    location: string;
    description: string | null;
    event_date: string;
    start_time: string;
    end_time: string;
    status: OpenHouseEventStatus;
    capacity: number | null;
    registrations_count: number;
    remaining_slots: number | null;
    registration_open: boolean;
}

export interface OpenHouseRegistration {
    id: string;
    event_id: string;
    client_id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    property_interest: string | null;
    remarks: string | null;
    status: OpenHouseRegistrationStatus;
    registered_at: string;
    event?: OpenHouseEvent;
}

export interface OpenHouseRegisterPayload {
    property_interest?: string | null;
    remarks?: string | null;
}

export interface CreateOpenHouseEventPayload {
    title: string;
    project?: string | null;
    location: string;
    description?: string | null;
    event_date: string;
    start_time: string;
    end_time: string;
    status?: OpenHouseEventStatus;
    capacity: number;
}

export interface UpdateOpenHouseEventPayload {
    title?: string;
    project?: string | null;
    location?: string;
    description?: string | null;
    event_date?: string;
    start_time?: string;
    end_time?: string;
    status?: OpenHouseEventStatus;
    capacity?: number;
}
