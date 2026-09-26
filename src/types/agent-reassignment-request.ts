import type { Reservation } from "@/types/reservation";
import type { AgentSummary, ClientSummary } from "@/types/reservation-change-request";

export type AgentReassignmentRequestStatus = "pending" | "approved" | "rejected";

export interface AgentReassignmentRequest {
    id: string;
    reservation_id: string;
    client_id: string;
    old_agent_id: string;
    new_agent_id: string;
    reason: string;
    status: AgentReassignmentRequestStatus;
    admin_remarks?: string | null;
    approved_at?: string | null;
    rejected_at?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    reservation?: Reservation | null;
    client?: ClientSummary | null;
    old_agent?: AgentSummary | null;
    new_agent?: AgentSummary | null;
}

export interface CreateAgentReassignmentRequestPayload {
    reservation_id: string;
    new_agent_id: string;
    reason: string;
}
