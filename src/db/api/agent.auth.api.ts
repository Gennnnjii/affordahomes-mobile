import { agentApi } from "@/http/clients";

type ApiSuccess<T> = { status: true; message: string; data: T };

export type AgentSessionData = {
    id_: string;
    f_: string;
    l_: string;
    e_: string;
};

export type AgentLoginData = AgentSessionData & {
    access_token: string;
    token_type: string;
};

export const agentAuthApi = {
    login: async (body: { email: string; password: string }): Promise<ApiSuccess<AgentLoginData>> => {
        const response = await agentApi.post("/agent/login", body);
        return response.data;
    },

    session: async (): Promise<ApiSuccess<AgentSessionData>> => {
        const response = await agentApi.post("/agent/auth/sessionToken");
        return response.data;
    },

    logout: async (): Promise<ApiSuccess<unknown>> => {
        const response = await agentApi.post("/agent/auth/logout");
        return response.data;
    },
};
