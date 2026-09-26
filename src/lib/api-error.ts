type ApiErrBody = {
    message?: string;
    data?: Record<string, unknown> | Record<string, string[]>;
};

export const getApiErrorMessage = (error: unknown): string => {
    if (!error || typeof error !== "object") {
        return "Something went wrong. Please try again.";
    }

    const err = error as { response?: { data?: ApiErrBody } };
    const msg = err.response?.data?.message;
    if (typeof msg === "string" && msg.length > 0) return msg;
    return "Something went wrong. Please try again.";
};

/** e.g. `{ code: "EMAIL_UNVERIFIED" }` from Laravel `Api::error(..., $data, $code)` */
export const getApiErrorData = (error: unknown): Record<string, unknown> | undefined => {
    if (!error || typeof error !== "object") return undefined;

    const err = error as { response?: { data?: ApiErrBody } };
    const d = err.response?.data?.data;
    return d && typeof d === "object" && !Array.isArray(d) ? (d as Record<string, unknown>) : undefined;
};
