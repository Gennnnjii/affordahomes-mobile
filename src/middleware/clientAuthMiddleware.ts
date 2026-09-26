import { getClientToken } from "@/lib/tokens";
import { redirect } from "@tanstack/react-router";

export const clientAuthMiddleware = async (pathname: string): Promise<void> => {
    if (!getClientToken()) {
        throw redirect({
            to: "/auth/login",
            search: { redirect: pathname },
        });
    }
};
