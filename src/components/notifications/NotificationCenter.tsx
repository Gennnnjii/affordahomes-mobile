import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/use-notifications";
import { getApiErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import type { NotificationRole, PortalNotification } from "@/types/notification";
import { useRouter } from "@tanstack/react-router";
import {
    BellIcon,
    CheckCheckIcon,
    LoaderCircleIcon,
    XIcon,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";

type NotificationCenterProps = {
    role: NotificationRole;
};

const formatTimestamp = (value: string | null): string => {
    if (!value) return "Time unavailable";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Time unavailable";

    return new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
};

const safeInternalActionPath = (value: string | null): string | null => {
    if (!value) return null;

    const path = value.trim();
    const hasControlCharacter = Array.from(path).some((character) => {
        const code = character.charCodeAt(0);
        return code < 32 || code === 127;
    });
    if (
        !path.startsWith("/") ||
        path.startsWith("//") ||
        path.includes("\\") ||
        hasControlCharacter
    ) {
        return null;
    }

    try {
        const url = new URL(path, window.location.origin);
        if (url.origin !== window.location.origin) return null;
        return `${url.pathname}${url.search}${url.hash}`;
    } catch {
        return null;
    }
};

export const NotificationCenter = ({ role }: NotificationCenterProps) => {
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const panelId = useId();
    const router = useRouter();
    const {
        unreadCountQuery,
        notificationsQuery,
        markReadMutation,
        markAllReadMutation,
    } = useNotifications(role, open);

    useEffect(() => {
        if (!open) return;

        closeButtonRef.current?.focus();

        const closeOnOutsideClick = (event: MouseEvent) => {
            if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setOpen(false);
                triggerRef.current?.focus();
            }
        };

        document.addEventListener("mousedown", closeOnOutsideClick);
        document.addEventListener("keydown", closeOnEscape);
        return () => {
            document.removeEventListener("mousedown", closeOnOutsideClick);
            document.removeEventListener("keydown", closeOnEscape);
        };
    }, [open]);

    const notifications = notificationsQuery.data?.data.notifications ?? [];
    const listedUnreadCount = notifications.filter((notification) => !notification.read_at).length;
    const unreadCount = Math.max(
        0,
        unreadCountQuery.data?.data.unread_count ?? 0,
        listedUnreadCount,
    );
    const unreadStateResolved =
        unreadCountQuery.isSuccess || notificationsQuery.isSuccess;

    const closePanel = () => {
        setOpen(false);
        triggerRef.current?.focus();
    };

    const handleNotificationClick = async (notification: PortalNotification) => {
        const actionPath = safeInternalActionPath(notification.action_path);

        try {
            if (!notification.read_at) {
                await markReadMutation.mutateAsync(notification.id);
            }

            if (actionPath) {
                setOpen(false);
                router.history.push(actionPath);
            }
        } catch (error) {
            toast.error(getApiErrorMessage(error));
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllReadMutation.mutateAsync();
            toast.success("All notifications marked as read.");
        } catch (error) {
            toast.error(getApiErrorMessage(error));
        }
    };

    return (
        <div
            ref={rootRef}
            className="fixed right-4 top-[calc(50%-1.75rem)] z-50 sm:right-6"
        >
            {open ? (
                <section
                    id={panelId}
                    role="dialog"
                    aria-labelledby={`${panelId}-title`}
                    className="bg-card border-border fixed inset-x-4 top-1/2 flex max-h-[min(34rem,calc(100svh-2rem))] w-auto -translate-y-1/2 flex-col overflow-hidden rounded-2xl border shadow-2xl sm:absolute sm:inset-x-auto sm:right-[4.5rem] sm:w-[calc(100vw-7rem)] sm:max-w-sm"
                >
                    <div className="border-border flex shrink-0 items-start justify-between gap-3 border-b px-4 py-3.5">
                        <div className="min-w-0">
                            <h2 id={`${panelId}-title`} className="font-semibold">
                                Notifications
                            </h2>
                            <p className="text-muted-foreground mt-0.5 text-xs">
                                {unreadCount > 0
                                    ? `${unreadCount} unread ${unreadCount === 1 ? "update" : "updates"}`
                                    : unreadStateResolved
                                      ? "You're all caught up."
                                      : "Recent account updates."}
                            </p>
                        </div>
                        <Button
                            ref={closeButtonRef}
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="-mt-1 -mr-1"
                            aria-label="Close notifications"
                            onClick={closePanel}
                        >
                            <XIcon />
                        </Button>
                    </div>

                    {unreadCount > 0 ? (
                        <div className="border-border flex shrink-0 justify-end border-b px-3 py-2">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-primary gap-1.5"
                                disabled={
                                    markAllReadMutation.isPending || markReadMutation.isPending
                                }
                                onClick={handleMarkAllRead}
                            >
                                {markAllReadMutation.isPending ? (
                                    <LoaderCircleIcon className="animate-spin" />
                                ) : (
                                    <CheckCheckIcon />
                                )}
                                Mark all as read
                            </Button>
                        </div>
                    ) : null}

                    <div className="min-h-0 overflow-y-auto overscroll-contain">
                        {notificationsQuery.isPending ? (
                            <div className="text-muted-foreground flex min-h-40 items-center justify-center gap-2 p-6 text-sm">
                                <LoaderCircleIcon className="size-4 animate-spin" />
                                Loading notifications...
                            </div>
                        ) : notificationsQuery.isError && !notificationsQuery.data ? (
                            <div className="flex min-h-40 flex-col items-center justify-center gap-3 p-6 text-center">
                                <div>
                                    <p className="text-sm font-medium">Notifications are unavailable.</p>
                                    <p className="text-muted-foreground mt-1 text-xs">
                                        Please try loading them again.
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => notificationsQuery.refetch()}
                                >
                                    Retry
                                </Button>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="text-muted-foreground flex min-h-40 flex-col items-center justify-center gap-2 p-6 text-center">
                                <BellIcon className="size-7 opacity-50" />
                                <p className="text-sm">No notifications yet.</p>
                            </div>
                        ) : (
                            <div className="divide-border divide-y">
                                {notifications.map((notification) => {
                                    const isUnread = !notification.read_at;
                                    const actionPath = safeInternalActionPath(
                                        notification.action_path,
                                    );
                                    const isInteractive = isUnread || Boolean(actionPath);
                                    const isMarkingThisNotification =
                                        markReadMutation.isPending &&
                                        markReadMutation.variables === notification.id;
                                    const content = (
                                        <>
                                            <span
                                                aria-hidden="true"
                                                className={cn(
                                                    "mt-1.5 size-2 shrink-0 rounded-full",
                                                    isUnread ? "bg-primary" : "bg-transparent",
                                                )}
                                            />
                                            <span className="min-w-0 flex-1">
                                                <span className="flex min-w-0 items-start justify-between gap-3">
                                                    <span
                                                        className={cn(
                                                            "min-w-0 break-words text-sm",
                                                            isUnread ? "font-semibold" : "font-medium",
                                                        )}
                                                    >
                                                        {notification.title}
                                                    </span>
                                                    {isMarkingThisNotification ? (
                                                        <LoaderCircleIcon className="text-primary mt-0.5 size-3.5 shrink-0 animate-spin" />
                                                    ) : null}
                                                </span>
                                                <span className="text-muted-foreground mt-1 block break-words whitespace-pre-wrap text-sm leading-relaxed">
                                                    {notification.message}
                                                </span>
                                                <span className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                                                    <span className="text-muted-foreground text-xs">
                                                        {formatTimestamp(notification.created_at)}
                                                    </span>
                                                    {actionPath ? (
                                                        <span className="text-primary text-xs font-medium">
                                                            View details
                                                        </span>
                                                    ) : isUnread ? (
                                                        <span className="text-primary text-xs font-medium">
                                                            Mark as read
                                                        </span>
                                                    ) : null}
                                                </span>
                                            </span>
                                        </>
                                    );

                                    return isInteractive ? (
                                        <button
                                            key={notification.id}
                                            type="button"
                                            className={cn(
                                                "hover:bg-muted/60 focus-visible:ring-ring/50 flex w-full min-w-0 items-start gap-3 p-4 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset disabled:opacity-60",
                                                isUnread && "bg-primary/5",
                                            )}
                                            disabled={
                                                markReadMutation.isPending ||
                                                markAllReadMutation.isPending
                                            }
                                            onClick={() =>
                                                handleNotificationClick(notification)
                                            }
                                        >
                                            {content}
                                        </button>
                                    ) : (
                                        <div
                                            key={notification.id}
                                            className="flex min-w-0 items-start gap-3 p-4"
                                        >
                                            {content}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </section>
            ) : null}

            <button
                ref={triggerRef}
                type="button"
                className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring/50 relative flex size-14 items-center justify-center rounded-full shadow-xl transition-[transform,background-color,box-shadow] hover:-translate-y-0.5 hover:shadow-2xl focus-visible:ring-4 focus-visible:outline-none"
                aria-label={
                    unreadCount > 0
                        ? `Notifications, ${unreadCount} unread`
                        : "Notifications"
                }
                aria-haspopup="dialog"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpen((current) => !current)}
            >
                <BellIcon className="size-6" />
                {unreadCount > 0 ? (
                    <span
                        className="border-background bg-destructive text-destructive-foreground absolute -top-1 -right-1 flex h-6 min-w-6 items-center justify-center rounded-full border-2 px-1 text-[11px] leading-none font-bold"
                        aria-hidden="true"
                    >
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                ) : null}
            </button>
        </div>
    );
};
