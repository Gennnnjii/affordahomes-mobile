import { publicUserApi } from "@/http/clients";
import type { PublicMonthlyLeaderboard, PublicYearlyLeaderboard } from "@/types/leaderboard";
import type { AgentSummary, PropertySummary } from "@/types/reservation-change-request";
import type { OpenHouseEvent } from "@/types/open-house";
import type { ReferralResolutionData } from "@/types/referral";
import type { PampangaLocationCatalog } from "@/types/pampanga-location";
import type { PropertyMapData, PropertyMapParams } from "@/types/property-map";
import type {
    DevelopmentProject,
    InventoryBlock,
    InventoryLot,
    InventoryLotListParams,
    PaginatedInventoryResult,
    PropertyModel,
} from "@/types/inventory";

type ApiSuccess<T> = { status: true; message: string; data: T };

export const publicApi = {
    inventoryProjects: async (): Promise<ApiSuccess<DevelopmentProject[]>> => {
        const response = await publicUserApi.get("/user/inventory/projects");
        return response.data;
    },

    inventoryProject: async (
        projectId: string,
    ): Promise<ApiSuccess<DevelopmentProject>> => {
        const response = await publicUserApi.get(`/user/inventory/projects/${projectId}`);
        return response.data;
    },

    inventoryProjectModels: async (
        projectId: string,
    ): Promise<ApiSuccess<PropertyModel[]>> => {
        const response = await publicUserApi.get(
            `/user/inventory/projects/${projectId}/models`,
        );
        return response.data;
    },

    inventoryModel: async (modelId: string): Promise<ApiSuccess<PropertyModel>> => {
        const response = await publicUserApi.get(`/user/inventory/models/${modelId}`);
        return response.data;
    },

    inventoryProjectBlocks: async (
        projectId: string,
    ): Promise<ApiSuccess<InventoryBlock[]>> => {
        const response = await publicUserApi.get(
            `/user/inventory/projects/${projectId}/blocks`,
        );
        return response.data;
    },

    inventoryBlockLots: async (
        blockId: string,
        params?: InventoryLotListParams,
    ): Promise<ApiSuccess<PaginatedInventoryResult<InventoryLot>>> => {
        const response = await publicUserApi.get(`/user/inventory/blocks/${blockId}/lots`, {
            params,
        });
        return response.data;
    },

    inventoryLot: async (lotId: string): Promise<ApiSuccess<InventoryLot>> => {
        const response = await publicUserApi.get(`/user/inventory/lots/${lotId}`);
        return response.data;
    },

    agents: async (): Promise<ApiSuccess<AgentSummary[]>> => {
        const response = await publicUserApi.get("/user/agents");
        return response.data;
    },

    monthlyLeaderboard: async (): Promise<ApiSuccess<PublicMonthlyLeaderboard>> => {
        const response = await publicUserApi.get("/user/leaderboard/monthly");
        return response.data;
    },

    yearlyLeaderboard: async (): Promise<ApiSuccess<PublicYearlyLeaderboard>> => {
        const response = await publicUserApi.get("/user/leaderboard/yearly");
        return response.data;
    },

    pampangaLocations: async (): Promise<ApiSuccess<PampangaLocationCatalog>> => {
        const response = await publicUserApi.get("/user/locations/pampanga");
        return response.data;
    },

    properties: async (params?: {
        agent_id?: string;
        city_municipality?: string;
        project?: string;
    }): Promise<ApiSuccess<PropertySummary[]>> => {
        const response = await publicUserApi.get("/user/properties", { params });
        return response.data;
    },

    property: async (id: string): Promise<ApiSuccess<PropertySummary>> => {
        const response = await publicUserApi.get(`/user/properties/${id}`);
        return response.data;
    },

    propertyMap: async (
        params?: PropertyMapParams,
    ): Promise<ApiSuccess<PropertyMapData>> => {
        const response = await publicUserApi.get("/user/properties/map", { params });
        return response.data;
    },

    openHouseEvents: async (): Promise<ApiSuccess<OpenHouseEvent[]>> => {
        const response = await publicUserApi.get("/user/open-house");
        return response.data;
    },

    openHouseEvent: async (id: string): Promise<ApiSuccess<OpenHouseEvent>> => {
        const response = await publicUserApi.get(`/user/open-house/${id}`);
        return response.data;
    },

    resolveReferral: async (code: string): Promise<ApiSuccess<ReferralResolutionData>> => {
        const response = await publicUserApi.get(
            `/user/referral/${encodeURIComponent(code)}`,
        );
        return response.data;
    },
};
