import { agentAuthApi } from "../api/agent.auth.api";
import { clearRoleSession, replaceRoleSession } from "@/lib/auth-session-cache";
import { getAgentToken } from "@/lib/tokens";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export const useAgentAuth = () => {
    const queryClient = useQueryClient();

    const sessionQuery = useQuery({
        queryKey: ["agent", "auth", "session"],
        queryFn: () => agentAuthApi.session(),
        enabled: typeof window !== "undefined" && !!getAgentToken(),
        retry: false,
    });

    useEffect(() => {
        if (sessionQuery.isError) {
            clearRoleSession(queryClient, "agent");
        }
    }, [queryClient, sessionQuery.isError]);

    const loginMutation = useMutation({
        mutationKey: ["agent", "auth", "login"],
        mutationFn: agentAuthApi.login,
        onSuccess: (res) => {
            replaceRoleSession(queryClient, "agent", res.data.access_token);
        },
    });

    const logoutMutation = useMutation({
        mutationKey: ["agent", "auth", "logout"],
        mutationFn: agentAuthApi.logout,
        onSettled: () => {
            clearRoleSession(queryClient, "agent");
        },
    });

    return { sessionQuery, loginMutation, logoutMutation };
};
