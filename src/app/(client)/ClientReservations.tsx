import { clientPortalApi } from "@/db/api/client.portal.api";
import type { Reservation } from "@/types/reservation";
import { asRecord, str } from "@/lib/record";
import { publicStorageUrl } from "@/lib/storage-url";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { DataTableSkeleton } from "@/components/app/DataTableSkeleton";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { ScreenBackLink } from "@/components/navigation/ScreenBackLink";
import { useQuery } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { HomeIcon } from "lucide-react";

type ReservationRow = {
    [Key in keyof Reservation]: Reservation[Key];
};

const statusColors: Record<Reservation["status"], string> = {
    active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    sold: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
};

const fallbackStatusColor = "bg-muted text-muted-foreground";

const shortRef = (id: string) => (id.length >= 8 ? id.slice(-8).toUpperCase() : id.toUpperCase());

const formatAgent = (row: Reservation): string => {
    const a = asRecord(row.agent);
    return `${str(a.first_name) ?? ""} ${str(a.last_name) ?? ""}`.trim() || str(a.email) || "";
};

const formatReservedAt = (value?: string | null): string => {
    if (!value) return "";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
};

const columns: ColumnDef<ReservationRow>[] = [
    {
        id: "ref",
        accessorFn: (row) => `${row.id} ${row.remarks ?? ""}`,
        header: "Reservation",
        cell: ({ row }) => {
            const id = row.original.id;
            const remarks = row.original.remarks?.trim();
            return (
                <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="font-mono text-xs font-semibold tracking-tight">{shortRef(id)}</span>
                    <span className="text-muted-foreground line-clamp-2 text-xs">
                        {remarks || "No remarks provided"}
                    </span>
                </div>
            );
        },
        size: 148,
    },
    {
        id: "property",
        accessorFn: (row) => {
            const p = asRecord(row.property);
            return `${str(p.title) ?? ""} ${str(p.address) ?? ""} ${row.property_id}`;
        },
        header: "Property",
        cell: ({ row }) => {
            const p = asRecord(row.original.property);
            const title = str(p.title);
            const addr = str(p.address);
            const imgSrc = publicStorageUrl(str(p.main_image));
            if (!title && !addr && !imgSrc) {
                return (
                    <div className="flex min-w-0 flex-col gap-0.5">
                        <span className="text-muted-foreground text-xs italic">
                            Property details unavailable
                        </span>
                        {row.original.property_id ? (
                            <span className="text-muted-foreground font-mono text-xs">
                                Ref {shortRef(row.original.property_id)}
                            </span>
                        ) : null}
                    </div>
                );
            }
            return (
                <div className="flex min-w-0 items-center gap-3">
                    <div className="bg-muted relative size-12 shrink-0 overflow-hidden rounded-md border border-border/60">
                        {imgSrc ? (
                            <img src={imgSrc} alt="" className="size-full object-cover" />
                        ) : (
                            <div className="flex size-full items-center justify-center">
                                <HomeIcon className="text-muted-foreground size-4" />
                            </div>
                        )}
                    </div>
                    <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{title ?? "Untitled property"}</p>
                        <p className="text-muted-foreground line-clamp-2 text-xs leading-snug">
                            {addr ??
                                (row.original.property_id
                                    ? `Ref ${shortRef(row.original.property_id)}`
                                    : "Property details unavailable")}
                        </p>
                    </div>
                </div>
            );
        },
        size: 268,
    },
    {
        id: "agent",
        accessorFn: (row) => formatAgent(row),
        header: "Assigned agent",
        cell: ({ getValue }) => {
            const agentName = (getValue() as string).trim();
            if (!agentName) {
                return (
                    <span className="text-muted-foreground text-xs italic">
                        Agent details unavailable
                    </span>
                );
            }
            return <span className="text-muted-foreground block truncate text-sm">{agentName}</span>;
        },
        size: 160,
    },
    {
        id: "reservedAt",
        accessorFn: (row) => row.reserved_at ?? "",
        header: "Reserved",
        cell: ({ row }) => {
            const reservedAt = formatReservedAt(row.original.reserved_at);
            return reservedAt ? (
                <span className="text-muted-foreground text-sm">{reservedAt}</span>
            ) : (
                <span className="text-muted-foreground text-xs italic">Date unavailable</span>
            );
        },
        size: 168,
    },
    {
        id: "status",
        accessorFn: (row) => str(row.status) ?? "",
        header: "Status",
        cell: ({ row }) => {
            const st = row.original.status;
            const colorClass = statusColors[st] ?? fallbackStatusColor;
            return (
                <span className={`rounded-md px-2 py-0.5 text-xs font-medium capitalize ${colorClass}`}>
                    {st}
                </span>
            );
        },
        size: 120,
    },
    {
        id: "actions",
        header: "",
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) => {
            const pk = row.original.id;
            return pk ? (
                <Button variant="outline" size="sm" asChild>
                    <Link to="/dashboard/reservation/$reservationId" params={{ reservationId: pk }}>
                        Open
                    </Link>
                </Button>
            ) : null;
        },
        size: 88,
    },
];

const ClientReservations = () => {
    const { data, isPending, isError } = useQuery({
        queryKey: ["client", "reservations"],
        queryFn: () => clientPortalApi.reservations(),
        refetchInterval: 2_000,
    });

    const rows = useMemo<ReservationRow[]>(() => data?.data ?? [], [data]);

    return (
        <div className="space-y-6">
            <ScreenBackLink to="/dashboard" label="Dashboard" hideFrom="md" />
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Reservations</h1>
                <p className="text-muted-foreground mt-1 max-w-2xl text-sm leading-relaxed">
                    Track your property reservations and their current status with your assigned agent.
                </p>
            </div>

            <Card className="border-border/80 overflow-hidden p-0 shadow-sm">
                {isPending ? (
                    <DataTableSkeleton columnCount={6} />
                ) : isError ? (
                    <p className="text-destructive p-6">Could not load reservations.</p>
                ) : rows.length === 0 ? (
                    <div className="p-6">
                        <p className="text-sm font-medium">No reservations yet.</p>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Your property reservations will appear here once they are created.
                        </p>
                    </div>
                ) : (
                    <DataTable
                        columns={columns}
                        data={rows}
                        searchPlaceholder="Search by reference, remarks, property, agent, or status..."
                    />
                )}
            </Card>
        </div>
    );
};

export default ClientReservations;
