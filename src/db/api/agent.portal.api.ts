import { agentApi } from "@/http/clients";
import { postAgentMultipart } from "@/http/multipart-fetch";
import type {
    Reservation,
    CreateReservationPayload,
    CancelReservationPayload,
} from "@/types/reservation";
import type {
    ClientAppointment,
    ClientAppointmentStatus,
    ClientInquiry,
    CreateAgentAppointmentPayload,
    InquiryStatus,
} from "@/types/inquiry-appointment";
import type { AgentReferralData, AgentReferredClient } from "@/types/referral";
import type {
    NotificationListData,
    NotificationMarkAllReadData,
    NotificationMarkReadData,
    NotificationUnreadCountData,
} from "@/types/notification";

type ApiSuccess<T> = { status: true; message: string; data: T };

export type AgentIdentityVerification = {
    client_id: string;
    has_valid_id: boolean;
    identity_verification_status: "pending" | "verified" | "rejected" | null;
    identity_rejection_remarks: string | null;
    identity_submitted_at: string | null;
    identity_verified_at: string | null;
};

export type AgentAttendanceRecord = {
    date: string;
    time_in: string | null;
    time_out: string | null;
    duration_minutes: number | null;
};

export type AgentAttendanceData = {
    state: "not_clocked_in" | "clocked_in" | "clocked_out";
    business_date: string;
    attendance: AgentAttendanceRecord | null;
};

export const agentPortalApi = {
    notifications: async (
        page = 1,
        perPage = 20,
    ): Promise<ApiSuccess<NotificationListData>> => {
        const response = await agentApi.get("/agent/auth/notifications", {
            params: { page, per_page: perPage },
        });
        return response.data;
    },

    notificationUnreadCount: async (): Promise<ApiSuccess<NotificationUnreadCountData>> => {
        const response = await agentApi.get("/agent/auth/notifications/unread-count");
        return response.data;
    },

    markNotificationRead: async (
        notificationId: string,
    ): Promise<ApiSuccess<NotificationMarkReadData>> => {
        const response = await agentApi.patch(
            `/agent/auth/notifications/${encodeURIComponent(notificationId)}/read`,
            {},
        );
        return response.data;
    },

    markAllNotificationsRead: async (): Promise<ApiSuccess<NotificationMarkAllReadData>> => {
        const response = await agentApi.patch("/agent/auth/notifications/read-all", {});
        return response.data;
    },

    getCurrentAttendance: async (): Promise<ApiSuccess<AgentAttendanceData>> => {
        const response = await agentApi.get("/agent/auth/attendance");
        return response.data;
    },

    timeIn: async (): Promise<ApiSuccess<AgentAttendanceData>> => {
        const response = await agentApi.post("/agent/auth/attendance/time-in");
        return response.data;
    },

    timeOut: async (): Promise<ApiSuccess<AgentAttendanceData>> => {
        const response = await agentApi.post("/agent/auth/attendance/time-out");
        return response.data;
    },

    properties: async (): Promise<ApiSuccess<unknown[]>> => {
        const response = await agentApi.get("/agent/auth/properties");
        return response.data;
    },

    property: async (id: string): Promise<ApiSuccess<unknown>> => {
        const response = await agentApi.get(`/agent/auth/properties/${id}`);
        return response.data;
    },

    appointments: async (): Promise<ApiSuccess<ClientAppointment[]>> => {
        const response = await agentApi.get("/agent/auth/appointments");
        return response.data;
    },

    appointment: async (id: string): Promise<ApiSuccess<ClientAppointment>> => {
        const response = await agentApi.get(`/agent/auth/appointments/${id}`);
        return response.data;
    },

    createAppointment: async (
        body: CreateAgentAppointmentPayload,
    ): Promise<ApiSuccess<ClientAppointment>> => {
        const response = await agentApi.post("/agent/auth/appointments", body);
        return response.data;
    },

    updateAppointmentStatus: async (
        id: string,
        status: ClientAppointmentStatus,
    ): Promise<ApiSuccess<ClientAppointment>> => {
        const response = await agentApi.put(`/agent/auth/appointments/${id}/status`, { status });
        return response.data;
    },

    /** Inquiries this agent has already claimed. */
    inquiries: async (): Promise<ApiSuccess<ClientInquiry[]>> => {
        const response = await agentApi.get("/agent/auth/inquiries");
        return response.data;
    },

    /** Open (unclaimed) inquiries visible to all agents. */
    openInquiries: async (): Promise<ApiSuccess<ClientInquiry[]>> => {
        const response = await agentApi.get("/agent/auth/inquiries/open");
        return response.data;
    },

    /** Claim an open inquiry — first come, first served. */
    claimInquiry: async (id: string): Promise<ApiSuccess<ClientInquiry>> => {
        const response = await agentApi.post(`/agent/auth/inquiries/${id}/claim`, {});
        return response.data;
    },

    inquiry: async (id: string): Promise<ApiSuccess<ClientInquiry>> => {
        const response = await agentApi.get(`/agent/auth/inquiries/${id}`);
        return response.data;
    },

    updateInquiryStatus: async (
        id: string,
        status: InquiryStatus,
    ): Promise<ApiSuccess<ClientInquiry>> => {
        const response = await agentApi.put(`/agent/auth/inquiries/${id}/status`, { status });
        return response.data;
    },

    prequalifications: async (): Promise<ApiSuccess<unknown[]>> => {
        const response = await agentApi.get("/agent/auth/prequalifications");
        return response.data;
    },

    prequalification: async (id: string): Promise<ApiSuccess<unknown>> => {
        const response = await agentApi.get(`/agent/auth/prequalifications/${id}`);
        return response.data;
    },

    prequalificationValidId: async (id: string): Promise<Blob> => {
        const response = await agentApi.get(`/agent/auth/prequalifications/${id}/valid-id`, {
            responseType: "blob",
        });
        return response.data as Blob;
    },

    prequalificationIdentityVerification: async (
        id: string,
    ): Promise<ApiSuccess<AgentIdentityVerification>> => {
        const response = await agentApi.get(
            `/agent/auth/prequalifications/${id}/identity-verification`,
        );
        return response.data;
    },

    verifyPrequalificationIdentity: async (
        id: string,
    ): Promise<ApiSuccess<AgentIdentityVerification>> => {
        const response = await agentApi.post(
            `/agent/auth/prequalifications/${id}/identity-verification/verify`,
            {},
        );
        return response.data;
    },

    rejectPrequalificationIdentity: async (
        id: string,
        remarks: string,
    ): Promise<ApiSuccess<AgentIdentityVerification>> => {
        const response = await agentApi.post(
            `/agent/auth/prequalifications/${id}/identity-verification/reject`,
            { remarks },
        );
        return response.data;
    },

    prequalificationByClientId: async (clientId: string): Promise<ApiSuccess<unknown>> => {
        const response = await agentApi.get(`/agent/auth/clients/${clientId}/prequalification`);
        return response.data;
    },

    updatePrequalificationStatus: async (
        id: string,
        status: "pending" | "qualified" | "not_qualified",
    ): Promise<ApiSuccess<unknown>> => {
        const response = await agentApi.put(`/agent/auth/prequalifications/${id}/status`, { status });
        return response.data;
    },

    signSlipAccomplishment: async (id: string): Promise<ApiSuccess<unknown>> => {
        const response = await agentApi.post(`/agent/auth/appointment-slips/${id}/sign-accomplishment`, {});
        return response.data;
    },

    uploadSlipImage: async (id: string, file: File): Promise<ApiSuccess<unknown>> => {
        const fd = new FormData();
        fd.append("slip_image", file);
        const response = await agentApi.post(`/agent/auth/appointment-slips/${id}/upload-image`, fd, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data;
    },

    myDocuments: async (): Promise<ApiSuccess<unknown>> => {
        const response = await agentApi.get("/agent/auth/my-documents");
        return response.data;
    },

    getMyRatingSummary: async (): Promise<ApiSuccess<{
        average: number | null;
        count: number;
        distribution: Record<string, number>;
        recent: unknown[];
    }>> => {
        const response = await agentApi.get("/agent/auth/ratings");
        return response.data;
    },

    referral: async (): Promise<ApiSuccess<AgentReferralData>> => {
        const response = await agentApi.get("/agent/auth/referral");
        return response.data;
    },

    referredClients: async (): Promise<ApiSuccess<AgentReferredClient[]>> => {
        const response = await agentApi.get("/agent/auth/referred-clients");
        return response.data;
    },

    // Reservations
    reservations: async (): Promise<ApiSuccess<Reservation[]>> => {
        const response = await agentApi.get("/agent/auth/reservations");
        return response.data;
    },

    reservation: async (id: string): Promise<ApiSuccess<Reservation>> => {
        const response = await agentApi.get(`/agent/auth/reservations/${id}`);
        return response.data;
    },

    createReservation: async (body: CreateReservationPayload): Promise<ApiSuccess<Reservation>> => {
        const response = await agentApi.post("/agent/auth/reservations", body);
        return response.data;
    },

    cancelReservation: async (id: string, payload: CancelReservationPayload): Promise<ApiSuccess<Reservation>> => {
        const response = await agentApi.post(`/agent/auth/reservations/${id}/cancel`, payload);
        return response.data;
    },

    markReservationAsSold: async (id: string): Promise<ApiSuccess<Reservation>> => {
        const response = await agentApi.put(`/agent/auth/reservations/${id}/sold`, {});
        return response.data;
    },

    uploadDocument: async (
        field: "nbi_clearance" | "police_clearance" | "tin_number" | "resume" | "cv" | "birth_certificate",
        file: File,
    ): Promise<ApiSuccess<unknown>> => {
        const fd = new FormData();
        fd.append("file", file);
        return postAgentMultipart(`/agent/auth/my-documents/${field}`, fd) as Promise<ApiSuccess<unknown>>;
    },
};
