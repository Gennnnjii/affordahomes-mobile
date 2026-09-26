export type NotificationRole = "client" | "agent";

export type PortalNotification = {
    id: string;
    kind: string;
    title: string;
    message: string;
    action_path: string | null;
    created_at: string | null;
    read_at: string | null;
};

export type NotificationPagination = {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
};

export type NotificationListData = {
    notifications: PortalNotification[];
    pagination: NotificationPagination;
};

export type NotificationUnreadCountData = {
    unread_count: number;
};

export type NotificationMarkReadData = {
    notification: PortalNotification;
    unread_count: number;
};

export type NotificationMarkAllReadData = {
    marked_read: number;
    unread_count: number;
};
