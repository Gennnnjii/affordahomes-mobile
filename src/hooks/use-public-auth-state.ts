import { useAdminAuth } from "@/db/queries/useAdminAuth";
import { useAgentAuth } from "@/db/queries/useAgentAuth";
import { useAuth } from "@/db/queries/useAuth";
import {
    getActiveRole,
    getAdminToken,
    getAgentToken,
    getClientToken,
    setActiveRole,
    type ActiveRole,
} from "@/lib/tokens";
import { useEffect } from "react";

export const usePublicAuthState = () => {
    const activeRole = getActiveRole();
    const clientHasToken = Boolean(getClientToken());
    const agentHasToken = Boolean(getAgentToken());
    const adminHasToken = Boolean(getAdminToken());

    const clientAuth = useAuth();
    const agentAuth = useAgentAuth();
    const adminAuth = useAdminAuth();

    const roleSessions = [
        {
            role: "client" as const,
            hasToken: clientHasToken,
            isValid: clientHasToken && clientAuth.sessionQuery.isSuccess,
            isFetching: clientHasToken && clientAuth.sessionQuery.isFetching,
        },
        {
            role: "agent" as const,
            hasToken: agentHasToken,
            isValid: agentHasToken && agentAuth.sessionQuery.isSuccess,
            isFetching: agentHasToken && agentAuth.sessionQuery.isFetching,
        },
        {
            role: "admin" as const,
            hasToken: adminHasToken,
            isValid: adminHasToken && adminAuth.sessionQuery.isSuccess,
            isFetching: adminHasToken && adminAuth.sessionQuery.isFetching,
        },
    ];

    const validRoles = roleSessions
        .filter((session) => session.isValid)
        .map((session) => session.role);
    const isCheckingRole = roleSessions.some((session) => session.isFetching);
    const activeRoleIsValid = activeRole !== null && validRoles.includes(activeRole);

    let resolvedRole: ActiveRole | null = null;
    if (activeRoleIsValid) {
        resolvedRole = activeRole;
    } else if (!isCheckingRole && validRoles.length === 1) {
        resolvedRole = validRoles[0] ?? null;
    }

    useEffect(() => {
        if (resolvedRole && resolvedRole !== activeRole) {
            setActiveRole(resolvedRole);
        }
    }, [activeRole, resolvedRole]);

    return {
        resolvedRole,
        hasAuthenticatedSession: validRoles.length > 0,
        isCheckingRole,
        hasAmbiguousRoles:
            !isCheckingRole && resolvedRole === null && validRoles.length > 1,
        clientAuth,
        agentAuth,
        adminAuth,
    };
};
