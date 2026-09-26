import { adminAuthApi } from "../api/admin.auth.api";
import { clearAdminToken, getAdminToken, setAdminToken } from "@/lib/tokens";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useAdminAuth = () => {
    const queryClient = useQueryClient();

    const sessionQuery = useQuery({
        queryKey: ["admin", "auth", "session"],
        queryFn: () => adminAuthApi.session(),
        enabled: typeof window !== "undefined" && !!getAdminToken(),
        retry: false,
        staleTime: Infinity,
    });

    const loginMutation = useMutation({
        mutationKey: ["admin", "auth", "login"],
        mutationFn: adminAuthApi.login,
        onSuccess: (res) => {
            setAdminToken(res.data.access_token);
            queryClient.invalidateQueries({ queryKey: ["admin"] });
        },
    });

    const logoutMutation = useMutation({
        mutationKey: ["admin", "auth", "logout"],
        mutationFn: adminAuthApi.logout,
        onSettled: () => {
            clearAdminToken();
            queryClient.removeQueries({ queryKey: ["admin"] });
        },
    });

    return { sessionQuery, loginMutation, logoutMutation };
};
