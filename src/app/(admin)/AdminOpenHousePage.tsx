import { DataTableSkeleton } from "@/components/app/DataTableSkeleton";
import { ScreenBackLink } from "@/components/navigation/ScreenBackLink";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { adminResourceApi } from "@/db/api/admin.api";
import { getApiErrorMessage } from "@/lib/api-error";
import { formatOpenHouseDate, formatOpenHouseTimeRange } from "@/lib/open-house";
import { cn } from "@/lib/utils";
import type { OpenHouseEvent } from "@/types/open-house";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { CalendarRangeIcon } from "lucide-react";
import { useMemo } from "react";

type OpenHouseEventRow = {
    [Key in keyof OpenHouseEvent]: OpenHouseEvent[Key];
};

const statusStyles: Record<OpenHouseEvent["status"], string> = {
    upcoming: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    ongoing: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const columns: ColumnDef<OpenHouseEventRow>[] = [
    {
        id: "event",
        accessorFn: (row) =>
            `${row.title} ${row.project ?? ""} ${row.location}`.trim(),
        header: "Event",
        cell: ({ row }) => (
            <div className="min-w-0">
                <p className="truncate font-medium" title={row.original.title}>
                    {row.original.title}
                </p>
                <p
                    className="text-muted-foreground truncate text-xs"
                    title={row.original.project ?? row.original.location}
                >
                    {row.original.project?.trim() || row.original.location}
                </p>
            </div>
        ),
        size: 220,
    },
    {
        id: "schedule",
        accessorFn: (row) =>
            `${row.event_date} ${row.start_time} ${row.end_time}`,
        header: "Schedule",
        cell: ({ row }) => (
            <div>
                <p className="font-medium">
                    {formatOpenHouseDate(row.original.event_date)}
                </p>
                <p className="text-muted-foreground text-xs">
                    {formatOpenHouseTimeRange(
                        row.original.start_time,
                        row.original.end_time,
                    )}
                    {" "}Philippine time
                </p>
            </div>
        ),
        size: 210,
    },
    {
        id: "status",
        accessorFn: (row) =>
            `${row.status} ${row.registration_open ? "registration open" : "registration closed"}`,
        header: "Status",
        cell: ({ row }) => (
            <div className="space-y-1.5">
                <span
                    className={cn(
                        "inline-flex rounded-md px-2 py-0.5 text-xs font-semibold capitalize",
                        statusStyles[row.original.status],
                    )}
                >
                    {row.original.status}
                </span>
                <p className="text-muted-foreground text-xs">
                    {row.original.registration_open
                        ? "Registration open"
                        : "Registration closed"}
                </p>
            </div>
        ),
        size: 150,
    },
    {
        id: "capacity",
        accessorFn: (row) =>
            row.capacity === null
                ? `unlimited ${row.registrations_count}`
                : `${row.capacity} ${row.remaining_slots ?? 0}`,
        header: "Capacity",
        cell: ({ row }) => (
            <div>
                <p className="font-medium tabular-nums">
                    {row.original.capacity === null
                        ? "Unlimited"
                        : `${row.original.registrations_count} / ${row.original.capacity}`}
                </p>
                <p className="text-muted-foreground text-xs">
                    {row.original.capacity === null
                        ? `${row.original.registrations_count} registered`
                        : row.original.remaining_slots === 1
                            ? "1 slot remaining"
                            : `${row.original.remaining_slots ?? 0} slots remaining`}
                </p>
            </div>
        ),
        size: 145,
    },
    {
        accessorKey: "registrations_count",
        header: "Attendees",
        cell: ({ getValue }) => (
            <span className="tabular-nums">{String(getValue())}</span>
        ),
        size: 95,
    },
    {
        id: "actions",
        header: "",
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) => (
            <div className="flex flex-wrap justify-end gap-2">
                <Button variant="outline" size="sm" asChild>
                    <Link
                        to="/admin/open-house/$eventId"
                        params={{ eventId: row.original.id }}
                    >
                        View
                    </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                    <Link
                        to="/admin/open-house/$eventId/update"
                        params={{ eventId: row.original.id }}
                    >
                        Edit
                    </Link>
                </Button>
            </div>
        ),
        size: 150,
    },
];

const AdminOpenHousePage = () => {
    const eventsQuery = useQuery({
        queryKey: ["admin", "open-house"],
        queryFn: () => adminResourceApi.openHouseEvents(),
        refetchInterval: 2_000
    });

    const rows = useMemo<OpenHouseEventRow[]>(
        () => eventsQuery.data?.data ?? [],
        [eventsQuery.data],
    );

    return (
        <div className="space-y-6">
            <ScreenBackLink to="/admin" label="Dashboard" hideFrom="md" />

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Open House
                    </h1>
                    <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
                        Create and manage AFFORDAHOMES events, capacity, and attendee records.
                    </p>
                </div>
                <Button className="w-full sm:w-auto" asChild>
                    <Link to="/admin/open-house/create">Create event</Link>
                </Button>
            </div>

            <Card className="border-border/80 min-w-0 overflow-hidden p-0 shadow-sm">
                {eventsQuery.isPending ? (
                    <DataTableSkeleton columnCount={6} />
                ) : eventsQuery.isError ? (
                    <CardContent className="space-y-4 p-6">
                        <div>
                            <p className="font-medium">
                                Open House events could not be loaded.
                            </p>
                            <p className="text-muted-foreground mt-1 text-sm">
                                {getApiErrorMessage(eventsQuery.error)}
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => void eventsQuery.refetch()}
                        >
                            Try again
                        </Button>
                    </CardContent>
                ) : rows.length === 0 ? (
                    <CardContent className="py-10 text-center">
                        <CalendarRangeIcon className="text-muted-foreground mx-auto size-10" />
                        <p className="mt-4 font-medium">No Open House events yet</p>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Create the first event when a viewing schedule is ready.
                        </p>
                        <Button className="mt-5 w-full sm:w-auto" asChild>
                            <Link to="/admin/open-house/create">Create event</Link>
                        </Button>
                    </CardContent>
                ) : (
                    <DataTable
                        columns={columns}
                        data={rows}
                        searchPlaceholder="Search events by title, project, location, or status..."
                    />
                )}
            </Card>
        </div>
    );
};

export default AdminOpenHousePage;
