import { clientApi } from "@/http/clients";
import type { Reservation } from "@/types/reservation";
import type {
    CreateReservationChangeRequestPayload,
    ReservationChangeRequest,
} from "@/types/reservation-change-request";
import type {
    AgentReassignmentRequest,
    CreateAgentReassignmentRequestPayload,
} from "@/types/agent-reassignment-request";
import type {
    CreateReservationCancellationRequestPayload,
    ReservationCancellationRequest,
} from "@/types/reservation-cancellation-request";
import type {
    ClientAppointment,
    ClientInquiry,
    CreateAIInquiryPayload,
    CreateClientAppointmentPayload,
    CreateInquiryPayload,
    UpdateInquiryPreferredLotPayload,
} from "@/types/inquiry-appointment";
import type {
    OpenHouseRegisterPayload,
    OpenHouseRegistration,
} from "@/types/open-house";
import type {
    ClientProfileData,
    UpdateClientProfilePayload,
} from "@/types/client-profile";
import type {
    NotificationListData,
    NotificationMarkAllReadData,
    NotificationMarkReadData,
    NotificationUnreadCountData,
} from "@/types/notification";
import type {
    AccountDeactivationCancelledData,
    AccountDeactivationScheduledData,
} from "@/types/account-deactivation";

type ApiSuccess<T> = { status: true; message: string; data: T };

export type ChangeClientPasswordPayload = {
    current_password: string;
    password: string;
    password_confirmation: string;
};

export type ServedAgentIdentity = {
    id: string;
    first_name: string;
    last_name: string;
    profile_picture: string | null;
    position: string | null;
    location: string | null;
    mobile: string | null;
    email: string | null;
};

export type ClientAgentRating = {
    id: string;
    rating: number;
    comment: string | null;
    created_at: string | null;
};

export type ServedAgentItem = {
    agent: ServedAgentIdentity;
    can_rate: boolean;
    rating: ClientAgentRating | null;
};

export const clientPortalApi = {
    notifications: async (
        page = 1,
        perPage = 20,
    ): Promise<ApiSuccess<NotificationListData>> => {
        const response = await clientApi.get("/user/auth/notifications", {
            params: { page, per_page: perPage },
        });
        return response.data;
    },

    notificationUnreadCount: async (): Promise<ApiSuccess<NotificationUnreadCountData>> => {
        const response = await clientApi.get("/user/auth/notifications/unread-count");
        return response.data;
    },

    markNotificationRead: async (
        notificationId: string,
    ): Promise<ApiSuccess<NotificationMarkReadData>> => {
        const response = await clientApi.patch(
            `/user/auth/notifications/${encodeURIComponent(notificationId)}/read`,
            {},
        );
        return response.data;
    },

    markAllNotificationsRead: async (): Promise<ApiSuccess<NotificationMarkAllReadData>> => {
        const response = await clientApi.patch("/user/auth/notifications/read-all", {});
        return response.data;
    },

    profile: async (): Promise<ApiSuccess<ClientProfileData>> => {
        const response = await clientApi.get("/user/auth/profile");
        return response.data;
    },

    updateProfile: async (
        payload: UpdateClientProfilePayload,
    ): Promise<ApiSuccess<ClientProfileData>> => {
        const response = await clientApi.put("/user/auth/profile", payload);
        return response.data;
    },

    uploadProfilePhoto: async (photo: File): Promise<ApiSuccess<ClientProfileData>> => {
        const formData = new FormData();
        formData.append("photo", photo);

        const response = await clientApi.post("/user/auth/profile/photo", formData);
        return response.data;
    },

    removeProfilePhoto: async (): Promise<ApiSuccess<ClientProfileData>> => {
        const response = await clientApi.delete("/user/auth/profile/photo");
        return response.data;
    },

    changePassword: async (
        payload: ChangeClientPasswordPayload,
    ): Promise<ApiSuccess<unknown>> => {
        const response = await clientApi.put("/user/auth/password", payload);
        return response.data;
    },

    deactivateAccount: async (
        password: string,
    ): Promise<ApiSuccess<AccountDeactivationScheduledData>> => {
        const response = await clientApi.delete("/user/auth/account", {
            data: { password },
        });
        return response.data;
    },

    cancelDeactivationAuthenticated: async (): Promise<
        ApiSuccess<AccountDeactivationCancelledData>
    > => {
        const response = await clientApi.post("/user/auth/cancel-deactivation", {});
        return response.data;
    },

    appointments: async (): Promise<ApiSuccess<ClientAppointment[]>> => {
        const response = await clientApi.get("/user/auth/appointments");
        return response.data;
    },

    appointment: async (id: string): Promise<ApiSuccess<ClientAppointment>> => {
        const response = await clientApi.get(`/user/auth/appointments/${id}`);
        return response.data;
    },

    inquiries: async (): Promise<ApiSuccess<ClientInquiry[]>> => {
        const response = await clientApi.get("/user/auth/inquiries");
        return response.data;
    },

    inquiry: async (id: string): Promise<ApiSuccess<ClientInquiry>> => {
        const response = await clientApi.get(`/user/auth/inquiries/${id}`);
        return response.data;
    },

    createInquiry: async (
        body: CreateInquiryPayload,
    ): Promise<ApiSuccess<ClientInquiry>> => {
        const response = await clientApi.post("/user/auth/inquiries", body);
        return response.data;
    },

    createAIInquiry: async (
        body: CreateAIInquiryPayload,
    ): Promise<ApiSuccess<ClientInquiry>> => {
        const response = await clientApi.post("/user/auth/inquiries/ai-request", body);
        return response.data;
    },

    updateInquiryPreferredLot: async (
        inquiryId: string,
        payload: UpdateInquiryPreferredLotPayload,
    ): Promise<ApiSuccess<ClientInquiry>> => {
        const response = await clientApi.put(
            `/user/auth/inquiries/${inquiryId}/preferred-lot`,
            payload,
        );
        return response.data;
    },

    clearInquiryPreferredLot: async (
        inquiryId: string,
    ): Promise<ApiSuccess<ClientInquiry>> => {
        const response = await clientApi.delete(
            `/user/auth/inquiries/${inquiryId}/preferred-lot`,
        );
        return response.data;
    },

    createAppointment: async (
        body: CreateClientAppointmentPayload,
    ): Promise<ApiSuccess<ClientAppointment>> => {
        const response = await clientApi.post("/user/auth/appointments", body);
        return response.data;
    },

    // Open House
    registerForOpenHouse: async (
        eventId: string,
        payload: OpenHouseRegisterPayload,
    ): Promise<ApiSuccess<OpenHouseRegistration>> => {
        const response = await clientApi.post(
            `/user/auth/open-house/${eventId}/register`,
            payload,
        );
        return response.data;
    },

    openHouseRegistrations: async (): Promise<ApiSuccess<OpenHouseRegistration[]>> => {
        const response = await clientApi.get("/user/auth/open-house/registrations");
        return response.data;
    },

    openHouseRegistration: async (
        registrationId: string,
    ): Promise<ApiSuccess<OpenHouseRegistration>> => {
        const response = await clientApi.get(
            `/user/auth/open-house/registrations/${registrationId}`,
        );
        return response.data;
    },

    slips: async (): Promise<ApiSuccess<unknown[]>> => {
        const response = await clientApi.get("/user/auth/appointment-slips");
        return response.data;
    },

    getOwnPrequalification: async (): Promise<ApiSuccess<unknown>> => {
        const response = await clientApi.get("/user/auth/prequalification");
        return response.data;
    },

    getOwnValidId: async (): Promise<Blob> => {
        const response = await clientApi.get("/user/auth/prequalification", {
            params: { view: "valid_id" },
            responseType: "blob",
        });

        return response.data as Blob;
    },

    upsertPrequalification: async (formData: FormData): Promise<ApiSuccess<unknown>> => {
        const response = await clientApi.post("/user/auth/prequalification", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data;
    },

    servedAgents: async (): Promise<ApiSuccess<ServedAgentItem[]>> => {
        const response = await clientApi.get("/user/auth/served-agents");
        return response.data;
    },

    rateAgent: async (
        agentId: string,
        payload: { rating: number; comment?: string },
    ): Promise<ApiSuccess<ClientAgentRating>> => {
        const response = await clientApi.post(`/user/auth/agents/${agentId}/rating`, payload);
        return response.data;
    },

    getInquiryRating: async (inquiryId: string): Promise<ApiSuccess<unknown | null>> => {
        const response = await clientApi.get(`/user/auth/inquiries/${inquiryId}/rating`);
        return response.data;
    },

    // Reservations
    reservations: async (): Promise<ApiSuccess<Reservation[]>> => {
        const response = await clientApi.get("/user/auth/reservations");
        return response.data;
    },

    reservation: async (id: string): Promise<ApiSuccess<Reservation>> => {
        const response = await clientApi.get(`/user/auth/reservations/${id}`);
        return response.data;
    },

    // Reservation change requests
    reservationChangeRequests: async (): Promise<ApiSuccess<ReservationChangeRequest[]>> => {
        const response = await clientApi.get("/user/auth/reservation-change-requests");
        return response.data;
    },

    reservationChangeRequest: async (id: string): Promise<ApiSuccess<ReservationChangeRequest>> => {
        const response = await clientApi.get(`/user/auth/reservation-change-requests/${id}`);
        return response.data;
    },

    createReservationChangeRequest: async (
        payload: CreateReservationChangeRequestPayload,
    ): Promise<ApiSuccess<ReservationChangeRequest>> => {
        const response = await clientApi.post("/user/auth/reservation-change-requests", payload);
        return response.data;
    },

    cancelReservationChangeRequest: async (id: string): Promise<ApiSuccess<unknown>> => {
        const response = await clientApi.delete(`/user/auth/reservation-change-requests/${id}`);
        return response.data;
    },

    // Agent reassignment requests
    agentReassignmentRequests: async (): Promise<ApiSuccess<AgentReassignmentRequest[]>> => {
        const response = await clientApi.get("/user/auth/agent-reassignment-requests");
        return response.data;
    },

    agentReassignmentRequest: async (id: string): Promise<ApiSuccess<AgentReassignmentRequest>> => {
        const response = await clientApi.get(`/user/auth/agent-reassignment-requests/${id}`);
        return response.data;
    },

    createAgentReassignmentRequest: async (
        payload: CreateAgentReassignmentRequestPayload,
    ): Promise<ApiSuccess<AgentReassignmentRequest>> => {
        const response = await clientApi.post("/user/auth/agent-reassignment-requests", payload);
        return response.data;
    },

    cancelAgentReassignmentRequest: async (id: string): Promise<ApiSuccess<unknown>> => {
        const response = await clientApi.delete(`/user/auth/agent-reassignment-requests/${id}`);
        return response.data;
    },

    // Reservation cancellation requests
    reservationCancellationRequests: async (): Promise<
        ApiSuccess<ReservationCancellationRequest[]>
    > => {
        const response = await clientApi.get("/user/auth/reservation-cancellation-requests");
        return response.data;
    },

    reservationCancellationRequest: async (
        id: string,
    ): Promise<ApiSuccess<ReservationCancellationRequest>> => {
        const response = await clientApi.get(
            `/user/auth/reservation-cancellation-requests/${id}`,
        );
        return response.data;
    },

    createReservationCancellationRequest: async (
        payload: CreateReservationCancellationRequestPayload,
    ): Promise<ApiSuccess<ReservationCancellationRequest>> => {
        const response = await clientApi.post(
            "/user/auth/reservation-cancellation-requests",
            payload,
        );
        return response.data;
    },

    cancelReservationCancellationRequest: async (id: string): Promise<ApiSuccess<unknown>> => {
        const response = await clientApi.delete(
            `/user/auth/reservation-cancellation-requests/${id}`,
        );
        return response.data;
    },
};
