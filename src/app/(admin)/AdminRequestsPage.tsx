import { adminResourceApi } from "@/db/api/admin.api";
import { getApiErrorMessage } from "@/lib/api-error";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { DataTableSkeleton } from "@/components/app/DataTableSkeleton";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ScreenBackLink } from "@/components/navigation/ScreenBackLink";
import type {
    AgentSummary,
    ClientSummary,
    PropertySummary,
    ReservationChangeRequest,
    ReservationChangeRequestStatus,
} from "@/types/reservation-change-request";
import type {
    AgentReassignmentRequest,
    AgentReassignmentRequestStatus,
} from "@/types/agent-reassignment-request";
import type {
    ReservationCancellationRequest,
    ReservationCancellationRequestStatus,
} from "@/types/reservation-cancellation-request";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

type RequestStatus =
    | ReservationChangeRequestStatus
    | AgentReassignmentRequestStatus
    | ReservationCancellationRequestStatus;
type StatusFilter = "all" | RequestStatus;
type Decision = "approve" | "reject";
type ReservationRequestRow = {
    [K in keyof ReservationChangeRequest]: ReservationChangeRequest[K];
};
type AgentRequestRow = {
    [K in keyof AgentReassignmentRequest]: AgentReassignmentRequest[K];
};
type CancellationRequestRow = {
    [K in keyof ReservationCancellationRequest]: ReservationCancellationRequest[K];
};
type ReviewSelection =
    | { kind: "property"; request: ReservationRequestRow }
    | { kind: "agent"; request: AgentRequestRow }
    | { kind: "cancellation"; request: CancellationRequestRow };
type DecisionArgs = {
    kind: ReviewSelection["kind"];
    id: string;
    decision: Decision;
    remarks: string;
};

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
    { value: "all", label: "All statuses" },
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
];

const statusColors: Record<RequestStatus, string> = {
    pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const formatDateTime = (value?: string | null): string => {
    if (!value) return "Date unavailable";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Date unavailable";
    return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
};

const shortRef = (id: string): string =>
    id.length >= 8 ? id.slice(-8).toUpperCase() : id.toUpperCase();

const clientName = (client?: ClientSummary | null): string => {
    if (!client) return "Client unavailable";
    return (
        `${client.first_name?.trim() ?? ""} ${client.last_name?.trim() ?? ""}`.trim() ||
        client.email?.trim() ||
        client.id
    );
};

const clientMeta = (client?: ClientSummary | null): string =>
    client?.email?.trim() || client?.phone?.trim() || "";

const propertyName = (property?: PropertySummary | null, fallbackId?: string | null): string =>
    property?.title?.trim() || fallbackId || "Property unavailable";

const propertyMeta = (property?: PropertySummary | null): string =>
    property?.address?.trim() || "";

const agentName = (agent?: AgentSummary | null, fallbackId?: string): string => {
    if (!agent) return fallbackId || "Agent unavailable";
    return (
        `${agent.first_name?.trim() ?? ""} ${agent.last_name?.trim() ?? ""}`.trim() ||
        agent.email?.trim() ||
        fallbackId ||
        agent.id
    );
};

const agentMeta = (agent?: AgentSummary | null, fallbackId?: string): string =>
    agent?.email?.trim() || agent?.mobile?.trim() || fallbackId || "";
const textValue = (value: unknown): string =>
    typeof value === "string" ? value.trim() : "";

const cancellationPropertyName = (request: CancellationRequestRow): string => {
    const property = request.reservation?.property;
    return (
        textValue(property?.title) ||
        request.reservation?.property_id ||
        "Property unavailable"
    );
};

const cancellationPropertyMeta = (request: CancellationRequestRow): string =>
    textValue(request.reservation?.property?.address);


const decisionDate = (request: {
    status: RequestStatus;
    approved_at?: string | null;
    rejected_at?: string | null;
}): string => {
    if (request.status === "approved") return formatDateTime(request.approved_at);
    if (request.status === "rejected") return formatDateTime(request.rejected_at);
    return "Pending decision";
};

const StatusBadge = ({ status }: { status: RequestStatus }) => (
    <span
        className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium capitalize whitespace-nowrap ${statusColors[status]}`}
    >
        {status}
    </span>
);

const EntityCell = ({ primary, secondary }: { primary: string; secondary?: string }) => (
    <div className="min-w-0 max-w-[190px]">
        <p className="truncate text-sm font-medium" title={primary}>{primary}</p>
        {secondary ? (
            <p className="text-muted-foreground truncate text-xs" title={secondary}>{secondary}</p>
        ) : null}
    </div>
);

const TextCell = ({ value, width = "max-w-[220px]" }: { value?: string | null; width?: string }) => {
    const text = value?.trim() || "Not provided";
    return <p className={`${width} truncate text-sm`} title={text}>{text}</p>;
};

const DetailField = ({ label, children, wide = false }: {
    label: string;
    children: ReactNode;
    wide?: boolean;
}) => (
    <div className={wide ? "sm:col-span-2" : undefined}>
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">{label}</p>
        <div className="mt-1 text-sm">{children}</div>
    </div>
);

const makeReservationColumns = (
    onReview: (request: ReservationRequestRow) => void,
): ColumnDef<ReservationRequestRow>[] => [
        {
            id: "client",
            accessorFn: (row) => `${clientName(row.client)} ${clientMeta(row.client)}`,
            header: "Client",
            cell: ({ row }) => (
                <EntityCell primary={clientName(row.original.client)} secondary={clientMeta(row.original.client)} />
            ),
        },
        {
            id: "reservation",
            accessorFn: (row) => row.reservation_id,
            header: "Reservation",
            cell: ({ row }) => (
                <span className="font-mono text-xs" title={row.original.reservation_id}>
                    {shortRef(row.original.reservation_id)}
                </span>
            ),
        },
        {
            id: "oldProperty",
            accessorFn: (row) => `${propertyName(row.old_property, row.old_property_id)} ${propertyMeta(row.old_property)}`,
            header: "Current property",
            cell: ({ row }) => (
                <EntityCell
                    primary={propertyName(row.original.old_property, row.original.old_property_id)}
                    secondary={propertyMeta(row.original.old_property)}
                />
            ),
        },
        {
            id: "newProperty",
            accessorFn: (row) => `${propertyName(row.new_property, row.new_property_id)} ${propertyMeta(row.new_property)}`,
            header: "Requested property",
            cell: ({ row }) => (
                <EntityCell
                    primary={propertyName(row.original.new_property, row.original.new_property_id)}
                    secondary={propertyMeta(row.original.new_property)}
                />
            ),
        },
        {
            accessorKey: "reason",
            header: "Client reason",
            cell: ({ row }) => <TextCell value={row.original.reason} />,
        },
        {
            id: "requestedAt",
            accessorFn: (row) => row.created_at ?? "",
            header: "Requested",
            cell: ({ row }) => (
                <span className="whitespace-nowrap text-xs">{formatDateTime(row.original.created_at)}</span>
            ),
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
        },
        {
            id: "adminRemarks",
            accessorFn: (row) => row.admin_remarks ?? "",
            header: "Admin remarks",
            cell: ({ row }) => <TextCell value={row.original.admin_remarks} width="max-w-[180px]" />,
        },
        {
            id: "decision",
            accessorFn: (row) => row.status === "approved" ? row.approved_at ?? "" : row.rejected_at ?? "",
            header: "Decision",
            cell: ({ row }) => <span className="whitespace-nowrap text-xs">{decisionDate(row.original)}</span>,
        },
        {
            id: "actions",
            header: "Action",
            cell: ({ row }) => (
                <Button type="button" variant="outline" size="sm" onClick={() => onReview(row.original)}>
                    Review
                </Button>
            ),
            enableSorting: false,
            size: 90,
        },
    ];

const makeAgentColumns = (
    onReview: (request: AgentRequestRow) => void,
): ColumnDef<AgentRequestRow>[] => [
        {
            id: "client",
            accessorFn: (row) => `${clientName(row.client)} ${clientMeta(row.client)}`,
            header: "Client",
            cell: ({ row }) => (
                <EntityCell primary={clientName(row.original.client)} secondary={clientMeta(row.original.client)} />
            ),
        },
        {
            id: "reservation",
            accessorFn: (row) => row.reservation_id,
            header: "Reservation",
            cell: ({ row }) => (
                <span className="font-mono text-xs" title={row.original.reservation_id}>
                    {shortRef(row.original.reservation_id)}
                </span>
            ),
        },
        {
            id: "oldAgent",
            accessorFn: (row) => `${agentName(row.old_agent, row.old_agent_id)} ${agentMeta(row.old_agent, row.old_agent_id)}`,
            header: "Current agent",
            cell: ({ row }) => (
                <EntityCell
                    primary={agentName(row.original.old_agent, row.original.old_agent_id)}
                    secondary={agentMeta(row.original.old_agent, row.original.old_agent_id)}
                />
            ),
        },
        {
            id: "newAgent",
            accessorFn: (row) => `${agentName(row.new_agent, row.new_agent_id)} ${agentMeta(row.new_agent, row.new_agent_id)}`,
            header: "Requested agent",
            cell: ({ row }) => (
                <EntityCell
                    primary={agentName(row.original.new_agent, row.original.new_agent_id)}
                    secondary={agentMeta(row.original.new_agent, row.original.new_agent_id)}
                />
            ),
        },
        {
            accessorKey: "reason",
            header: "Client reason",
            cell: ({ row }) => <TextCell value={row.original.reason} />,
        },
        {
            id: "requestedAt",
            accessorFn: (row) => row.created_at ?? "",
            header: "Requested",
            cell: ({ row }) => (
                <span className="whitespace-nowrap text-xs">{formatDateTime(row.original.created_at)}</span>
            ),
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
        },
        {
            id: "adminRemarks",
            accessorFn: (row) => row.admin_remarks ?? "",
            header: "Admin remarks",
            cell: ({ row }) => <TextCell value={row.original.admin_remarks} width="max-w-[180px]" />,
        },
        {
            id: "decision",
            accessorFn: (row) => row.status === "approved" ? row.approved_at ?? "" : row.rejected_at ?? "",
            header: "Decision",
            cell: ({ row }) => <span className="whitespace-nowrap text-xs">{decisionDate(row.original)}</span>,
        },
        {
            id: "actions",
            header: "Action",
            cell: ({ row }) => (
                <Button type="button" variant="outline" size="sm" onClick={() => onReview(row.original)}>
                    Review
                </Button>
            ),
            enableSorting: false,
            size: 90,
        },
    ];

const makeCancellationColumns = (
    onReview: (request: CancellationRequestRow) => void,
): ColumnDef<CancellationRequestRow>[] => [
        {
            id: "client",
            accessorFn: (row) => `${clientName(row.client)} ${clientMeta(row.client)}`,
            header: "Client",
            cell: ({ row }) => (
                <EntityCell
                    primary={clientName(row.original.client)}
                    secondary={clientMeta(row.original.client)}
                />
            ),
        },
        {
            id: "reservation",
            accessorFn: (row) => row.reservation_id,
            header: "Reservation",
            cell: ({ row }) => (
                <span className="font-mono text-xs" title={row.original.reservation_id}>
                    {shortRef(row.original.reservation_id)}
                </span>
            ),
        },
        {
            id: "property",
            accessorFn: (row) =>
                `${cancellationPropertyName(row)} ${cancellationPropertyMeta(row)}`,
            header: "Property",
            cell: ({ row }) => (
                <EntityCell
                    primary={cancellationPropertyName(row.original)}
                    secondary={cancellationPropertyMeta(row.original)}
                />
            ),
        },
        {
            accessorKey: "reason",
            header: "Client reason",
            cell: ({ row }) => <TextCell value={row.original.reason} />,
        },
        {
            id: "requestedAt",
            accessorFn: (row) => row.created_at ?? "",
            header: "Requested",
            cell: ({ row }) => (
                <span className="whitespace-nowrap text-xs">
                    {formatDateTime(row.original.created_at)}
                </span>
            ),
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
        },
        {
            id: "adminRemarks",
            accessorFn: (row) => row.admin_remarks ?? "",
            header: "Admin remarks",
            cell: ({ row }) => (
                <TextCell value={row.original.admin_remarks} width="max-w-[180px]" />
            ),
        },
        {
            id: "decision",
            accessorFn: (row) =>
                row.status === "approved" ? row.approved_at ?? "" : row.rejected_at ?? "",
            header: "Decision",
            cell: ({ row }) => (
                <span className="whitespace-nowrap text-xs">{decisionDate(row.original)}</span>
            ),
        },
        {
            id: "actions",
            header: "Action",
            cell: ({ row }) => (
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onReview(row.original)}
                >
                    Review
                </Button>
            ),
            enableSorting: false,
            size: 90,
        },
    ];

const AdminRequestsPage = () => {
    const queryClient = useQueryClient();
    const [reservationStatus, setReservationStatus] = useState<StatusFilter>("all");
    const [agentStatus, setAgentStatus] = useState<StatusFilter>("all");
    const [cancellationStatus, setCancellationStatus] = useState<StatusFilter>("all");
    const [selectedReview, setSelectedReview] = useState<ReviewSelection | null>(null);
    const [adminRemarks, setAdminRemarks] = useState("");
    const [pendingDecision, setPendingDecision] = useState<Decision | null>(null);

    const reservationRequestsQuery = useQuery({
        queryKey: ["admin", "reservation-change-requests", reservationStatus],
        queryFn: () => adminResourceApi.reservationChangeRequests(
            reservationStatus === "all" ? undefined : reservationStatus,
        ),
        refetchInterval: 2_000,
    });

    const agentRequestsQuery = useQuery({
        queryKey: ["admin", "agent-reassignment-requests", agentStatus],
        queryFn: () => adminResourceApi.agentReassignmentRequests(
            agentStatus === "all" ? undefined : agentStatus,
        ),
        refetchInterval: 2_000,
    });

    const cancellationRequestsQuery = useQuery({
        queryKey: ["admin", "reservation-cancellation-requests", cancellationStatus],
        queryFn: () => adminResourceApi.reservationCancellationRequests(
            cancellationStatus === "all" ? undefined : cancellationStatus,
        ),
        refetchInterval: 2_000,
    });

    const closeReview = useCallback(() => {
        setSelectedReview(null);
        setAdminRemarks("");
        setPendingDecision(null);
    }, []);

    const decisionMutation = useMutation({
        mutationFn: async ({ kind, id, decision, remarks }: DecisionArgs) => {
            if (kind === "property") {
                return decision === "approve"
                    ? adminResourceApi.approveReservationChangeRequest(id, remarks || undefined)
                    : adminResourceApi.rejectReservationChangeRequest(id, remarks);
            }

            if (kind === "agent") {
                return decision === "approve"
                    ? adminResourceApi.approveAgentReassignmentRequest(id, remarks || undefined)
                    : adminResourceApi.rejectAgentReassignmentRequest(id, remarks);
            }

            return decision === "approve"
                ? adminResourceApi.approveReservationCancellationRequest(id, remarks || undefined)
                : adminResourceApi.rejectReservationCancellationRequest(id, remarks);
        },
        onSuccess: (response, variables) => {
            const queryKey =
                variables.kind === "property"
                    ? ["admin", "reservation-change-requests"]
                    : variables.kind === "agent"
                        ? ["admin", "agent-reassignment-requests"]
                        : ["admin", "reservation-cancellation-requests"];
            void queryClient.invalidateQueries({ queryKey });
            toast.success(response.message || "Request updated successfully.");
            closeReview();
        },
        onError: (error) => {
            setPendingDecision(null);
            toast.error(getApiErrorMessage(error));
        },
    });

    const openReview = useCallback((selection: ReviewSelection) => {
        setSelectedReview(selection);
        setAdminRemarks(selection.request.admin_remarks ?? "");
        setPendingDecision(null);
    }, []);

    const reservationColumns = useMemo(
        () => makeReservationColumns((request) => openReview({ kind: "property", request })),
        [openReview],
    );
    const agentColumns = useMemo(
        () => makeAgentColumns((request) => openReview({ kind: "agent", request })),
        [openReview],
    );
    const cancellationColumns = useMemo(
        () => makeCancellationColumns((request) => openReview({ kind: "cancellation", request })),
        [openReview],
    );

    const reservationRows = useMemo<ReservationRequestRow[]>(
        () => reservationRequestsQuery.data?.data ?? [],
        [reservationRequestsQuery.data],
    );
    const agentRows = useMemo<AgentRequestRow[]>(
        () => agentRequestsQuery.data?.data ?? [],
        [agentRequestsQuery.data],
    );
    const cancellationRows = useMemo<CancellationRequestRow[]>(
        () => cancellationRequestsQuery.data?.data ?? [],
        [cancellationRequestsQuery.data],
    );

    const requestDecision = (decision: Decision) => {
        const remarks = adminRemarks.trim();
        if (remarks.length > 1000) {
            toast.error("Admin remarks must not exceed 1000 characters.");
            return;
        }
        if (decision === "reject" && !remarks) {
            toast.error("Admin remarks are required when rejecting a request.");
            return;
        }
        setPendingDecision(decision);
    };

    const confirmDecision = () => {
        if (!selectedReview || !pendingDecision || decisionMutation.isPending) return;
        const remarks = adminRemarks.trim();
        if (pendingDecision === "reject" && !remarks) {
            toast.error("Admin remarks are required when rejecting a request.");
            setPendingDecision(null);
            return;
        }
        decisionMutation.mutate({
            kind: selectedReview.kind,
            id: selectedReview.request.id,
            decision: pendingDecision,
            remarks,
        });
    };

    const selectedRequest = selectedReview?.request;
    const selectedIsPending = selectedRequest?.status === "pending";

    return (
        <div className="min-w-0 max-w-full space-y-6">
            <ScreenBackLink to="/admin" label="Dashboard" hideFrom="md" />
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Request management</h1>
                <p className="text-muted-foreground mt-1 max-w-3xl text-sm leading-relaxed">
                    Review property change, agent reassignment, and reservation cancellation
                    requests while keeping completed decisions available for reference.
                </p>
            </div>

            <Tabs defaultValue="property" className="min-w-0 max-w-full space-y-4">
                <TabsList className="h-auto flex-wrap justify-start">
                    <TabsTrigger value="property">Property changes</TabsTrigger>
                    <TabsTrigger value="agent">Agent reassignments</TabsTrigger>
                    <TabsTrigger value="cancellation">Reservation cancellations</TabsTrigger>
                </TabsList>

                <TabsContent value="property" className="min-w-0 max-w-full space-y-4">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="property-request-status">Status</Label>
                            <Select
                                value={reservationStatus}
                                onValueChange={(value) => setReservationStatus(value as StatusFilter)}
                            >
                                <SelectTrigger id="property-request-status" className="w-44">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {STATUS_FILTERS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <p className="text-muted-foreground text-sm">
                            {reservationRows.length} request{reservationRows.length === 1 ? "" : "s"}
                        </p>
                    </div>

                    <Card className="border-border/80 min-w-0 max-w-full overflow-hidden p-0 shadow-sm">
                        {reservationRequestsQuery.isPending ? (
                            <DataTableSkeleton columnCount={10} />
                        ) : reservationRequestsQuery.isError ? (
                            <p className="text-destructive p-6">Could not load property change requests.</p>
                        ) : (
                            <DataTable
                                columns={reservationColumns}
                                data={reservationRows}
                                searchPlaceholder="Search property change requests..."
                            />
                        )}
                    </Card>
                </TabsContent>

                <TabsContent value="agent" className="min-w-0 max-w-full space-y-4">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="agent-request-status">Status</Label>
                            <Select
                                value={agentStatus}
                                onValueChange={(value) => setAgentStatus(value as StatusFilter)}
                            >
                                <SelectTrigger id="agent-request-status" className="w-44">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {STATUS_FILTERS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <p className="text-muted-foreground text-sm">
                            {agentRows.length} request{agentRows.length === 1 ? "" : "s"}
                        </p>
                    </div>

                    <Card className="border-border/80 min-w-0 max-w-full overflow-hidden p-0 shadow-sm">
                        {agentRequestsQuery.isPending ? (
                            <DataTableSkeleton columnCount={10} />
                        ) : agentRequestsQuery.isError ? (
                            <p className="text-destructive p-6">Could not load agent reassignment requests.</p>
                        ) : (
                            <DataTable
                                columns={agentColumns}
                                data={agentRows}
                                searchPlaceholder="Search agent reassignment requests..."
                            />
                        )}
                    </Card>
                </TabsContent>
                <TabsContent value="cancellation" className="min-w-0 max-w-full space-y-4">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="cancellation-request-status">Status</Label>
                            <Select
                                value={cancellationStatus}
                                onValueChange={(value) =>
                                    setCancellationStatus(value as StatusFilter)
                                }
                            >
                                <SelectTrigger id="cancellation-request-status" className="w-44">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {STATUS_FILTERS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <p className="text-muted-foreground text-sm">
                            {cancellationRows.length} request
                            {cancellationRows.length === 1 ? "" : "s"}
                        </p>
                    </div>

                    <Card className="border-border/80 min-w-0 max-w-full overflow-hidden p-0 shadow-sm">
                        {cancellationRequestsQuery.isPending ? (
                            <DataTableSkeleton columnCount={9} />
                        ) : cancellationRequestsQuery.isError ? (
                            <p className="text-destructive p-6">
                                Could not load reservation cancellation requests.
                            </p>
                        ) : (
                            <DataTable
                                columns={cancellationColumns}
                                data={cancellationRows}
                                searchPlaceholder="Search reservation cancellation requests..."
                            />
                        )}
                    </Card>
                </TabsContent>

            </Tabs>

            <Dialog
                open={Boolean(selectedReview)}
                onOpenChange={(open) => {
                    if (!open && !decisionMutation.isPending) closeReview();
                }}
            >
                <DialogContent className="grid max-h-[90vh] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0 sm:max-w-2xl">
                    <DialogHeader className="border-b px-6 py-5 pr-12">
                        <DialogTitle>
                            Review{" "}
                            {selectedReview?.kind === "property"
                                ? "property change"
                                : selectedReview?.kind === "agent"
                                    ? "agent reassignment"
                                    : "reservation cancellation"}{" "}
                            request
                        </DialogTitle>
                        <DialogDescription>
                            Review the client request and its recorded decision details.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedReview ? (
                        <div className="min-h-0 space-y-5 overflow-y-auto px-6 py-5">
                            <section className="space-y-3">
                                <h3 className="text-sm font-semibold">Request details</h3>
                                <div className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2">
                                    <DetailField label="Client">
                                        <EntityCell
                                            primary={clientName(selectedReview.request.client)}
                                            secondary={clientMeta(selectedReview.request.client)}
                                        />
                                    </DetailField>
                                    <DetailField label="Reservation reference">
                                        <span className="font-mono text-xs" title={selectedReview.request.reservation_id}>
                                            {selectedReview.request.reservation_id}
                                        </span>
                                    </DetailField>
                                    {selectedReview.kind === "cancellation" ? (
                                        <>
                                            <DetailField label="Property">
                                                <EntityCell
                                                    primary={cancellationPropertyName(selectedReview.request)}
                                                    secondary={cancellationPropertyMeta(selectedReview.request)}
                                                />
                                            </DetailField>
                                            <DetailField label="Policy acknowledged">
                                                {formatDateTime(selectedReview.request.acknowledged_at)}
                                            </DetailField>
                                        </>
                                    ) : (
                                        <>
                                            <DetailField
                                                label={
                                                    selectedReview.kind === "property"
                                                        ? "Current property"
                                                        : "Current agent"
                                                }
                                            >
                                                {selectedReview.kind === "property" ? (
                                                    <EntityCell
                                                        primary={propertyName(
                                                            selectedReview.request.old_property,
                                                            selectedReview.request.old_property_id,
                                                        )}
                                                        secondary={propertyMeta(
                                                            selectedReview.request.old_property,
                                                        )}
                                                    />
                                                ) : (
                                                    <EntityCell
                                                        primary={agentName(
                                                            selectedReview.request.old_agent,
                                                            selectedReview.request.old_agent_id,
                                                        )}
                                                        secondary={agentMeta(
                                                            selectedReview.request.old_agent,
                                                            selectedReview.request.old_agent_id,
                                                        )}
                                                    />
                                                )}
                                            </DetailField>
                                            <DetailField
                                                label={
                                                    selectedReview.kind === "property"
                                                        ? "Requested property"
                                                        : "Requested agent"
                                                }
                                            >
                                                {selectedReview.kind === "property" ? (
                                                    <EntityCell
                                                        primary={propertyName(
                                                            selectedReview.request.new_property,
                                                            selectedReview.request.new_property_id,
                                                        )}
                                                        secondary={propertyMeta(
                                                            selectedReview.request.new_property,
                                                        )}
                                                    />
                                                ) : (
                                                    <EntityCell
                                                        primary={agentName(
                                                            selectedReview.request.new_agent,
                                                            selectedReview.request.new_agent_id,
                                                        )}
                                                        secondary={agentMeta(
                                                            selectedReview.request.new_agent,
                                                            selectedReview.request.new_agent_id,
                                                        )}
                                                    />
                                                )}
                                            </DetailField>
                                        </>
                                    )}
                                    <DetailField label="Requested">
                                        {formatDateTime(selectedReview.request.created_at)}
                                    </DetailField>
                                    <DetailField label="Status">
                                        <StatusBadge status={selectedReview.request.status} />
                                    </DetailField>
                                </div>
                            </section>

                            <section className="space-y-3">
                                <h3 className="text-sm font-semibold">Client reason</h3>
                                <div className="bg-muted/40 rounded-lg border p-4">
                                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                                        {selectedReview.request.reason.trim() || "Not provided"}
                                    </p>
                                </div>
                            </section>

                            {selectedReview.request.status !== "pending" ? (
                                <section className="space-y-3">
                                    <h3 className="text-sm font-semibold">Decision history</h3>
                                    <div className="bg-muted/30 space-y-4 rounded-lg border p-4">
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <DetailField label="Final status">
                                                <StatusBadge status={selectedReview.request.status} />
                                            </DetailField>
                                            <DetailField label="Decision timestamp">
                                                {decisionDate(selectedReview.request)}
                                            </DetailField>
                                        </div>
                                        <div className="border-t pt-4">
                                            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                                                Admin remarks
                                            </p>
                                            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed">
                                                {selectedReview.request.admin_remarks?.trim() || "Not provided"}
                                            </p>
                                        </div>
                                    </div>
                                </section>
                            ) : null}
                            {selectedIsPending ? (
                                <section className="space-y-3">
                                    <div>
                                        <h3 className="text-sm font-semibold">Admin decision</h3>
                                        <p className="text-muted-foreground mt-1 text-xs">
                                            Remarks are optional for approval and required for rejection.
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between gap-3">
                                            <Label htmlFor="admin-request-remarks">Admin remarks</Label>
                                            <span className="text-muted-foreground text-xs">
                                                {adminRemarks.length}/1000
                                            </span>
                                        </div>
                                        <Textarea
                                            id="admin-request-remarks"
                                            value={adminRemarks}
                                            onChange={(event) => setAdminRemarks(event.target.value)}
                                            maxLength={1000}
                                            rows={4}
                                            disabled={decisionMutation.isPending}
                                            placeholder="Add decision notes for the client..."
                                        />
                                    </div>
                                </section>
                            ) : null}

                            {selectedIsPending && pendingDecision ? (
                                <div className="bg-muted/50 space-y-2 rounded-lg border p-4">
                                    <p className="font-medium">
                                        Confirm {pendingDecision === "approve" ? "approval" : "rejection"}
                                    </p>
                                    <p className="text-muted-foreground text-sm">
                                        {selectedReview.kind === "cancellation"
                                            ? pendingDecision === "approve"
                                                ? "Approval triggers the server-authoritative reservation cancellation lifecycle and releases the reserved property."
                                                : "Rejection leaves the reservation unchanged. The client will see your remarks."
                                            : pendingDecision === "approve"
                                                ? "Approving applies this request to the reservation. Please confirm that you reviewed the requested change."
                                                : "Rejecting leaves the current reservation assignment unchanged. The client will see your remarks."}
                                    </p>
                                </div>
                            ) : null}
                        </div>
                    ) : null}

                    <DialogFooter className="border-t bg-background px-6 py-4 sm:items-center sm:justify-between">
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full sm:w-auto"
                            onClick={closeReview}
                            disabled={decisionMutation.isPending}
                        >
                            Close
                        </Button>
                        {selectedIsPending ? (
                            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                                {pendingDecision ? (
                                    <>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full sm:w-auto"
                                            onClick={() => setPendingDecision(null)}
                                            disabled={decisionMutation.isPending}
                                        >
                                            Back
                                        </Button>
                                        <Button
                                            type="button"
                                            className="w-full sm:w-auto"
                                            variant={pendingDecision === "reject" ? "destructive" : "default"}
                                            onClick={confirmDecision}
                                            disabled={decisionMutation.isPending}
                                        >
                                            {decisionMutation.isPending
                                                ? "Submitting..."
                                                : `Confirm ${pendingDecision === "approve" ? "approval" : "rejection"}`}
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button
                                            type="button"
                                            className="w-full sm:w-auto"
                                            onClick={() => requestDecision("approve")}
                                            disabled={decisionMutation.isPending}
                                        >
                                            Approve
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            className="w-full sm:w-auto"
                                            onClick={() => requestDecision("reject")}
                                            disabled={decisionMutation.isPending}
                                        >
                                            Reject
                                        </Button>
                                    </>
                                )}
                            </div>
                        ) : null}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminRequestsPage;
