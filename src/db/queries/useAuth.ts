import { authApi } from "../api/auth.api";
import { clearRoleSession, replaceRoleSession } from "@/lib/auth-session-cache";
import { getApiErrorData } from "@/lib/api-error";
import { getClientToken } from "@/lib/tokens";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export const useAuth = () => {
    const queryClient = useQueryClient();

    const sessionQuery = useQuery({
        queryKey: ["client", "auth", "session"],
        queryFn: () => authApi.session(),
        enabled: typeof window !== "undefined" && !!getClientToken(),
        retry: false,
    });

    useEffect(() => {
        if (sessionQuery.isError) {
            const code = getApiErrorData(sessionQuery.error)?.code;

            if (code === "ACCOUNT_PENDING_DEACTIVATION") {
                return;
            }

            clearRoleSession(queryClient, "client");
        }
    }, [queryClient, sessionQuery.error, sessionQuery.isError]);

    const loginMutation = useMutation({
        mutationKey: ["client", "auth", "login"],
        mutationFn: authApi.login,
        onSuccess: (res) => {
            replaceRoleSession(queryClient, "client", res.data.access_token);
        },
    });

    const sessionMutation = useMutation({
        mutationKey: ["client", "auth", "session"],
        mutationFn: authApi.session,
    });

    const registerMutation = useMutation({
        mutationKey: ["client", "auth", "register"],
        mutationFn: authApi.register,
    });

    const logoutMutation = useMutation({
        mutationKey: ["client", "auth", "logout"],
        mutationFn: authApi.logout,
        onSettled: () => {
            clearRoleSession(queryClient, "client");
        },
    });

    return {
        sessionQuery,
        loginMutation,
        sessionMutation,
        registerMutation,
        logoutMutation,
    };
};
