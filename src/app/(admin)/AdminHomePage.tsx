import { adminResourceApi } from "@/db/api/admin.api";
import { DashboardBanner } from "@/components/app/DashboardBanner";
import { DashboardPanel } from "@/components/app/DashboardPanel";
import { StatTile } from "@/components/app/StatTile";
import { Button } from "@/components/ui/button";
import { Building2Icon, CalendarDaysIcon, UserIcon, UsersIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

const AdminHomePage = () => {
    const agents = useQuery({
        queryKey: ["admin", "agents"],
        queryFn: () => adminResourceApi.agents(),
        refetchInterval: 2_000,
    });
    const clientStatistics = useQuery({
        queryKey: ["admin", "client-statistics"],
        queryFn: () => adminResourceApi.clientStatistics(),
        refetchInterval: 2_000,
    });
    const properties = useQuery({
        queryKey: ["admin", "properties"],
        queryFn: () => adminResourceApi.properties(),
        refetchInterval: 2_000,
    });
    const appointments = useQuery({
        queryKey: ["admin", "appointments"],
        queryFn: () => adminResourceApi.appointments(),
        refetchInterval: 2_000,
    });

    const loading =
        agents.isPending ||
        clientStatistics.isPending ||
        properties.isPending ||
        appointments.isPending;
    const err =
        agents.isError ||
        clientStatistics.isError ||
        properties.isError ||
        appointments.isError;

    const agentRows = (agents.data?.data as unknown[]) ?? [];
    const totalClients = clientStatistics.data?.data.total_clients ?? 0;
    const propertyRows = (properties.data?.data as unknown[]) ?? [];
    const appointmentRows = (appointments.data?.data as unknown[]) ?? [];

    if (loading) {
        return (
            <div className="space-y-6">

                <Skeleton className="h-[220px] w-full rounded-xl md:h-[260px]" />

                <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div
                            key={i}
                            className="border-border/80 flex items-center gap-3.5 rounded-xl border p-5 shadow-sm"
                        >
                            <Skeleton className="size-[52px] shrink-0 rounded-xl" />
                            <div className="space-y-2">
                                <Skeleton className="h-7 w-10" />
                                <Skeleton className="h-4 w-24" />
                            </div>
                        </div>
                    ))}
                </section>

                <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="border-border/80 space-y-0 rounded-xl border shadow-sm">
                        <div className="flex items-center justify-between px-6 pb-3 pt-5">
                            <Skeleton className="h-6 w-44" />
                            <Skeleton className="h-4 w-14" />
                        </div>
                        <div className="px-6 pb-6 space-y-3">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <Skeleton className="h-4 flex-1" />
                                    <Skeleton className="h-4 flex-1" />
                                    <Skeleton className="h-7 w-16 rounded-md" />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="border-border/80 rounded-xl border shadow-sm">
                        <div className="px-6 pb-3 pt-5">
                            <Skeleton className="h-6 w-32" />
                        </div>
                        <div className="px-6 pb-6 space-y-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <Skeleton key={i} className="h-9 w-full rounded-lg" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <DashboardBanner
                title="Monitor operations, manage users, and keep every community moving smoothly"
                description="Oversee clients, agents, property availability, reservations, and overall platform activity from one centralized dashboard."
                ctaLabel="View properties"
                ctaTo="/admin/properties"
                imageSrc="/images/dashboard/admin.jpg"
                imageAlt="Fiesta Communities administration office"
            />

            {err ? (
                <p className="text-destructive">Could not load dashboard data.</p>
            ) : (
                <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                    <StatTile icon={UsersIcon} value={totalClients} label="Total clients" />
                    <StatTile icon={UserIcon} value={agentRows.length} label="Active agents" />
                    <StatTile icon={Building2Icon} value={propertyRows.length} label="Listed properties" />
                    <StatTile
                        icon={CalendarDaysIcon}
                        value={appointmentRows.length}
                        label="Appointments"
                    />
                </section>
            )}

            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <DashboardPanel title="Client overview">
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        {totalClients} registered {totalClients === 1 ? "Client" : "Clients"}.
                        Individual Client information is managed only through authorized Client and
                        assigned-Agent workflows.
                    </p>
                </DashboardPanel>

                <DashboardPanel title="Quick actions">
                    <div className="flex flex-col gap-3">
                        <Button variant="outline" className="justify-start" asChild>
                            <Link to="/admin/agents/create">Create agent</Link>
                        </Button>
                        <Button variant="outline" className="justify-start" asChild>
                            <Link to="/admin/properties/create">Add property</Link>
                        </Button>
                    </div>
                </DashboardPanel>
            </div>
        </div>
    );
};

export default AdminHomePage;
