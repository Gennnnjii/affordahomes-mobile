import { agentPortalApi } from "@/db/api/agent.portal.api";
import { asRecord, idStr, str } from "@/lib/record";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { DataTableSkeleton } from "@/components/app/DataTableSkeleton";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { ScreenBackLink } from "@/components/navigation/ScreenBackLink";
import { useQuery } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";

type ApptStatusFilter = "all" | "pending" | "confirmed" | "completed" | "cancelled";

type AppointmentRow = Record<string, unknown>;

const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    cancelled: "bg-muted text-muted-foreground",
};

const fmtWhen = (v: unknown) => {
    if (v == null || v === "") return "—";
    const d = new Date(String(v));
    if (Number.isNaN(d.getTime())) return String(v);
    return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
};

const columns: ColumnDef<AppointmentRow>[] = [
    {
        id: "schedule",
        accessorFn: (row) => str(row.schedule) ?? "",
        header: "When",
        cell: ({ row }) => (
            <span className="whitespace-nowrap text-sm">{fmtWhen(row.original.schedule)}</span>
        ),
        size: 170,
    },
    {
        id: "location",
        accessorFn: (row) => str(row.location) ?? "",
        header: "Location",
        cell: ({ getValue }) => (
            <span className="text-muted-foreground max-w-[180px] truncate block text-sm">
                {(getValue() as string) || "—"}
            </span>
        ),
    },
    {
        id: "client",
        accessorFn: (row) => {
            const c = asRecord(row.client);
            return `${str(c.first_name) ?? ""} ${str(c.last_name) ?? ""}`.trim() || str(c.email) || "";
        },
        header: "Client",
        cell: ({ getValue }) => (
            <span className="text-muted-foreground text-sm">{(getValue() as string) || "—"}</span>
        ),
    },
    {
        id: "property",
        accessorFn: (row) => str(asRecord(row.property).title) ?? "",
        header: "Property",
        cell: ({ getValue }) => (
            <span className="text-muted-foreground max-w-[150px] truncate block text-sm">
                {(getValue() as string) || "—"}
            </span>
        ),
    },
    {
        id: "status",
        accessorFn: (row) => str(row.status) ?? "",
        header: "Status",
        cell: ({ row }) => {
            const st = str(row.original.status) ?? "pending";
            const colorClass = statusColors[st] ?? statusColors.cancelled;
            return (
                <span className={`rounded-md px-2 py-0.5 text-xs font-medium capitalize ${colorClass}`}>
                    {st}
                </span>
            );
        },
        size: 110,
    },
    {
        id: "actions",
        header: "",
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) => {
            const pk = idStr(row.original.id);
            return pk ? (
                <Button variant="outline" size="sm" asChild>
                    <Link
                        to="/dashboard/agent/appointment/$appointmentId"
                        params={{ appointmentId: pk }}
                    >
                        Manage
                    </Link>
                </Button>
            ) : null;
        },
        size: 90,
    },
];

const apptStatusFilterLabels: Record<ApptStatusFilter, string> = {
    all: "All",
    pending: "Pending",
    confirmed: "Confirmed",
    completed: "Completed",
    cancelled: "Cancelled",
};

const apptStatusFilterColors: Record<ApptStatusFilter, string> = {
    all: "",
    pending: "text-amber-700",
    confirmed: "text-blue-700",
    completed: "text-green-700",
    cancelled: "text-muted-foreground",
};

const AgentAppointmentsPage = () => {
    const [statusFilter, setStatusFilter] = useState<ApptStatusFilter>("all");

    const { data, isPending, isError } = useQuery({
        queryKey: ["agent", "appointments"],
        queryFn: () => agentPortalApi.appointments(),
    });

    const allRows = useMemo<AppointmentRow[]>(
        () => (data?.data as AppointmentRow[] | undefined) ?? [],
        [data],
    );

    const rows = useMemo<AppointmentRow[]>(
        () =>
            statusFilter === "all"
                ? allRows
                : allRows.filter((r) => str(r.status) === statusFilter),
        [allRows, statusFilter],
    );

    const counts = useMemo(() => {
        const c: Record<string, number> = { pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
        for (const r of allRows) {
            const s = str(r.status) ?? "pending";
            if (s in c) c[s]++;
        }
        return c;
    }, [allRows]);

    return (
        <div className="space-y-6">
            <ScreenBackLink to="/dashboard/agent" label="Dashboard" hideFrom="md" />
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Site visits</h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    Manage client property viewings and update their status.
                </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                {(["all", "pending", "confirmed", "completed", "cancelled"] as ApptStatusFilter[]).map((f) => {
                    const active = statusFilter === f;
                    const count = f === "all" ? allRows.length : (counts[f] ?? 0);
                    return (
                        <button
                            key={f}
                            onClick={() => setStatusFilter(f)}
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors capitalize ${
                                active
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : `border-border bg-background hover:border-foreground/30 hover:text-foreground ${apptStatusFilterColors[f]}`
                            }`}
                        >
                            {apptStatusFilterLabels[f]}
                            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${active ? "bg-white/20" : "bg-muted text-muted-foreground"}`}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            <Card className="border-border/80 overflow-hidden p-0 shadow-sm">
                {isPending ? (
                    <DataTableSkeleton columnCount={6} />
                ) : isError ? (
                    <p className="text-destructive p-6">Could not load appointments.</p>
                ) : (
                    <DataTable
                        columns={columns}
                        data={rows}
                        searchPlaceholder="Search by client, location, property, status…"
                    />
                )}
            </Card>
        </div>
    );
};

export default AgentAppointmentsPage;
