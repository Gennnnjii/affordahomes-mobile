import { DashboardSidebarLayout } from "@/components/layout/DashboardSidebarLayout";
import { useAgentAuth } from "@/db/queries/useAgentAuth";
import { userInitials } from "@/lib/userInitials";
import { Spinner } from "@/components/ui/spinner";
import {
    Building2Icon,
    CalendarDaysIcon,
    ClipboardCheckIcon,
    FolderOpenIcon,
    HomeIcon,
    MailIcon,
    MessageSquareIcon,
    UserCircleIcon,
    UsersIcon,
} from "lucide-react";
import { Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";

const items = [
    { to: "/dashboard/agent", label: "Dashboard", icon: HomeIcon, match: "exact" as const },
    { to: "/dashboard/agent/clients", label: "My clients", icon: UsersIcon },
    { to: "/dashboard/agent/prequalifications", label: "Prequalifications", icon: ClipboardCheckIcon },
    { to: "/dashboard/agent/properties", label: "Properties", icon: Building2Icon },
    { to: "/dashboard/agent/reservations", label: "Reservations", icon: MailIcon },
    { to: "/dashboard/agent/chat", label: "Chat", icon: MessageSquareIcon },
    { to: "/dashboard/agent/appointments", label: "Site visits", icon: CalendarDaysIcon },
    { to: "/dashboard/agent/documents", label: "My documents", icon: FolderOpenIcon },
    { to: "/dashboard/agent/profile", label: "Profile", icon: UserCircleIcon },
];

export const AgentDashboardLayout = () => {
    const navigate = useNavigate();
    const { sessionQuery, logoutMutation } = useAgentAuth();

    useEffect(() => {
        if (sessionQuery.isError) {
            navigate({ to: "/auth/login", replace: true });
        }
    }, [sessionQuery.isError, navigate]);

    if (sessionQuery.isPending) {
        return (
            <div className="flex min-h-svh items-center justify-center">
                <Spinner className="size-8" />
            </div>
        );
    }

    if (sessionQuery.isError) {
        return null;
    }

    const user = sessionQuery.data?.data;

    return (
        <DashboardSidebarLayout
            productName={<BrandLogo variant="sidebar" />}
            brandTo="/"
            portalSubtitle="Agent portal"
            mainTitle="Agent dashboard"
            welcomeName={user ? `${user.f_} ${user.l_}`.trim() : undefined}
            userInitial={userInitials(user?.f_, user?.l_, user?.e_)}
            items={items}
            logoutPending={logoutMutation.isPending}
            onLogout={() =>
                logoutMutation.mutate(undefined, {
                    onSettled: () => navigate({ to: "/auth/login", replace: true }),
                })
            }
            showHeaderAccountMenu
        >
            <Outlet />
            <NotificationCenter role="agent" />
        </DashboardSidebarLayout>
    );
};
