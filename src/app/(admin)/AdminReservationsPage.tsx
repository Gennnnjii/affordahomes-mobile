import { adminResourceApi } from "@/db/api/admin.api";
import { asRecord, idStr, str } from "@/lib/record";
import { getApiErrorMessage } from "@/lib/api-error";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { DataTableSkeleton } from "@/components/app/DataTableSkeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ScreenBackLink } from "@/components/navigation/ScreenBackLink";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { toast } from "sonner";

type ApptStatus = "pending" | "confirmed" | "completed" | "cancelled";
type ApptRow = Record<string, unknown>;

const STATUSES: ApptStatus[] = ["pending", "confirmed", "completed", "cancelled"];

const fmtWhen = (v: unknown) => {
    if (v == null || v === "") return "—";
    const d = new Date(String(v));
    if (Number.isNaN(d.getTime())) return String(v);
    return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
};

const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    cancelled: "bg-muted text-muted-foreground",
};

type StatusMutFn = (args: { id: string; status: ApptStatus }) => void;

const makeColumns = (
    mutate: StatusMutFn,
    isPending: boolean,
): ColumnDef<ApptRow>[] => [
        {
            id: "schedule",
            accessorFn: (row) => str(row.schedule) ?? "",
            header: "When",
            cell: ({ row }) => (
                <span className="whitespace-nowrap text-sm">{fmtWhen(row.original.schedule)}</span>
            ),
            size: 160,
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
                return (
                    `${str(c.first_name) ?? ""} ${str(c.last_name) ?? ""}`.trim() ||
                    str(c.email) ||
                    ""
                );
            },
            header: "Client",
            cell: ({ getValue }) => (
                <span className="max-w-[160px] truncate block text-sm">
                    {(getValue() as string) || "—"}
                </span>
            ),
        },
        {
            id: "agent",
            accessorFn: (row) => {
                const a = asRecord(row.agent);
                return (
                    `${str(a.first_name) ?? ""} ${str(a.last_name) ?? ""}`.trim() ||
                    str(a.email) ||
                    ""
                );
            },
            header: "Agent",
            cell: ({ getValue }) => (
                <span className="max-w-[160px] truncate block text-sm">
                    {(getValue() as string) || "—"}
                </span>
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
            id: "slip",
            accessorFn: (row) => str(asRecord(row.slip).slip_number) ?? "",
            header: "CAS / Slip",
            cell: ({ getValue }) => (
                <span className="font-mono text-xs">{(getValue() as string) || "—"}</span>
            ),
            size: 90,
        },
        {
            id: "status",
            accessorFn: (row) => str(row.status) ?? "pending",
            header: "Status",
            cell: ({ row }) => {
                const id = idStr(row.original.id);
                const st = (str(row.original.status) ?? "pending") as ApptStatus;
                const colorClass = statusColors[st] ?? statusColors.cancelled;
                return (
                    <div className="grid grid-cols-[80px_130px] items-center gap-2">
                        <div className="flex items-center">
                            <span
                                className={`rounded-md px-2 py-0.5 text-xs font-medium capitalize whitespace-nowrap ${colorClass}`}
                            >
                                {st}
                            </span>
                        </div>
                        <Select
                            value={st}
                            onValueChange={(v) => mutate({ id, status: v as ApptStatus })}
                            disabled={isPending}
                        >
                            <SelectTrigger className="h-7 w-[130px] text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {STATUSES.map((s) => (
                                    <SelectItem key={s} value={s} className="capitalize text-xs">
                                        {s}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                );
            },
            enableSorting: true,
            size: 240,
        },
    ];

const AdminAppointmentsPage = () => {
    const queryClient = useQueryClient();

    const listQ = useQuery({
        queryKey: ["admin", "appointments"],
        queryFn: () => adminResourceApi.appointments(),
    });

    const statusMut = useMutation({
        mutationFn: ({ id, status }: { id: string; status: ApptStatus }) =>
            adminResourceApi.updateAppointmentStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "appointments"] });
            toast.success("Status updated.");
        },
        onError: (e) => toast.error(getApiErrorMessage(e)),
    });

    const rows = useMemo<ApptRow[]>(
        () => (listQ.data?.data as ApptRow[] | undefined) ?? [],
        [listQ.data],
    );

    const columns = useMemo(
        () => makeColumns(statusMut.mutate, statusMut.isPending),
        [statusMut.mutate, statusMut.isPending],
    );

    return (
        <div className="space-y-6">
            <ScreenBackLink to="/admin" label="Dashboard" hideFrom="md" />
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Appointments</h1>
                <p className="text-muted-foreground mt-1 max-w-2xl text-sm leading-relaxed">
                    Central oversight of client appointments and CAS records. Status changes apply
                    system-wide; agents and clients continue managing their own views in their portals.
                </p>
            </div>

            <Card className="border-border/80 overflow-hidden p-0 shadow-sm">
                {listQ.isPending ? (
                    <DataTableSkeleton columnCount={7} />
                ) : listQ.isError ? (
                    <p className="text-destructive p-6">Could not load appointments.</p>
                ) : (
                    <DataTable
                        columns={columns}
                        data={rows}
                        searchPlaceholder="Search by client, agent, property, location, CAS number…"
                    />
                )}
            </Card>
        </div>
    );
};

export default AdminAppointmentsPage;
