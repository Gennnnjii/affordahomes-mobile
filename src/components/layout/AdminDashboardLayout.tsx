import { DashboardSidebarLayout } from "@/components/layout/DashboardSidebarLayout";
import { useAdminAuth } from "@/db/queries/useAdminAuth";
import { userInitials } from "@/lib/userInitials";
import { clearAdminToken } from "@/lib/tokens";
import {
    Building2Icon,
    CalendarDaysIcon,
    CalendarRangeIcon,
    ChartColumnIcon,
    ClockIcon,
    ClipboardListIcon,
    DatabaseBackupIcon,
    LayoutDashboardIcon,
    SettingsIcon,
    TrophyIcon,
    UserRoundIcon,
} from "lucide-react";
import { Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { BrandLogo } from "@/components/brand/BrandLogo";

const items = [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboardIcon, match: "exact" as const },
    { to: "/admin/agents", label: "Agents", icon: UserRoundIcon },
    { to: "/admin/properties", label: "Properties", icon: Building2Icon },
    { to: "/admin/appointments", label: "Appointments", icon: CalendarDaysIcon },
    { to: "/admin/open-house", label: "Open House", icon: CalendarRangeIcon },
    { to: "/admin/requests", label: "Requests", icon: ClipboardListIcon },
    { to: "/admin/timesheets",   label: "Timesheets",   icon: ClockIcon },
    { to: "/admin/leaderboards", label: "Leaderboards", icon: TrophyIcon },
    { to: "/admin/reports",      label: "Reports",      icon: ChartColumnIcon },
    { to: "/admin/backups", label: "Backup & Restore", icon: DatabaseBackupIcon },
    { to: "/admin/settings",     label: "Settings",     icon: SettingsIcon },
];

export const AdminDashboardLayout = () => {
    const navigate = useNavigate();
    const { sessionQuery, logoutMutation } = useAdminAuth();

    useEffect(() => {
        if (sessionQuery.isError) {
            clearAdminToken();
            navigate({ to: "/auth/login", replace: true });
        }
    }, [sessionQuery.isError, navigate]);

    if (sessionQuery.isError) {
        return null;
    }

    const user = sessionQuery.data?.data;

    return (
        <DashboardSidebarLayout
            productName={<BrandLogo variant="sidebar" />}
            portalSubtitle="Admin portal"
            mainTitle="Admin dashboard"
            welcomeName={user ? `${user.f_} ${user.l_}`.trim() : undefined}
            userInitial={userInitials(user?.f_, user?.l_, user?.e_)}
            items={items}
            logoutPending={logoutMutation.isPending}
            onLogout={() =>
                logoutMutation.mutate(undefined, {
                    onSettled: () => navigate({ to: "/auth/login", replace: true }),
                })
            }
        >
            <Outlet />
        </DashboardSidebarLayout>
    );
};
