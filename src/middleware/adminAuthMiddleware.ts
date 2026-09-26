import { getAdminToken } from "@/lib/tokens";
import { redirect } from "@tanstack/react-router";

export const adminAuthMiddleware = async (pathname: string): Promise<void> => {
    if (!getAdminToken()) {
        throw redirect({
            to: "/auth/login",
            search: { redirect: pathname },
        });
    }
};
