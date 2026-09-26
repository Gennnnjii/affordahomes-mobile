import { clientPortalApi } from "@/db/api/client.portal.api";
import { asRecord, idStr, str } from "@/lib/record";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { DataTableSkeleton } from "@/components/app/DataTableSkeleton";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { ScreenBackLink } from "@/components/navigation/ScreenBackLink";
import { useQuery } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";

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
        id: "agent",
        accessorFn: (row) => {
            const a = asRecord(row.agent);
            return `${str(a.first_name) ?? ""} ${str(a.last_name) ?? ""}`.trim() || str(a.email) || "";
        },
        header: "Agent",
        cell: ({ getValue }) => (
            <span className="text-muted-foreground text-sm">{(getValue() as string) || "—"}</span>
        ),
    },
    {
        id: "property",
        accessorFn: (row) => str(asRecord(row.property).title) ?? "",
        header: "Property",
        cell: ({ getValue }) => (
            <span className="text-muted-foreground max-w-[160px] truncate block text-sm">
                {(getValue() as string) || "—"}
            </span>
        ),
    },
    {
        id: "cas",
        accessorFn: (row) => str(asRecord(row.slip).slip_number) ?? "",
        header: "CAS number",
        cell: ({ getValue }) => (
            <span className="text-muted-foreground whitespace-nowrap font-mono text-sm">
                {(getValue() as string) || "Not available"}
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
                        to="/dashboard/appointment/$appointmentId"
                        params={{ appointmentId: pk }}
                    >
                        Open
                    </Link>
                </Button>
            ) : null;
        },
        size: 80,
    },
];

const ClientAppointments = () => {
    const { data, isPending, isError } = useQuery({
        queryKey: ["client", "appointments"],
        queryFn: () => clientPortalApi.appointments(),
        refetchInterval: 2_000,
    });

    const rows = useMemo<AppointmentRow[]>(
        () => (data?.data as AppointmentRow[] | undefined) ?? [],
        [data],
    );

    return (
        <div className="space-y-6">
            <ScreenBackLink to="/dashboard" label="Dashboard" hideFrom="md" />
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Appointments &amp; CAS</h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    Review current and previous property site visits and their Client Appointment Slips.
                </p>
            </div>

            <Card className="border-border/80 overflow-hidden p-0 shadow-sm">
                {isPending ? (
                    <DataTableSkeleton columnCount={7} />
                ) : isError ? (
                    <p className="text-destructive p-6">Could not load appointments.</p>
                ) : (
                    <DataTable
                        columns={columns}
                        data={rows}
                        searchPlaceholder="Search by agent, location, property, CAS number, status…"
                    />
                )}
            </Card>
        </div>
    );
};

export default ClientAppointments;
