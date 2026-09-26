import xior from "xior";
import { getAdminToken, getAgentToken, getClientToken } from "@/lib/tokens";

const baseURL = `${import.meta.env.VITE_BACKEND_BASE_URL}/api/v1`;
const apiKey = import.meta.env.VITE_API_KEY;

const attachKey = (instance: ReturnType<typeof xior.create>) => {
    instance.interceptors.request.use((config) => {
        config.headers["api-key"] = apiKey;
        return config;
    });
    return instance;
};

const stripContentType = (headers: Record<string, unknown>) => {
    for (const key of Object.keys(headers)) {
        if (key.toLowerCase() === "content-type") delete headers[key];
    }
};

const createAuthed = (getToken: () => string | null) => {

    const instance = xior.create({
        baseURL,
    });
    instance.interceptors.request.use((config) => {
        const token = getToken();
        if (token) config.headers.Authorization = `Bearer ${token}`;
        config.headers["api-key"] = apiKey;
        if (config.data instanceof FormData) {
            stripContentType(config.headers as Record<string, unknown>);
        }
        return config;
    });
    return instance;
};

export const publicUserApi = attachKey(
    xior.create({
        baseURL,
    }),
);

export const clientApi = createAuthed(getClientToken);
export const agentApi = createAuthed(getAgentToken);
export const adminApi = createAuthed(getAdminToken);
