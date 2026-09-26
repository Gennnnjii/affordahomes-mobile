import {
    agentPortalApi,
    type AgentAttendanceData,
} from "@/db/api/agent.portal.api";
import { DashboardBanner } from "@/components/app/DashboardBanner";
import { StatTile } from "@/components/app/StatTile";
import { AmortizationCalculator } from "@/components/app/AmortizationCalculator";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookmarkIcon, Building2Icon, CalendarDaysIcon, Clock3Icon, LogInIcon, LogOutIcon, RefreshCwIcon, SearchIcon, UsersIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { asRecord, idStr, str } from "@/lib/record";
import { getApiErrorMessage } from "@/lib/api-error";
import { toast } from "sonner";

const ATTENDANCE_QUERY_KEY = ["agent", "attendance"] as const;

const ATTENDANCE_LABELS: Record<AgentAttendanceData["state"], string> = {
    not_clocked_in: "Not clocked in yet",
    clocked_in: "Clocked in",
    clocked_out: "Attendance completed",
};

function formatAttendanceTimestamp(value: string | null | undefined): string {
    if (!value) return "—";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleString("en-PH", {
        timeZone: "Asia/Manila",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
}

function formatAttendanceDate(value: string | null | undefined): string {
    if (!value) return "—";

    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return value;

    const date = new Date(`${value}T00:00:00+08:00`);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString("en-PH", {
        timeZone: "Asia/Manila",
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function formatAttendanceDuration(minutes: number | null | undefined): string {
    if (minutes === null || minutes === undefined || !Number.isFinite(minutes)) return "—";

    const wholeMinutes = Math.max(0, Math.floor(minutes));
    const hours = Math.floor(wholeMinutes / 60);
    const remainder = wholeMinutes % 60;

    return hours > 0 ? `${hours}h ${remainder}m` : `${remainder}m`;
}

const AttendanceCard = () => {
    const queryClient = useQueryClient();
    const attendanceQuery = useQuery({
        queryKey: ATTENDANCE_QUERY_KEY,
        queryFn: () => agentPortalApi.getCurrentAttendance(),
    });

    const synchronizeAttendance = (
        response: Awaited<ReturnType<typeof agentPortalApi.getCurrentAttendance>>,
        fallbackMessage: string,
    ) => {
        queryClient.setQueryData(ATTENDANCE_QUERY_KEY, response);
        void queryClient.invalidateQueries({ queryKey: ATTENDANCE_QUERY_KEY });
        toast.success(response.message || fallbackMessage);
    };

    const handleMutationError = (error: unknown) => {
        toast.error(getApiErrorMessage(error));
        void queryClient.invalidateQueries({ queryKey: ATTENDANCE_QUERY_KEY });
    };

    const timeInMutation = useMutation({
        mutationFn: () => agentPortalApi.timeIn(),
        onSuccess: (response) => synchronizeAttendance(response, "Time-in recorded."),
        onError: handleMutationError,
    });

    const timeOutMutation = useMutation({
        mutationFn: () => agentPortalApi.timeOut(),
        onSuccess: (response) => synchronizeAttendance(response, "Time-out recorded."),
        onError: handleMutationError,
    });

    if (attendanceQuery.isPending) {
        return (
            <Card className="border-border/80 shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Clock3Icon className="text-primary size-4" />
                        Attendance
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <Skeleton className="h-5 w-36" />
                    <Skeleton className="h-16 w-full rounded-lg" />
                    <Skeleton className="h-9 w-full" />
                </CardContent>
            </Card>
        );
    }

    if (!attendanceQuery.data) {
        return (
            <Card className="border-border/80 shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Clock3Icon className="text-primary size-4" />
                        Attendance
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <p role="alert" className="text-destructive text-sm">
                        Attendance is unavailable right now.
                    </p>
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="w-full gap-2"
                        disabled={attendanceQuery.isFetching}
                        onClick={() => void attendanceQuery.refetch()}
                    >
                        <RefreshCwIcon className="size-4" />
                        {attendanceQuery.isFetching ? "Retrying…" : "Try again"}
                    </Button>
                </CardContent>
            </Card>
        );
    }

    const { state, business_date: businessDate, attendance } = attendanceQuery.data.data;
    const isOlderOpenSession = state === "clocked_in"
        && attendance !== null
        && attendance.date !== businessDate;
    const mutationPending = timeInMutation.isPending || timeOutMutation.isPending;
    const actionDisabled = mutationPending || attendanceQuery.isFetching;
    const statusClasses = state === "clocked_out"
        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
        : state === "clocked_in"
            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
            : "bg-muted text-muted-foreground";

    return (
        <Card className="border-border/80 shadow-sm">
            <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Clock3Icon className="text-primary size-4" />
                        Attendance
                    </CardTitle>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses}`}>
                        {ATTENDANCE_LABELS[state]}
                    </span>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-1">
                    <div>
                        <p className="text-muted-foreground text-xs">Business date</p>
                        <p className="mt-0.5 font-medium">{formatAttendanceDate(businessDate)}</p>
                    </div>
                    {attendance?.time_in ? (
                        <div>
                            <p className="text-muted-foreground text-xs">Time In</p>
                            <p className="mt-0.5 font-medium">
                                {formatAttendanceTimestamp(attendance.time_in)}
                            </p>
                        </div>
                    ) : null}
                    {attendance?.time_out ? (
                        <div>
                            <p className="text-muted-foreground text-xs">Time Out</p>
                            <p className="mt-0.5 font-medium">
                                {formatAttendanceTimestamp(attendance.time_out)}
                            </p>
                        </div>
                    ) : null}
                    {state === "clocked_out" ? (
                        <div>
                            <p className="text-muted-foreground text-xs">Duration</p>
                            <p className="mt-0.5 font-medium">
                                {formatAttendanceDuration(attendance?.duration_minutes)}
                            </p>
                        </div>
                    ) : null}
                </div>

                {isOlderOpenSession ? (
                    <p
                        role="status"
                        className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200"
                    >
                        This open attendance session began on{" "}
                        {formatAttendanceDate(attendance.date)} and still needs to be timed out.
                    </p>
                ) : null}

                {state === "not_clocked_in" ? (
                    <Button
                        type="button"
                        className="w-full gap-2"
                        disabled={actionDisabled}
                        onClick={() => timeInMutation.mutate()}
                    >
                        <LogInIcon className="size-4" />
                        {timeInMutation.isPending ? "Recording…" : "Time In"}
                    </Button>
                ) : null}

                {state === "clocked_in" ? (
                    <Button
                        type="button"
                        className="w-full gap-2"
                        disabled={actionDisabled}
                        onClick={() => timeOutMutation.mutate()}
                    >
                        <LogOutIcon className="size-4" />
                        {timeOutMutation.isPending ? "Recording…" : "Time Out"}
                    </Button>
                ) : null}
            </CardContent>
        </Card>
    );
};

const AgentHome = () => {
    const props = useQuery({
        queryKey: ["agent", "properties"],
        queryFn: () => agentPortalApi.properties(),
        refetchInterval: 2_000,
    });
    const appt = useQuery({
        queryKey: ["agent", "appointments"],
        queryFn: () => agentPortalApi.appointments(),
        refetchInterval: 2_000,
    });
    const inq = useQuery({
        queryKey: ["agent", "inquiries"],
        queryFn: () => agentPortalApi.inquiries(),
        refetchInterval: 2_000,
    });

    const loading = props.isPending || appt.isPending || inq.isPending;

    const pc = ((props.data?.data as unknown[]) ?? []).length;
    const ac = ((appt.data?.data as unknown[]) ?? []).length;
    const ic = ((inq.data?.data as unknown[]) ?? []).length;

    const clientCount = useMemo(() => {
        const ids = new Set<string>();
        const add = (raw: unknown) => {
            const row = asRecord(raw);
            const c = asRecord(row.client);
            const id = str(c.id);
            if (id) ids.add(id);
        };
        ((appt.data?.data as unknown[]) ?? []).forEach(add);
        ((inq.data?.data as unknown[]) ?? []).forEach(add);
        return ids.size;
    }, [appt.data, inq.data]);

    const [query, setQuery] = useState("");

    const allClients = useMemo(() => {
        const map = new Map<string, { id: string; name: string; email: string }>();
        const add = (raw: unknown) => {
            const row = asRecord(raw);
            const c = asRecord(row.client);
            const id = str(c.id);
            if (!id || map.has(id)) return;
            map.set(id, {
                id,
                name: `${str(c.first_name) ?? ""} ${str(c.last_name) ?? ""}`.trim() || str(c.email) || "—",
                email: str(c.email) ?? "",
            });
        };
        ((appt.data?.data as unknown[]) ?? []).forEach(add);
        ((inq.data?.data as unknown[]) ?? []).forEach(add);
        return [...map.values()];
    }, [appt.data, inq.data]);

    const allReservations = useMemo(() => {
        return ((inq.data?.data as unknown[]) ?? []).map((raw) => {
            const row = asRecord(raw);
            const c = asRecord(row.client);
            const p = asRecord(row.property);
            return {
                id: str(row.id) ?? "",
                subject: str(row.subject) ?? "",
                clientName: `${str(c.first_name) ?? ""} ${str(c.last_name) ?? ""}`.trim(),
                propertyTitle: str(p.title) ?? "",
                status: str(row.status) ?? "",
            };
        });
    }, [inq.data]);

    const allProperties = useMemo(() => {
        return ((props.data?.data as unknown[]) ?? []).map((raw) => {
            const row = asRecord(raw);
            return {
                id: idStr(row.id) ?? "",
                title: str(row.title) ?? "",
                project: str(row.project) ?? "",
                block: str(row.block) ?? "",
                lot: str(row.lot_number) ?? "",
            };
        });
    }, [props.data]);

    const q = query.trim().toLowerCase();
    const matchedClients = q ? allClients.filter((c) =>
        c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q),
    ) : [];
    const matchedReservations = q ? allReservations.filter((r) =>
        r.subject.toLowerCase().includes(q) ||
        r.clientName.toLowerCase().includes(q) ||
        r.propertyTitle.toLowerCase().includes(q),
    ) : [];
    const matchedProperties = q ? allProperties.filter((p) =>
        p.title.toLowerCase().includes(q) ||
        p.project.toLowerCase().includes(q) ||
        `block ${p.block} lot ${p.lot}`.includes(q),
    ) : [];

    const hasResults = matchedClients.length > 0 || matchedReservations.length > 0 || matchedProperties.length > 0;

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
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <DashboardBanner
                title="Stay on top of clients, listings, and site visits"
                description="Review reservations, schedule visits, and keep your pipeline moving from one operations workspace."
                ctaLabel="Open site visits"
                ctaTo="/dashboard/agent/appointments"
                imageSrc="/images/dashboard/agent.jpg"
                imageAlt="Fiesta Communities agent team"
                imageClassName="object-top"
            />

            <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                <StatTile icon={UsersIcon} value={clientCount} label="Assigned clients" />
                <StatTile icon={Building2Icon} value={pc} label="Properties managed" />
                <StatTile icon={BookmarkIcon} value={ic} label="Active reservations" />
                <StatTile icon={CalendarDaysIcon} value={ac} label="Site visits scheduled" />
            </section>

            <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
                <div className="space-y-4">
                    <Card className="border-border/80 shadow-sm">
                        <CardContent className="p-4 space-y-3">
                            <div className="relative">
                                <SearchIcon className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                                <Input
                                    className="pl-9"
                                    placeholder="Search clients, reservations, or properties…"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                />
                            </div>

                            {q && (
                                <div className="space-y-3 pt-1">
                                    {!hasResults && (
                                        <p className="text-muted-foreground text-sm px-1">No results for "{query}"</p>
                                    )}
                                    {matchedClients.length > 0 && (
                                        <div>
                                            <p className="text-muted-foreground mb-1.5 px-1 text-xs font-medium uppercase tracking-wide">Clients</p>
                                            <div className="space-y-1">
                                                {matchedClients.slice(0, 4).map((c) => (
                                                    <Link
                                                        key={c.id}
                                                        to="/dashboard/agent/clients"
                                                        className="hover:bg-muted flex items-center justify-between rounded-lg px-3 py-2 transition-colors"
                                                    >
                                                        <span className="font-medium text-sm">{c.name}</span>
                                                        <span className="text-muted-foreground text-xs">{c.email}</span>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {matchedReservations.length > 0 && (
                                        <div>
                                            <p className="text-muted-foreground mb-1.5 px-1 text-xs font-medium uppercase tracking-wide">Reservations</p>
                                            <div className="space-y-1">
                                                {matchedReservations.slice(0, 4).map((r) => (
                                                    <Link
                                                        key={r.id}
                                                        to="/dashboard/agent/reservation/$reservationId"
                                                        params={{ reservationId: r.id }}
                                                        className="hover:bg-muted flex items-center justify-between rounded-lg px-3 py-2 transition-colors"
                                                    >
                                                        <span className="font-medium text-sm truncate max-w-[240px]">{r.subject || "—"}</span>
                                                        <span className="text-muted-foreground text-xs shrink-0 ml-2">{r.clientName}</span>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {matchedProperties.length > 0 && (
                                        <div>
                                            <p className="text-muted-foreground mb-1.5 px-1 text-xs font-medium uppercase tracking-wide">Properties</p>
                                            <div className="space-y-1">
                                                {matchedProperties.slice(0, 4).map((p) => (
                                                    <Link
                                                        key={p.id}
                                                        to="/dashboard/agent/properties"
                                                        className="hover:bg-muted flex items-center justify-between rounded-lg px-3 py-2 transition-colors"
                                                    >
                                                        <span className="font-medium text-sm">{p.title}</span>
                                                        <span className="text-muted-foreground text-xs">
                                                            {[p.project, p.block && `Blk ${p.block}`, p.lot && `Lot ${p.lot}`].filter(Boolean).join(" · ")}
                                                        </span>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {!q && (
                                <div className="flex flex-wrap gap-2 pt-1">
                                    <Button size="sm" variant="outline" asChild>
                                        <Link to="/dashboard/agent/clients">My clients</Link>
                                    </Button>
                                    <Button size="sm" variant="outline" asChild>
                                        <Link to="/dashboard/agent/reservations">Reservations</Link>
                                    </Button>
                                    <Button size="sm" variant="outline" asChild>
                                        <Link to="/dashboard/agent/appointments">Site visits</Link>
                                    </Button>
                                    <Button size="sm" variant="outline" asChild>
                                        <Link to="/dashboard/agent/properties">Properties</Link>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <AttendanceCard />
                    <AmortizationCalculator compact />
                </div>
            </div>
        </div>
    );
};

export default AgentHome;
