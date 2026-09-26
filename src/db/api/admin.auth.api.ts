import { adminApi } from "@/http/clients";

type ApiSuccess<T> = { status: true; message: string; data: T };

export type AdminSessionData = {
    id_: string;
    f_: string;
    l_: string;
    e_: string;
};

export type AdminLoginData = AdminSessionData & {
    access_token: string;
    token_type: string;
};

export const adminAuthApi = {
    login: async (body: { email: string; password: string }): Promise<ApiSuccess<AdminLoginData>> => {
        const response = await adminApi.post("/admin/login", body);
        return response.data;
    },

    session: async (): Promise<ApiSuccess<AdminSessionData>> => {
        const response = await adminApi.post("/admin/auth/sessionToken");
        return response.data;
    },

    logout: async (): Promise<ApiSuccess<unknown>> => {
        const response = await adminApi.post("/admin/auth/logout");
        return response.data;
    },
};
