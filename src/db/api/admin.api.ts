import { adminApi } from "@/http/clients";
import { postAdminMultipart, putAdminMultipart } from "@/http/multipart-fetch";

import type {
    ReservationChangeRequest,
    ReservationChangeRequestStatus,
} from "@/types/reservation-change-request";
import type {
    AgentReassignmentRequest,
    AgentReassignmentRequestStatus,
} from "@/types/agent-reassignment-request";
import type {
    ReservationCancellationRequest,
    ReservationCancellationRequestStatus,
} from "@/types/reservation-cancellation-request";
import type {
    MonthlyLeaderboard,
    TopRatedLeaderboard,
    TopReferralsLeaderboard,
    YearlyLeaderboard,
} from "@/types/leaderboard";
import type {
    CreateOpenHouseEventPayload,
    OpenHouseEvent,
    OpenHouseRegistration,
    UpdateOpenHouseEventPayload,
} from "@/types/open-house";
import type { BackupMetadata, BackupRestoreResult } from "@/types/backup";
import type {
    AdminDevelopmentProject,
    AdminInventoryBlock,
    AdminInventoryLot,
    AdminInventoryLotListParams,
    AdminInventoryLotStatusHistoryEntry,
    AdminPropertyModel,
    CreateDevelopmentProjectPayload,
    CreateInventoryBlockPayload,
    CreateInventoryLotPayload,
    CreatePropertyModelPayload,
    InventoryArchiveFilterParams,
    InventoryLotHoldPayload,
    InventoryLotStatusHistoryParams,
    PaginatedInventoryResult,
    UpdateDevelopmentProjectPayload,
    UpdateInventoryBlockPayload,
    UpdateInventoryLotPayload,
    UpdatePropertyModelPayload,
} from "@/types/inventory";

type ApiSuccess<T> = { status: true; message: string; data: T };

export type AdminClientStatistics = {
    total_clients: number;
};

export const adminResourceApi = {
    agents: async (): Promise<ApiSuccess<unknown[]>> => {
        const response = await adminApi.get("/admin/auth/agents");
        return response.data;
    },

    createAgent: async (body: {
        email: string;
        first_name: string;
        last_name: string;
        age: number;
        password: string;
        profile_picture?: File | null;
        position?: string;
        description?: string;
        location?: string;
        mobile?: string;
        employment_type?: string;
        monthly_allowance?: number | null;
        monthly_quota?: number | null;
    }): Promise<ApiSuccess<unknown>> => {
        const { profile_picture, ...fields } = body;
        if (profile_picture) {
            const fd = new FormData();
            Object.entries(fields).forEach(([k, v]) => {
                if (v !== undefined && v !== "") fd.append(k, String(v));
            });
            fd.append("profile_picture", profile_picture);
            return postAdminMultipart("/admin/auth/agents", fd) as Promise<ApiSuccess<unknown>>;
        }
        const response = await adminApi.post("/admin/auth/agents", fields);
        return response.data;
    },

    updateAgent: async (id: string, body: Record<string, unknown>): Promise<ApiSuccess<unknown>> => {
        const response = await adminApi.put(`/admin/auth/agents/${id}`, body);
        return response.data;
    },

    updateAgentPicture: async (id: string, file: File): Promise<ApiSuccess<unknown>> => {
        const fd = new FormData();
        fd.append("profile_picture", file);
        return putAdminMultipart(`/admin/auth/agents/${id}/picture`, fd) as Promise<ApiSuccess<unknown>>;
    },

    clientStatistics: async (): Promise<ApiSuccess<AdminClientStatistics>> => {
        const response = await adminApi.get("/admin/auth/clients");
        return response.data;
    },

    properties: async (): Promise<ApiSuccess<unknown[]>> => {
        const response = await adminApi.get("/admin/auth/properties");
        return response.data;
    },

    createProperty: async (formData: FormData): Promise<ApiSuccess<unknown>> => {
        return postAdminMultipart("/admin/auth/properties", formData) as Promise<ApiSuccess<unknown>>;
    },

    updateProperty: async (id: string, body: Record<string, unknown>): Promise<ApiSuccess<unknown>> => {
        const response = await adminApi.put(`/admin/auth/properties/${id}`, body);
        return response.data;
    },

    deleteProperty: async (id: string): Promise<ApiSuccess<unknown>> => {
        const response = await adminApi.delete(`/admin/auth/properties/${id}`);
        return response.data;
    },

    updatePropertyMainImage: async (propertyId: string, file: File): Promise<ApiSuccess<unknown>> => {
        const fd = new FormData();
        fd.append("main_image", file);
        return postAdminMultipart(`/admin/auth/properties/${propertyId}/main-image`, fd) as Promise<ApiSuccess<unknown>>;
    },

    appendPropertyGallery: async (
        propertyId: string,
        formData: FormData,
    ): Promise<ApiSuccess<unknown>> => {
        return postAdminMultipart(
            `/admin/auth/properties/${propertyId}/gallery`,
            formData,
        ) as Promise<ApiSuccess<unknown>>;
    },

    deletePropertyGalleryImage: async (
        propertyId: string,
        imageId: string,
    ): Promise<ApiSuccess<unknown>> => {
        const response = await adminApi.delete(
            `/admin/auth/properties/${propertyId}/gallery/${imageId}`,
        );
        return response.data;
    },

    // Normalized inventory
    inventoryProjects: async (
        params?: InventoryArchiveFilterParams,
    ): Promise<ApiSuccess<AdminDevelopmentProject[]>> => {
        const response = await adminApi.get("/admin/auth/inventory/projects", { params });
        return response.data;
    },

    inventoryProject: async (
        projectId: string,
    ): Promise<ApiSuccess<AdminDevelopmentProject>> => {
        const response = await adminApi.get(`/admin/auth/inventory/projects/${projectId}`);
        return response.data;
    },

    createInventoryProject: async (
        payload: CreateDevelopmentProjectPayload,
    ): Promise<ApiSuccess<AdminDevelopmentProject>> => {
        const response = await adminApi.post("/admin/auth/inventory/projects", payload);
        return response.data;
    },

    updateInventoryProject: async (
        projectId: string,
        payload: UpdateDevelopmentProjectPayload,
    ): Promise<ApiSuccess<AdminDevelopmentProject>> => {
        const response = await adminApi.put(
            `/admin/auth/inventory/projects/${projectId}`,
            payload,
        );
        return response.data;
    },

    archiveInventoryProject: async (
        projectId: string,
    ): Promise<ApiSuccess<AdminDevelopmentProject>> => {
        const response = await adminApi.post(
            `/admin/auth/inventory/projects/${projectId}/archive`,
            {},
        );
        return response.data;
    },

    inventoryProjectModels: async (
        projectId: string,
        params?: InventoryArchiveFilterParams,
    ): Promise<ApiSuccess<AdminPropertyModel[]>> => {
        const response = await adminApi.get(
            `/admin/auth/inventory/projects/${projectId}/models`,
            { params },
        );
        return response.data;
    },

    inventoryModel: async (modelId: string): Promise<ApiSuccess<AdminPropertyModel>> => {
        const response = await adminApi.get(`/admin/auth/inventory/models/${modelId}`);
        return response.data;
    },

    createInventoryModel: async (
        projectId: string,
        payload: CreatePropertyModelPayload,
    ): Promise<ApiSuccess<AdminPropertyModel>> => {
        const response = await adminApi.post(
            `/admin/auth/inventory/projects/${projectId}/models`,
            payload,
        );
        return response.data;
    },

    updateInventoryModel: async (
        modelId: string,
        payload: UpdatePropertyModelPayload,
    ): Promise<ApiSuccess<AdminPropertyModel>> => {
        const response = await adminApi.put(
            `/admin/auth/inventory/models/${modelId}`,
            payload,
        );
        return response.data;
    },

    archiveInventoryModel: async (
        modelId: string,
    ): Promise<ApiSuccess<AdminPropertyModel>> => {
        const response = await adminApi.post(
            `/admin/auth/inventory/models/${modelId}/archive`,
            {},
        );
        return response.data;
    },

    inventoryProjectBlocks: async (
        projectId: string,
        params?: InventoryArchiveFilterParams,
    ): Promise<ApiSuccess<AdminInventoryBlock[]>> => {
        const response = await adminApi.get(
            `/admin/auth/inventory/projects/${projectId}/blocks`,
            { params },
        );
        return response.data;
    },

    inventoryBlock: async (
        blockId: string,
    ): Promise<ApiSuccess<AdminInventoryBlock>> => {
        const response = await adminApi.get(`/admin/auth/inventory/blocks/${blockId}`);
        return response.data;
    },

    createInventoryBlock: async (
        projectId: string,
        payload: CreateInventoryBlockPayload,
    ): Promise<ApiSuccess<AdminInventoryBlock>> => {
        const response = await adminApi.post(
            `/admin/auth/inventory/projects/${projectId}/blocks`,
            payload,
        );
        return response.data;
    },

    updateInventoryBlock: async (
        blockId: string,
        payload: UpdateInventoryBlockPayload,
    ): Promise<ApiSuccess<AdminInventoryBlock>> => {
        const response = await adminApi.put(
            `/admin/auth/inventory/blocks/${blockId}`,
            payload,
        );
        return response.data;
    },

    archiveInventoryBlock: async (
        blockId: string,
    ): Promise<ApiSuccess<AdminInventoryBlock>> => {
        const response = await adminApi.post(
            `/admin/auth/inventory/blocks/${blockId}/archive`,
            {},
        );
        return response.data;
    },

    inventoryBlockLots: async (
        blockId: string,
        params?: AdminInventoryLotListParams,
    ): Promise<ApiSuccess<PaginatedInventoryResult<AdminInventoryLot>>> => {
        const response = await adminApi.get(
            `/admin/auth/inventory/blocks/${blockId}/lots`,
            { params },
        );
        return response.data;
    },

    inventoryLot: async (lotId: string): Promise<ApiSuccess<AdminInventoryLot>> => {
        const response = await adminApi.get(`/admin/auth/inventory/lots/${lotId}`);
        return response.data;
    },

    createInventoryLot: async (
        blockId: string,
        payload: CreateInventoryLotPayload,
    ): Promise<ApiSuccess<AdminInventoryLot>> => {
        const response = await adminApi.post(
            `/admin/auth/inventory/blocks/${blockId}/lots`,
            payload,
        );
        return response.data;
    },

    updateInventoryLot: async (
        lotId: string,
        payload: UpdateInventoryLotPayload,
    ): Promise<ApiSuccess<AdminInventoryLot>> => {
        const response = await adminApi.put(
            `/admin/auth/inventory/lots/${lotId}`,
            payload,
        );
        return response.data;
    },

    archiveInventoryLot: async (
        lotId: string,
    ): Promise<ApiSuccess<AdminInventoryLot>> => {
        const response = await adminApi.post(
            `/admin/auth/inventory/lots/${lotId}/archive`,
            {},
        );
        return response.data;
    },

    holdInventoryLot: async (
        lotId: string,
        payload: InventoryLotHoldPayload,
    ): Promise<ApiSuccess<AdminInventoryLot>> => {
        const response = await adminApi.post(
            `/admin/auth/inventory/lots/${lotId}/hold`,
            payload,
        );
        return response.data;
    },

    releaseInventoryLot: async (
        lotId: string,
        payload: InventoryLotHoldPayload,
    ): Promise<ApiSuccess<AdminInventoryLot>> => {
        const response = await adminApi.post(
            `/admin/auth/inventory/lots/${lotId}/release`,
            payload,
        );
        return response.data;
    },

    inventoryLotStatusHistory: async (
        lotId: string,
        params?: InventoryLotStatusHistoryParams,
    ): Promise<
        ApiSuccess<PaginatedInventoryResult<AdminInventoryLotStatusHistoryEntry>>
    > => {
        const response = await adminApi.get(
            `/admin/auth/inventory/lots/${lotId}/status-history`,
            { params },
        );
        return response.data;
    },

    // Open House
    openHouseEvents: async (): Promise<ApiSuccess<OpenHouseEvent[]>> => {
        const response = await adminApi.get("/admin/auth/open-house");
        return response.data;
    },

    openHouseEvent: async (id: string): Promise<ApiSuccess<OpenHouseEvent>> => {
        const response = await adminApi.get(`/admin/auth/open-house/${id}`);
        return response.data;
    },

    createOpenHouseEvent: async (
        payload: CreateOpenHouseEventPayload,
    ): Promise<ApiSuccess<OpenHouseEvent>> => {
        const response = await adminApi.post("/admin/auth/open-house", payload);
        return response.data;
    },

    updateOpenHouseEvent: async (
        id: string,
        payload: UpdateOpenHouseEventPayload,
    ): Promise<ApiSuccess<OpenHouseEvent>> => {
        const response = await adminApi.put(`/admin/auth/open-house/${id}`, payload);
        return response.data;
    },

    deleteOpenHouseEvent: async (id: string): Promise<ApiSuccess<unknown>> => {
        const response = await adminApi.delete(`/admin/auth/open-house/${id}`);
        return response.data;
    },

    openHouseRegistrations: async (
        eventId: string,
    ): Promise<ApiSuccess<OpenHouseRegistration[]>> => {
        const response = await adminApi.get(
            `/admin/auth/open-house/${eventId}/registrations`,
        );
        return response.data;
    },

    // Backups
    backups: async (): Promise<ApiSuccess<BackupMetadata[]>> => {
        const response = await adminApi.get("/admin/auth/backups");
        return response.data;
    },

    createBackup: async (): Promise<ApiSuccess<BackupMetadata>> => {
        const response = await adminApi.post("/admin/auth/backups");
        return response.data;
    },

    restoreBackup: async (
        filename: string,
    ): Promise<ApiSuccess<BackupRestoreResult>> => {
        const response = await adminApi.post(
            `/admin/auth/backups/${encodeURIComponent(filename)}/restore`,
            { confirmation: "RESTORE DATABASE" },
        );
        return response.data;
    },

    deleteBackup: async (filename: string): Promise<ApiSuccess<unknown>> => {
        const response = await adminApi.delete(
            `/admin/auth/backups/${encodeURIComponent(filename)}`,
        );
        return response.data;
    },

    appointments: async (): Promise<ApiSuccess<unknown[]>> => {
        const response = await adminApi.get("/admin/auth/appointments");
        return response.data;
    },

    updateAppointmentStatus: async (
        id: string,
        status: "pending" | "confirmed" | "completed" | "cancelled",
    ): Promise<ApiSuccess<unknown>> => {
        const response = await adminApi.put(`/admin/auth/appointments/${id}/status`, { status });
        return response.data;
    },

    agentRequirements: async (agentId: string): Promise<ApiSuccess<unknown>> => {
        const response = await adminApi.get(`/admin/auth/agents/${agentId}/requirements`);
        return response.data;
    },

    upsertAgentRequirements: async (
        agentId: string,
        body: {
            nbi_clearance_url?: string;
            police_clearance_url?: string;
            tin_number_url?: string;
            resume_url?: string;
            cv_url?: string;
            birth_certificate_url?: string;
        },
    ): Promise<ApiSuccess<unknown>> => {
        const response = await adminApi.put(`/admin/auth/agents/${agentId}/requirements`, body);
        return response.data;
    },

    approveAgentDocument: async (
        agentId: string,
        field: string,
    ): Promise<ApiSuccess<unknown>> => {
        const response = await adminApi.post(
            `/admin/auth/agents/${agentId}/requirements/${field}/approve`,
            {},
        );
        return response.data;
    },

    rejectAgentDocument: async (
        agentId: string,
        field: string,
        reason: string,
    ): Promise<ApiSuccess<unknown>> => {
        const response = await adminApi.post(
            `/admin/auth/agents/${agentId}/requirements/${field}/reject`,
            { reason },
        );
        return response.data;
    },

    getAgentRatings: async (agentId: string): Promise<ApiSuccess<unknown>> => {
        const response = await adminApi.get(`/admin/auth/agents/${agentId}/ratings`);
        return response.data;
    },

    // ── Timesheets ────────────────────────────────────────────────────────────

    timesheetReport: async (params: {
        from: string;
        to: string;
        agent_id?: string;
    }): Promise<ApiSuccess<{
        records: unknown[];
        summary: unknown[];
        total_records: number;
        total_minutes: number;
    }>> => {
        const response = await adminApi.get("/admin/auth/timesheets/report", { params });
        return response.data;
    },

    timesheets: async (date?: string): Promise<ApiSuccess<unknown[]>> => {
        const params = date ? { date } : {};
        const response = await adminApi.get("/admin/auth/timesheets", { params });
        return response.data;
    },

    agentTimesheets: async (
        agentId: string,
        from?: string,
        to?: string,
    ): Promise<ApiSuccess<unknown[]>> => {
        const response = await adminApi.get(`/admin/auth/agents/${agentId}/timesheets`, {
            params: { from, to },
        });
        return response.data;
    },

    monthlyLeaderboard: async (): Promise<ApiSuccess<MonthlyLeaderboard>> => {
        const response = await adminApi.get("/admin/auth/leaderboard/monthly");
        return response.data;
    },

    yearlyLeaderboard: async (): Promise<ApiSuccess<YearlyLeaderboard>> => {
        const response = await adminApi.get("/admin/auth/leaderboard/yearly");
        return response.data;
    },

    topRatedLeaderboard: async (): Promise<ApiSuccess<TopRatedLeaderboard>> => {
        const response = await adminApi.get("/admin/auth/leaderboard/top-rated");
        return response.data;
    },

    topReferralsLeaderboard: async (): Promise<ApiSuccess<TopReferralsLeaderboard>> => {
        const response = await adminApi.get("/admin/auth/leaderboard/top-referrals");
        return response.data;
    },

    reservationChangeRequests: async (
        status?: ReservationChangeRequestStatus,
    ): Promise<ApiSuccess<ReservationChangeRequest[]>> => {
        const response = await adminApi.get("/admin/auth/reservation-change-requests", {
            params: status ? { status } : {},
        });
        return response.data;
    },

    approveReservationChangeRequest: async (
        id: string,
        admin_remarks?: string,
    ): Promise<ApiSuccess<ReservationChangeRequest>> => {
        const response = await adminApi.put(
            `/admin/auth/reservation-change-requests/${id}/approve`,
            { admin_remarks: admin_remarks || null },
        );
        return response.data;
    },

    rejectReservationChangeRequest: async (
        id: string,
        admin_remarks: string,
    ): Promise<ApiSuccess<ReservationChangeRequest>> => {
        const response = await adminApi.put(
            `/admin/auth/reservation-change-requests/${id}/reject`,
            { admin_remarks },
        );
        return response.data;
    },

    agentReassignmentRequests: async (
        status?: AgentReassignmentRequestStatus,
    ): Promise<ApiSuccess<AgentReassignmentRequest[]>> => {
        const response = await adminApi.get("/admin/auth/agent-reassignment-requests", {
            params: status ? { status } : {},
        });
        return response.data;
    },

    approveAgentReassignmentRequest: async (
        id: string,
        admin_remarks?: string,
    ): Promise<ApiSuccess<AgentReassignmentRequest>> => {
        const response = await adminApi.put(
            `/admin/auth/agent-reassignment-requests/${id}/approve`,
            { admin_remarks: admin_remarks || null },
        );
        return response.data;
    },

    rejectAgentReassignmentRequest: async (
        id: string,
        admin_remarks: string,
    ): Promise<ApiSuccess<AgentReassignmentRequest>> => {
        const response = await adminApi.put(
            `/admin/auth/agent-reassignment-requests/${id}/reject`,
            { admin_remarks },
        );
        return response.data;
    },

    reservationCancellationRequests: async (
        status?: ReservationCancellationRequestStatus,
    ): Promise<ApiSuccess<ReservationCancellationRequest[]>> => {
        const response = await adminApi.get("/admin/auth/reservation-cancellation-requests", {
            params: status ? { status } : {},
        });
        return response.data;
    },

    reservationCancellationRequest: async (
        id: string,
    ): Promise<ApiSuccess<ReservationCancellationRequest>> => {
        const response = await adminApi.get(
            `/admin/auth/reservation-cancellation-requests/${id}`,
        );
        return response.data;
    },

    approveReservationCancellationRequest: async (
        id: string,
        admin_remarks?: string,
    ): Promise<ApiSuccess<ReservationCancellationRequest>> => {
        const response = await adminApi.put(
            `/admin/auth/reservation-cancellation-requests/${id}/approve`,
            { admin_remarks: admin_remarks || null },
        );
        return response.data;
    },

    rejectReservationCancellationRequest: async (
        id: string,
        admin_remarks: string,
    ): Promise<ApiSuccess<ReservationCancellationRequest>> => {
        const response = await adminApi.put(
            `/admin/auth/reservation-cancellation-requests/${id}/reject`,
            { admin_remarks },
        );
        return response.data;
    },
};
