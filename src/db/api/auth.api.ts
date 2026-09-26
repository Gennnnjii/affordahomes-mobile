import { clientApi, publicUserApi } from "@/http/clients";
import type { LoginRequest, RegisterRequest, LoginSuccessData, SessionUserData } from "@/types/app/auth.type";
import type { AccountDeactivationCancelledData } from "@/types/account-deactivation";

type ApiSuccess<T> = {
    status: true;
    message: string;
    data: T;
};

export type UnifiedLoginData = {
    role: "admin" | "agent" | "client";
    id_: string;
    f_: string;
    l_: string;
    e_: string;
    access_token: string;
    token_type: string;
};

/** Agent password was accepted; complete login with OTP from email. */
export type AgentOtpRequiredPayload = {
    login_step: "agent_otp_required";
    challenge_id: string;
};

export type UnifiedLoginPayload = UnifiedLoginData | AgentOtpRequiredPayload;

export const isAgentOtpRequired = (data: UnifiedLoginPayload): data is AgentOtpRequiredPayload =>
    "login_step" in data && data.login_step === "agent_otp_required";

export const authApi = {
    /** Single login endpoint — backend detects admin / agent / client automatically. */
    unifiedLogin: async (data: LoginRequest): Promise<ApiSuccess<UnifiedLoginPayload>> => {
        const response = await publicUserApi.post("/auth/login", data);
        return response.data;
    },

    cancelDeactivationWithCredentials: async (
        data: LoginRequest,
    ): Promise<ApiSuccess<AccountDeactivationCancelledData>> => {
        const response = await publicUserApi.post("/user/cancel-deactivation", data);
        return response.data;
    },

    verifyAgentLoginOtp: async (body: {
        challenge_id: string;
        code: string;
    }): Promise<ApiSuccess<UnifiedLoginData>> => {
        const response = await publicUserApi.post("/auth/login/agent-otp", body);
        return response.data;
    },

    verifyClientEmail: async (body: { client_id: string; token: string }): Promise<ApiSuccess<unknown>> => {
        const response = await publicUserApi.post("/auth/verify-email", body);
        return response.data;
    },

    resendVerificationEmail: async (email: string): Promise<ApiSuccess<unknown>> => {
        const response = await publicUserApi.post("/auth/resend-verification", { email });
        return response.data;
    },

    /**
     * Request a password-reset link to be sent to the given email.
     * Works for both agents and clients.
     */
    forgotPassword: async (email: string): Promise<ApiSuccess<null>> => {
        const response = await publicUserApi.post("/auth/forgot-password", { email });
        return response.data;
    },

    /**
     * Reset the password using the token from the reset-link email.
     */
    resetPassword: async (payload: {
        email: string;
        token: string;
        password: string;
        password_confirmation: string;
    }): Promise<ApiSuccess<null>> => {
        const response = await publicUserApi.post("/auth/reset-password", payload);
        return response.data;
    },

    // Legacy client-only login kept for backwards compatibility
    login: async (data: LoginRequest): Promise<ApiSuccess<LoginSuccessData>> => {
        const response = await clientApi.post("/user/login", data);
        return response.data;
    },

    register: async (data: RegisterRequest): Promise<ApiSuccess<unknown>> => {
        const response = await clientApi.post("/user/register", data);
        return response.data;
    },

    session: async (): Promise<ApiSuccess<SessionUserData>> => {
        const response = await clientApi.post("/user/auth/sessionToken");
        return response.data;
    },

    logout: async (): Promise<ApiSuccess<unknown>> => {
        const response = await clientApi.post("/user/auth/logout");
        return response.data;
    },
};
