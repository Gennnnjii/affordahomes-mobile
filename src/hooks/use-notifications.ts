import { agentPortalApi } from "@/db/api/agent.portal.api";
import { clientPortalApi } from "@/db/api/client.portal.api";
import type {
    NotificationListData,
    NotificationMarkAllReadData,
    NotificationMarkReadData,
    NotificationRole,
    NotificationUnreadCountData,
} from "@/types/notification";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type ApiSuccess<T> = { status: true; message: string; data: T };

type NotificationApi = {
    notifications: (page?: number, perPage?: number) => Promise<ApiSuccess<NotificationListData>>;
    notificationUnreadCount: () => Promise<ApiSuccess<NotificationUnreadCountData>>;
    markNotificationRead: (
        notificationId: string,
    ) => Promise<ApiSuccess<NotificationMarkReadData>>;
    markAllNotificationsRead: () => Promise<ApiSuccess<NotificationMarkAllReadData>>;
};

const notificationKeys = {
    all: (role: NotificationRole) => [role, "notifications"] as const,
    list: (role: NotificationRole) => [...notificationKeys.all(role), "list"] as const,
    unreadCount: (role: NotificationRole) =>
        [...notificationKeys.all(role), "unread-count"] as const,
};

const apiForRole = (role: NotificationRole): NotificationApi =>
    role === "client" ? clientPortalApi : agentPortalApi;

export const useNotifications = (role: NotificationRole, listEnabled: boolean) => {
    const queryClient = useQueryClient();
    const api = apiForRole(role);

    const unreadCountQuery = useQuery({
        queryKey: notificationKeys.unreadCount(role),
        queryFn: () => api.notificationUnreadCount(),
        staleTime: 15_000,
        refetchInterval: 45_000,
        retry: 1,
    });

    const notificationsQuery = useQuery({
        queryKey: notificationKeys.list(role),
        queryFn: () => api.notifications(1, 20),
        enabled: listEnabled,
        staleTime: 15_000,
        retry: 1,
    });

    const refreshNotificationState = async () => {
        await Promise.all([
            queryClient.invalidateQueries({ queryKey: notificationKeys.list(role) }),
            queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount(role) }),
        ]);
    };

    const markReadMutation = useMutation({
        mutationKey: [...notificationKeys.all(role), "mark-read"],
        mutationFn: (notificationId: string) => api.markNotificationRead(notificationId),
        onSuccess: refreshNotificationState,
    });

    const markAllReadMutation = useMutation({
        mutationKey: [...notificationKeys.all(role), "mark-all-read"],
        mutationFn: () => api.markAllNotificationsRead(),
        onSuccess: refreshNotificationState,
    });

    return {
        unreadCountQuery,
        notificationsQuery,
        markReadMutation,
        markAllReadMutation,
    };
};
