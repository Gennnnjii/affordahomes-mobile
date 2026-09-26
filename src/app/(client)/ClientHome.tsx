import { clientPortalApi } from "@/db/api/client.portal.api";
import { useAuth } from "@/db/queries/useAuth";
import { asRecord, str } from "@/lib/record";
import { DashboardBanner } from "@/components/app/DashboardBanner";
import { DashboardPanel } from "@/components/app/DashboardPanel";
import { StatTile } from "@/components/app/StatTile";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BookmarkIcon, CalendarCheckIcon, HomeIcon, RouteIcon, UserIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

const ClientHome = () => {
    const { sessionQuery } = useAuth();
    const u = sessionQuery.data?.data;

    const appt = useQuery({
        queryKey: ["client", "appointments"],
        queryFn: () => clientPortalApi.appointments(),
        refetchInterval: 2_000,
    });
    const inq = useQuery({
        queryKey: ["client", "inquiries"],
        queryFn: () => clientPortalApi.inquiries(),
        refetchInterval: 2_000,
    });
    const reservations = useQuery({
        queryKey: ["client", "reservations"],
        queryFn: () => clientPortalApi.reservations(),
        refetchInterval: 2_000,
    });

    const agentCount = useMemo(() => {
        const ids = new Set<string>();
        const add = (raw: unknown) => {
            const row = asRecord(raw);
            const a = asRecord(row.agent);
            const id = str(a.id);
            if (id) ids.add(id);
        };
        ((appt.data?.data as unknown[]) ?? []).forEach(add);
        ((inq.data?.data as unknown[]) ?? []).forEach(add);
        return ids.size;
    }, [appt.data, inq.data]);

    const loading = appt.isPending || inq.isPending || reservations.isPending;
    const ac = ((appt.data?.data as unknown[]) ?? []).length;
    const rc = (reservations.data?.data ?? []).filter((reservation) => reservation.status === "active").length;

    const recentAppt = (appt.data?.data as unknown[])?.[0];
    const ra = asRecord(recentAppt);
    const recentLine = str(ra.schedule) ? `Latest booking: ${str(ra.schedule)}` : "No bookings yet.";

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
                <DashboardPanel title="Journey" actionLabel="Open tracker" actionTo="/dashboard/journey">
                    <div className="flex gap-3">
                        <div className="bg-primary/15 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
                            <RouteIcon className="size-5" />
                        </div>
                        <div>
                            <p className="font-medium">Your homeownership progress</p>
                            <p className="text-muted-foreground text-sm">
                                Follow inquiry, agent, site visit, document, and reservation milestones in one place.
                            </p>
                        </div>
                    </div>
                </DashboardPanel>

                    <div className="border-border/80 rounded-xl border shadow-sm">
                        <div className="flex items-center justify-between px-6 pb-3 pt-5">
                            <Skeleton className="h-6 w-32" />
                            <Skeleton className="h-4 w-16" />
                        </div>
                        <div className="space-y-3 px-6 pb-6">
                            <Skeleton className="h-14 w-full rounded-lg" />
                            <Skeleton className="h-9 w-40 rounded-lg" />
                        </div>
                    </div>
                    <div className="border-border/80 rounded-xl border shadow-sm">
                        <div className="px-6 pb-3 pt-5">
                            <Skeleton className="h-6 w-24" />
                        </div>
                        <div className="space-y-2 px-6 pb-6">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-2/3" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <DashboardBanner
                title="Find and manage your dream home journey"
                description="Track your property reservations, connect with your assigned agent, and stay updated with your homeownership progress."
                ctaLabel="Browse properties"
                ctaTo="/properties"
                imageSrc="/images/dashboard/client.jpg"
                imageAlt="Fiesta Communities client consultation"
                imageClassName="object-top"
            />

            <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                <StatTile icon={HomeIcon} value="—" label="Saved properties" />
                <StatTile icon={BookmarkIcon} value={rc} label="Active reservations" />
                <StatTile icon={UserIcon} value={agentCount} label="Assigned agents" />
                <StatTile icon={CalendarCheckIcon} value={ac} label="Appointments" />
            </section>

            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <DashboardPanel title="Activity" actionLabel="Bookings" actionTo="/dashboard/appointments">
                    <div className="space-y-4">
                        <div className="flex gap-3">
                            <div className="bg-primary/15 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
                                <CalendarCheckIcon className="size-5" />
                            </div>
                            <div>
                                <p className="font-medium">Bookings</p>
                                <p className="text-muted-foreground text-sm">{recentLine}</p>
                            </div>
                        </div>
                        <Button variant="outline" className="rounded-lg" asChild>
                            <Link to="/dashboard/reservations">View reservations</Link>
                        </Button>
                    </div>
                </DashboardPanel>

                <DashboardPanel title="Account" actionLabel="Profile" actionTo="/dashboard/profile">
                    <p className="text-muted-foreground text-sm">
                        Signed in as{" "}
                        <span className="text-foreground font-medium">
                            {u ? `${u.f_} ${u.l_}` : "Client"}
                        </span>
                        {u?.e_ ? <span className="block truncate pt-1">{u.e_}</span> : null}
                    </p>
                </DashboardPanel>
            </div>
        </div>
    );
};

export default ClientHome;
