import { DataTableSkeleton } from "@/components/app/DataTableSkeleton";
import { ScreenBackLink } from "@/components/navigation/ScreenBackLink";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { adminResourceApi } from "@/db/api/admin.api";
import { getApiErrorMessage } from "@/lib/api-error";
import {
    formatOpenHouseDate,
    formatOpenHouseRegisteredAt,
    formatOpenHouseTimeRange,
} from "@/lib/open-house";
import { cn } from "@/lib/utils";
import type {
    OpenHouseEvent,
    OpenHouseRegistration,
} from "@/types/open-house";
import {
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type RegistrationRow = {
    [Key in keyof OpenHouseRegistration]: OpenHouseRegistration[Key];
};

const statusStyles: Record<OpenHouseEvent["status"], string> = {
    upcoming: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    ongoing: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const DetailField = ({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) => (
    <div className="min-w-0 space-y-1">
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            {label}
        </p>
        <div className="break-words text-sm">{children}</div>
    </div>
);

const capacitySummary = (event: OpenHouseEvent): string => {
    if (event.capacity === null) {
        return `Unlimited capacity; ${event.registrations_count} registered`;
    }
    const remaining = event.remaining_slots ?? 0;
    return `${event.registrations_count} of ${event.capacity} registered; ${remaining} slot${remaining === 1 ? "" : "s"} remaining`;
};

const AdminOpenHouseDetail = () => {
    const { eventId } = useParams({ strict: false }) as { eventId: string };
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedRegistration, setSelectedRegistration] =
        useState<OpenHouseRegistration | null>(null);

    const eventQuery = useQuery({
        queryKey: ["admin", "open-house", eventId],
        queryFn: () => adminResourceApi.openHouseEvent(eventId),
        enabled: Boolean(eventId),
    });
    const registrationsQuery = useQuery({
        queryKey: ["admin", "open-house", eventId, "registrations"],
        queryFn: () => adminResourceApi.openHouseRegistrations(eventId),
        enabled: Boolean(eventQuery.data?.data),
    });
    const deleteMutation = useMutation({
        mutationFn: () => adminResourceApi.deleteOpenHouseEvent(eventId),
        onSuccess: (response) => {
            void queryClient.invalidateQueries({
                queryKey: ["admin", "open-house"],
                exact: true,
            });
            queryClient.removeQueries({
                queryKey: ["admin", "open-house", eventId],
                exact: true,
            });
            queryClient.removeQueries({
                queryKey: ["admin", "open-house", eventId, "registrations"],
                exact: true,
            });
            setIsDeleteOpen(false);
            toast.success(response.message || "Open House event deleted.");
            navigate({ to: "/admin/open-house" });
        },
        onError: (error) => toast.error(getApiErrorMessage(error)),
    });

    const registrationRows = useMemo<RegistrationRow[]>(
        () => registrationsQuery.data?.data ?? [],
        [registrationsQuery.data],
    );
    const registrationColumns = useMemo<ColumnDef<RegistrationRow>[]>(
        () => [
            {
                id: "attendee",
                accessorFn: (row) => `${row.first_name} ${row.last_name}`,
                header: "Attendee",
                cell: ({ row }) => (
                    <div className="min-w-0">
                        <p className="truncate font-medium">
                            {`${row.original.first_name} ${row.original.last_name}`.trim() ||
                                "Name unavailable"}
                        </p>
                        <p className="text-muted-foreground truncate text-xs">
                            {row.original.email}
                        </p>
                    </div>
                ),
                size: 220,
            },
            {
                accessorKey: "phone",
                header: "Phone",
                cell: ({ getValue }) => String(getValue() || "Not provided"),
                size: 140,
            },
            {
                accessorKey: "property_interest",
                header: "Property interest",
                cell: ({ getValue }) => (
                    <span className="line-clamp-2 break-words">
                        {String(getValue() || "Not provided")}
                    </span>
                ),
                size: 210,
            },
            {
                accessorKey: "registered_at",
                header: "Registered",
                cell: ({ getValue }) => (
                    <span>{formatOpenHouseRegisteredAt(String(getValue()))}</span>
                ),
                size: 170,
            },
            {
                accessorKey: "status",
                header: "Status",
                cell: () => (
                    <span className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 inline-flex rounded-md px-2 py-0.5 text-xs font-semibold">
                        Registered
                    </span>
                ),
                size: 110,
            },
            {
                id: "actions",
                header: "",
                enableSorting: false,
                enableGlobalFilter: false,
                cell: ({ row }) => (
                    <div className="flex justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedRegistration(row.original)}
                        >
                            Review
                        </Button>
                    </div>
                ),
                size: 90,
            },
        ],
        [],
    );

    if (eventQuery.isPending) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-5 w-32" />
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
                    <Skeleton className="h-72 w-full rounded-xl" />
                    <Skeleton className="h-52 w-full rounded-xl" />
                </div>
            </div>
        );
    }

    if (eventQuery.isError || !eventQuery.data?.data) {
        return (
            <div className="space-y-6">
                <ScreenBackLink to="/admin/open-house" label="Open House" />
                <Card>
                    <CardContent className="space-y-4 pt-6">
                        <div>
                            <h1 className="text-xl font-semibold">
                                Open House event unavailable
                            </h1>
                            <p className="text-muted-foreground mt-1 text-sm">
                                {eventQuery.isError
                                    ? getApiErrorMessage(eventQuery.error)
                                    : "The event could not be found."}
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => void eventQuery.refetch()}
                        >
                            Try again
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const event = eventQuery.data.data;

    return (
        <div className="min-w-0 space-y-6">
            <ScreenBackLink to="/admin/open-house" label="Open House" />

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="break-words text-2xl font-semibold tracking-tight">
                            {event.title}
                        </h1>
                        <span
                            className={cn(
                                "inline-flex rounded-md px-2 py-0.5 text-xs font-semibold capitalize",
                                statusStyles[event.status],
                            )}
                        >
                            {event.status}
                        </span>
                    </div>
                    <p className="text-muted-foreground mt-1 break-words text-sm">
                        {event.project?.trim() || "AFFORDAHOMES Open House"}
                    </p>
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                    <Button variant="outline" className="w-full sm:w-auto" asChild>
                        <Link
                            to="/admin/open-house/$eventId/update"
                            params={{ eventId }}
                        >
                            Edit event
                        </Link>
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        className="w-full sm:w-auto"
                        onClick={() => setIsDeleteOpen(true)}
                    >
                        Delete event
                    </Button>
                </div>
            </div>

            <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                <Card className="border-border/80 min-w-0 shadow-sm">
                    <CardHeader>
                        <CardTitle>Event details</CardTitle>
                        <CardDescription>
                            Public schedule and venue information.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-5 sm:grid-cols-2">
                            <DetailField label="Date">
                                {formatOpenHouseDate(event.event_date)}
                            </DetailField>
                            <DetailField label="Time">
                                {formatOpenHouseTimeRange(
                                    event.start_time,
                                    event.end_time,
                                )}{" "}
                                Philippine time
                            </DetailField>
                            <DetailField label="Location">
                                {event.location || "Not provided"}
                            </DetailField>
                            <DetailField label="Project">
                                {event.project?.trim() || "Not provided"}
                            </DetailField>
                        </div>
                        <DetailField label="Description">
                            <p className="whitespace-pre-wrap break-words leading-relaxed">
                                {event.description?.trim() || "No description provided."}
                            </p>
                        </DetailField>
                    </CardContent>
                </Card>

                <Card className="border-border/80 min-w-0 shadow-sm">
                    <CardHeader>
                        <CardTitle>Registration</CardTitle>
                        <CardDescription>Current server-reported availability.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <DetailField label="Availability">
                            {event.registration_open ? "Registration open" : "Registration closed"}
                        </DetailField>
                        <DetailField label="Capacity">
                            {capacitySummary(event)}
                        </DetailField>
                        <DetailField label="Attendees">
                            <span className="text-2xl font-semibold tabular-nums">
                                {event.registrations_count}
                            </span>
                        </DetailField>
                        {event.registrations_count > 0 ? (
                            <p className="text-muted-foreground border-t pt-4 text-xs leading-relaxed">
                                Events with registrations cannot be deleted. Change the
                                status to Cancelled when the event should no longer proceed.
                            </p>
                        ) : null}
                    </CardContent>
                </Card>
            </div>

            <Card className="border-border/80 min-w-0 overflow-hidden p-0 shadow-sm">
                <CardHeader className="px-6 pt-6">
                    <CardTitle>Attendee registrations</CardTitle>
                    <CardDescription>
                        Authenticated client registration snapshots for this event.
                    </CardDescription>
                </CardHeader>
                {registrationsQuery.isPending ? (
                    <DataTableSkeleton columnCount={6} />
                ) : registrationsQuery.isError ? (
                    <CardContent className="space-y-4 pb-6">
                        <div>
                            <p className="font-medium">
                                Attendees could not be loaded.
                            </p>
                            <p className="text-muted-foreground mt-1 text-sm">
                                {getApiErrorMessage(registrationsQuery.error)}
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => void registrationsQuery.refetch()}
                        >
                            Try again
                        </Button>
                    </CardContent>
                ) : registrationRows.length === 0 ? (
                    <CardContent className="pb-10 text-center">
                        <p className="font-medium">No attendees registered</p>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Client registrations will appear here.
                        </p>
                    </CardContent>
                ) : (
                    <DataTable
                        columns={registrationColumns}
                        data={registrationRows}
                        searchPlaceholder="Search attendees by name, email, phone, or interest..."
                    />
                )}
            </Card>

            <Dialog
                open={Boolean(selectedRegistration)}
                onOpenChange={(open) => {
                    if (!open) setSelectedRegistration(null);
                }}
            >
                <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Attendee registration</DialogTitle>
                        <DialogDescription>
                            Read-only client contact snapshot and registration details.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedRegistration ? (
                        <div className="grid gap-5 rounded-lg border p-4 sm:grid-cols-2">
                            <DetailField label="Name">
                                {`${selectedRegistration.first_name} ${selectedRegistration.last_name}`.trim() ||
                                    "Name unavailable"}
                            </DetailField>
                            <DetailField label="Status">
                                <span className="capitalize">
                                    {selectedRegistration.status}
                                </span>
                            </DetailField>
                            <DetailField label="Email">
                                {selectedRegistration.email}
                            </DetailField>
                            <DetailField label="Phone">
                                {selectedRegistration.phone?.trim() || "Not provided"}
                            </DetailField>
                            <DetailField label="Registered">
                                {formatOpenHouseRegisteredAt(
                                    selectedRegistration.registered_at,
                                )}
                            </DetailField>
                            <DetailField label="Property interest">
                                {selectedRegistration.property_interest?.trim() ||
                                    "Not provided"}
                            </DetailField>
                            <div className="sm:col-span-2">
                                <DetailField label="Remarks">
                                    <p className="whitespace-pre-wrap break-words leading-relaxed">
                                        {selectedRegistration.remarks?.trim() ||
                                            "Not provided"}
                                    </p>
                                </DetailField>
                            </div>
                        </div>
                    ) : null}
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                Close
                            </Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={isDeleteOpen}
                onOpenChange={(open) => {
                    if (!deleteMutation.isPending) setIsDeleteOpen(open);
                }}
            >
                <DialogContent showCloseButton={!deleteMutation.isPending}>
                    <DialogHeader>
                        <DialogTitle>Delete Open House event?</DialogTitle>
                        <DialogDescription>
                            This permanently deletes the event and cannot be undone.
                            Events with attendee registrations are protected by the server.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="bg-muted/40 rounded-lg border p-4">
                        <p className="break-words font-medium">{event.title}</p>
                        <p className="text-muted-foreground mt-1 break-words text-sm">
                            {formatOpenHouseDate(event.event_date)} at {event.location}
                        </p>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsDeleteOpen(false)}
                            disabled={deleteMutation.isPending}
                        >
                            Keep event
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={() => deleteMutation.mutate()}
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending
                                ? "Deleting..."
                                : "Delete permanently"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminOpenHouseDetail;
