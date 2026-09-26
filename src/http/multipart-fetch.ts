import { getAdminToken, getAgentToken } from "@/lib/tokens";

const apiV1Url = (path: string) => {
    const base = import.meta.env.VITE_BACKEND_BASE_URL?.replace(/\/$/, "") ?? "";
    const p = path.startsWith("/") ? path : `/${path}`;
    return `${base}/api/v1${p}`;
};



async function sendMultipart(
    method: "POST" | "PUT" | "PATCH",
    path: string,
    formData: FormData,
    getToken: () => string | null,
): Promise<unknown> {
    const token = getToken();
    const headers: Record<string, string> = {
        "api-key": import.meta.env.VITE_API_KEY,
        Accept: "application/json",
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(apiV1Url(path), {
        method,
        body: formData,
        headers,
    });

    let json: unknown;
    try {
        json = await res.json();
    } catch {
        throw { response: { data: { message: "Invalid response from server." } } };
    }

    const body = json as { status?: boolean; message?: string };
    if (!res.ok || body.status === false) {
        throw { response: { data: json } };
    }

    return json;
}

export const postAdminMultipart = (path: string, formData: FormData) =>
    sendMultipart("POST", path, formData, getAdminToken);

export const postAgentMultipart = (path: string, formData: FormData) =>
    sendMultipart("POST", path, formData, getAgentToken);

export const putAdminMultipart = (path: string, formData: FormData) => {
    const spoofedFormData = new FormData();
    formData.forEach((value, key) => spoofedFormData.append(key, value));
    spoofedFormData.set("_method", "PUT");

    return sendMultipart("POST", path, spoofedFormData, getAdminToken);
};
