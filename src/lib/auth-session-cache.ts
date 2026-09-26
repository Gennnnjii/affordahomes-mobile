import {
    clearAgentToken,
    clearClientToken,
    setAgentToken,
    setClientToken,
} from "@/lib/tokens";
import type { QueryClient } from "@tanstack/react-query";

export type PrivateQueryRole = "client" | "agent";

const removeRolePrivateQueries = (queryClient: QueryClient, role: PrivateQueryRole) => {
    queryClient.removeQueries({ queryKey: [role] });
};

export const replaceRoleSession = (
    queryClient: QueryClient,
    role: PrivateQueryRole,
    token: string,
) => {
    removeRolePrivateQueries(queryClient, role);

    if (role === "client") {
        setClientToken(token);
    } else {
        setAgentToken(token);
    }
};

export const clearRoleSession = (queryClient: QueryClient, role: PrivateQueryRole) => {
    removeRolePrivateQueries(queryClient, role);

    if (role === "client") {
        clearClientToken();
    } else {
        clearAgentToken();
    }
};
