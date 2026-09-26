import { DashboardSidebarLayout } from "@/components/layout/DashboardSidebarLayout";
import { clientPortalApi } from "@/db/api/client.portal.api";
import { useAuth } from "@/db/queries/useAuth";
import { userInitials } from "@/lib/userInitials";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { clearRoleSession } from "@/lib/auth-session-cache";
import { getApiErrorData, getApiErrorMessage } from "@/lib/api-error";
import {
    Building2Icon,
    CalendarClockIcon,
    CalendarCheckIcon,
    CalendarDaysIcon,
    ClipboardCheckIcon,
    HomeIcon,
    MailIcon,
    MessageSquareIcon,
    MessageSquareTextIcon,
    RouteIcon,
    ShieldAlertIcon,
    UserIcon,
    UsersIcon,
} from "lucide-react";
import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { toast } from "sonner";

const formatDeactivationDeadline = (value: unknown): string | null => {
    if (typeof value !== "string" || value.trim() === "") return null;

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;

    return date.toLocaleString(undefined, {
        dateStyle: "long",
        timeStyle: "short",
    });
};

const baseItems = [
    { to: "/dashboard", label: "Dashboard", icon: HomeIcon, match: "exact" as const },
    { to: "/dashboard/journey", label: "My journey", icon: RouteIcon },
    { to: "/dashboard/properties", label: "My properties", icon: Building2Icon },
    { to: "/dashboard/inquiries", label: "My inquiries", icon: MessageSquareTextIcon },
    { to: "/dashboard/prequalification", label: "My documents", icon: ClipboardCheckIcon },
    { to: "/dashboard/reservations", label: "Reservations", icon: MailIcon },
    { to: "/dashboard/my-agent", label: "My agent", icon: UsersIcon },
    { to: "/dashboard/open-house", label: "Open House", icon: CalendarDaysIcon },
    { to: "/dashboard/appointments", label: "Appointments & CAS", icon: CalendarCheckIcon },
    { to: "/dashboard/profile", label: "Profile", icon: UserIcon },
];

export const ClientDashboardLayout = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { sessionQuery, logoutMutation } = useAuth();
    const sessionErrorData = getApiErrorData(sessionQuery.error);
    const isPendingDeactivation =
        sessionQuery.isError &&
        sessionErrorData?.code === "ACCOUNT_PENDING_DEACTIVATION";
    const deactivationDeadline = formatDeactivationDeadline(
        sessionErrorData?.deactivation_scheduled_at,
    );
    const inquiriesQuery = useQuery({
        queryKey: ["client", "inquiries"],
        queryFn: () => clientPortalApi.inquiries(),
        enabled: sessionQuery.isSuccess,
    });

    const cancelDeactivationMutation = useMutation({
        mutationFn: clientPortalApi.cancelDeactivationAuthenticated,
        onSuccess: async (response) => {
            toast.success(
                response.message || "Your account deactivation request has been cancelled.",
            );
            await queryClient.invalidateQueries({ queryKey: ["client"] });
        },
        onError: (error) => {
            const code = getApiErrorData(error)?.code;

            if (code === "ACCOUNT_DEACTIVATED") {
                clearRoleSession(queryClient, "client");
                toast.error(getApiErrorMessage(error));
                navigate({ to: "/auth/login", replace: true });
                return;
            }

            toast.error(getApiErrorMessage(error));
        },
    });

    useEffect(() => {
        if (sessionQuery.isError && !isPendingDeactivation) {
            navigate({ to: "/auth/login", replace: true });
        }
    }, [isPendingDeactivation, sessionQuery.isError, navigate]);

    if (sessionQuery.isPending) {
        return (
            <div className="flex min-h-svh items-center justify-center">
                <Spinner className="size-8" />
            </div>
        );
    }

    if (isPendingDeactivation) {
        return (
            <main className="bg-muted/30 flex min-h-svh items-center justify-center p-4 sm:p-6">
                <Card className="border-amber-200/80 w-full max-w-xl shadow-sm">
                    <CardHeader>
                        <div className="flex items-start gap-3">
                            <div className="bg-amber-100 text-amber-700 flex size-10 shrink-0 items-center justify-center rounded-lg">
                                <ShieldAlertIcon className="size-5" aria-hidden />
                            </div>
                            <div className="min-w-0 space-y-1">
                                <CardTitle>Account scheduled for deactivation</CardTitle>
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                    Normal dashboard access is paused while your account has a
                                    pending deactivation request.
                                </p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        {deactivationDeadline ? (
                            <div className="border-border bg-muted/40 flex items-start gap-3 rounded-lg border p-4">
                                <CalendarClockIcon
                                    className="text-muted-foreground mt-0.5 size-5 shrink-0"
                                    aria-hidden
                                />
                                <div className="min-w-0">
                                    <p className="text-sm font-medium">Scheduled deadline</p>
                                    <p className="text-muted-foreground mt-1 break-words text-sm">
                                        {deactivationDeadline}
                                    </p>
                                </div>
                            </div>
                        ) : null}

                        <p className="text-muted-foreground text-sm leading-relaxed">
                            You can ask the server to cancel this request before its deadline.
                            The server will verify whether cancellation is still available.
                        </p>

                        <Button
                            type="button"
                            className="w-full sm:w-auto"
                            disabled={cancelDeactivationMutation.isPending}
                            onClick={() => cancelDeactivationMutation.mutate()}
                        >
                            {cancelDeactivationMutation.isPending ? (
                                <Spinner className="size-4" />
                            ) : null}
                            {cancelDeactivationMutation.isPending
                                ? "Cancelling request…"
                                : "Cancel account deactivation"}
                        </Button>
                    </CardContent>
                </Card>
            </main>
        );
    }

    if (sessionQuery.isError) {
        return null;
    }

    const user = sessionQuery.data?.data;
    const hasAssignedInquiry =
        inquiriesQuery.isSuccess &&
        inquiriesQuery.data.data.some((inquiry) => Boolean(inquiry.agent_id));
    const items = hasAssignedInquiry
        ? [
              ...baseItems.slice(0, 4),
              { to: "/dashboard/chat", label: "Chat", icon: MessageSquareIcon },
              ...baseItems.slice(4),
          ]
        : baseItems;

    return (
        <DashboardSidebarLayout
            productName={<BrandLogo variant="sidebar" />}
            brandTo="/"
            portalSubtitle="Client portal"
            mainTitle="Client dashboard"
            welcomeName={user?.f_}
            userInitial={userInitials(user?.f_, user?.l_, user?.e_)}
            items={items}
            logoutPending={logoutMutation.isPending}
            onLogout={() =>
                logoutMutation.mutate(undefined, {
                    onSettled: () => navigate({ to: "/auth/login", replace: true }),
                })
            }
            showHeaderAccountMenu
            headerAction={
                <Button variant="outline" size="sm" className="gap-2" asChild>
                    <Link to="/" aria-label="Go to Home">
                        <HomeIcon className="size-4" />
                        <span className="hidden sm:inline">Home</span>
                    </Link>
                </Button>
            }
        >
            <Outlet />
            <NotificationCenter role="client" />
        </DashboardSidebarLayout>
    );
};
