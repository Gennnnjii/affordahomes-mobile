import Cookies from "js-cookie";

const clientName = () =>
    import.meta.env.VITE_CLIENT_TOKEN_NAME || import.meta.env.VITE_TOKEN_NAME;
const agentName = () => import.meta.env.VITE_AGENT_TOKEN_NAME || "fiesta_agent_token";
const adminName = () => import.meta.env.VITE_ADMIN_TOKEN_NAME || "fiesta_admin_token";
const activeRoleName = () => "fiesta_active_role";

export type ActiveRole = "client" | "agent" | "admin";

const read = (name: string) => {
    if (typeof window === "undefined") return null;
    return Cookies.get(name) ?? null;
};

const write = (name: string, token: string) => {
    Cookies.set(name, token, { expires: 30, sameSite: "lax" });
};

const remove = (name: string) => {
    Cookies.remove(name);
};

export const getClientToken = () => read(clientName());
export const setClientToken = (token: string) => write(clientName(), token);
export const clearClientToken = () => remove(clientName());

export const getAgentToken = () => read(agentName());
export const setAgentToken = (token: string) => write(agentName(), token);
export const clearAgentToken = () => remove(agentName());

export const getAdminToken = () => read(adminName());
export const setAdminToken = (token: string) => write(adminName(), token);
export const clearAdminToken = () => remove(adminName());

export const getActiveRole = (): ActiveRole | null => {
    const role = read(activeRoleName());
    return role === "client" || role === "agent" || role === "admin" ? role : null;
};
export const setActiveRole = (role: ActiveRole) => write(activeRoleName(), role);
export const clearActiveRole = () => remove(activeRoleName());
