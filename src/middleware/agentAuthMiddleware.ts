import { getAgentToken } from "@/lib/tokens";
import { redirect } from "@tanstack/react-router";

export const agentAuthMiddleware = async (pathname: string): Promise<void> => {
    if (!getAgentToken()) {
        throw redirect({
            to: "/auth/login",
            search: { redirect: pathname },
        });
    }
};
