import { clientPortalApi } from "@/db/api/client.portal.api";
import { publicApi } from "@/db/api/public.api";
import type {
    PropertySummary,
    ReservationChangeRequest,
    ReservationChangeRequestStatus,
} from "@/types/reservation-change-request";
import type { ReservationCancellationRequest } from "@/types/reservation-cancellation-request";
import { asRecord, str } from "@/lib/record";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessage } from "@/lib/api-error";
import { formatPhpCurrency } from "@/lib/format-php-currency";
import { publicStorageUrl } from "@/lib/storage-url";
import { useParams } from "@tanstack/react-router";
import { ScreenBackLink } from "@/components/navigation/ScreenBackLink";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
    FileTextIcon,
    HomeIcon,
    UserIcon,
} from "lucide-react";

const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    sold: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
};

const fallbackStatusColor = "bg-muted text-muted-foreground";

const shortRef = (id: string) => (id.length >= 8 ? id.slice(-8).toUpperCase() : id.toUpperCase());

const formatDateTime = (value?: string | null): string => {
    if (!value) return "Date unavailable";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Date unavailable";

    return date.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const changeRequestStatusColors: Record<ReservationChangeRequestStatus, string> = {
    pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const RequestStatusBadge = ({ status }: { status: ReservationChangeRequestStatus }) => (
    <span
        className={`rounded-md px-2.5 py-1 text-xs font-semibold capitalize ${changeRequestStatusColors[status]}`}
    >
        {status}
    </span>
);

const PropertySummaryView = ({ property }: { property: PropertySummary }) => {
    const title = property.title?.trim() || "Property title unavailable";
    const address = property.address?.trim() || "Property address unavailable";
    const imageUrl = publicStorageUrl(property.main_image);
    const price =
        property.price === null || property.price === undefined || property.price === ""
            ? "Price unavailable"
            : formatPhpCurrency(property.price);
    const propertyStatus = property.status?.trim() || "Status unavailable";

    return (
        <div className="flex min-w-0 gap-3 text-left">
            <div className="bg-muted flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg">
                {imageUrl ? (
                    <img src={imageUrl} alt={title} className="size-full object-cover" />
                ) : (
                    <HomeIcon className="text-muted-foreground size-6" strokeWidth={1.5} />
                )}
            </div>
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{title}</p>
                <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">{address}</p>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{price}</span>
                    <span className="bg-muted text-muted-foreground rounded px-2 py-0.5 text-[11px] font-medium capitalize">
                        {propertyStatus}
                    </span>
                </div>
            </div>
        </div>
    );
};

const ChangeRequestHistoryItem = ({
    request,
    status,
    dateLabel,
    dateValue,
}: {
    request: ReservationChangeRequest;
    status: "approved" | "rejected";
    dateLabel: string;
    dateValue?: string | null;
}) => (
    <div className="space-y-3 rounded-lg border p-3">
        <div className="flex items-center justify-between gap-3">
            <RequestStatusBadge status={status} />
            <span className="text-muted-foreground text-xs">
                {dateLabel}: {formatDateTime(dateValue)}
            </span>
        </div>
        {request.new_property ? (
            <PropertySummaryView property={request.new_property} />
        ) : (
            <p className="text-muted-foreground text-sm">Requested property unavailable.</p>
        )}
        {request.admin_remarks?.trim() ? (
            <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide">
                    {status === "approved" ? "Admin remarks" : "Rejection remarks"}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm">{request.admin_remarks}</p>
            </div>
        ) : status === "rejected" ? (
            <p className="text-muted-foreground text-sm italic">
                No rejection remarks provided.
            </p>
        ) : null}
    </div>
);

const CancellationRequestHistoryItem = ({
    request,
    status,
    dateLabel,
    dateValue,
}: {
    request: ReservationCancellationRequest;
    status: "approved" | "rejected";
    dateLabel: string;
    dateValue?: string | null;
}) => (
    <div className="space-y-3 rounded-lg border p-3">
        <div className="flex items-center justify-between gap-3">
            <RequestStatusBadge status={status} />
            <span className="text-muted-foreground text-xs">
                {dateLabel}: {formatDateTime(dateValue)}
            </span>
        </div>
        <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide">Reason</p>
            <p className="mt-1 whitespace-pre-wrap text-sm">{request.reason}</p>
        </div>
        <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide">Acknowledged</p>
            <p className="mt-1 text-sm">{formatDateTime(request.acknowledged_at)}</p>
        </div>
        {request.admin_remarks?.trim() ? (
            <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide">
                    Admin remarks
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm">{request.admin_remarks}</p>
            </div>
        ) : status === "rejected" ? (
            <p className="text-muted-foreground text-sm italic">No rejection remarks provided.</p>
        ) : null}
    </div>
);

const PageSkeleton = () => (
    <div className="space-y-6">
        <Skeleton className="h-9 w-28 rounded-md" />
        <div className="grid items-start gap-5 lg:grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => (
                <div
                    key={index}
                    className="border-border/80 space-y-4 rounded-xl border p-6 shadow-sm"
                >
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                </div>
            ))}
        </div>
    </div>
);

// ─── Main page ────────────────────────────────────────────────────────────────

const ClientReservationDetail = () => {
    const { reservationId } = useParams({ strict: false }) as { reservationId: string };

    const { data, isPending, isError } = useQuery({
        queryKey: ["client", "reservation", reservationId],
        queryFn: () => clientPortalApi.reservation(reservationId),
        refetchInterval: 2_000,
        enabled: !!reservationId,
    });

    const reservation = data?.data;
    const property = asRecord(reservation?.property);
    const agent = asRecord(reservation?.agent);

    const status = str(reservation?.status) ?? "unknown";
    const statusLabel = status === "unknown" ? "Status unavailable" : status;
    const colorClass = statusColors[status] ?? fallbackStatusColor;
    const reservationReference = str(reservation?.id) ?? reservationId;
    const remarks = reservation?.remarks?.trim() || "No remarks provided.";
    const reservedAt = formatDateTime(reservation?.reserved_at);
    const isActive = status === "active";
    const isCancelled = status === "cancelled";
    const currentReservationId = str(reservation?.id) ?? reservationId;
    const currentPropertyId = str(reservation?.property_id) ?? "";
    const reservationAgentId = str(reservation?.agent_id) ?? "";

    const propertyTitle = str(property.title) ?? "Property title unavailable";
    const propertyAddress = str(property.address) ?? "Property address unavailable";

    const agentFirstName = str(agent.first_name) ?? "";
    const agentLastName = str(agent.last_name) ?? "";
    const agentEmail = str(agent.email) ?? "";
    const agentMobile = str(agent.mobile) ?? "";
    const agentFullName = `${agentFirstName} ${agentLastName}`.trim();
    const agentDisplayName = agentFullName || agentEmail || "Assigned agent";
    const agentInitials =
        agentFullName
            .split(/\s+/)
            .filter(Boolean)
            .map((word) => word[0])
            .slice(0, 2)
            .join("") || "A";
    const hasAssignedAgent = Boolean(
        str(reservation?.agent_id) || str(agent.id) || agentFullName || agentEmail || agentMobile,
    );
    const hasAgentDetails = Boolean(agentFullName || agentEmail || agentMobile);

    const queryClient = useQueryClient();
    const invalidateLifecycleQueries = () => {
        void queryClient.invalidateQueries({
            queryKey: ["client", "reservation-change-requests"],
        });
        void queryClient.invalidateQueries({
            queryKey: ["client", "agent-reassignment-requests"],
        });
        void queryClient.invalidateQueries({
            queryKey: ["client", "reservation-cancellation-requests"],
        });
    };

    const [isChangeRequestOpen, setIsChangeRequestOpen] = useState(false);
    const [selectedPropertyId, setSelectedPropertyId] = useState("");
    const [changeRequestReason, setChangeRequestReason] = useState("");
    const [isCancelRequestOpen, setIsCancelRequestOpen] = useState(false);
    const [isCancellationRequestOpen, setIsCancellationRequestOpen] = useState(false);
    const [cancellationRequestReason, setCancellationRequestReason] = useState("");
    const [hasAcknowledgedCancellationPolicy, setHasAcknowledgedCancellationPolicy] =
        useState(false);
    const [isWithdrawCancellationRequestOpen, setIsWithdrawCancellationRequestOpen] =
        useState(false);

    const {
        data: changeRequestsData,
        isPending: isChangeRequestsPending,
        isError: isChangeRequestsError,
    } = useQuery({
        queryKey: ["client", "reservation-change-requests"],
        queryFn: () => clientPortalApi.reservationChangeRequests(),
    });

    const reservationRequests = (changeRequestsData?.data ?? []).filter(
        (request) => request.reservation_id === currentReservationId,
    );
    const pendingRequest = reservationRequests.find((request) => request.status === "pending");
    const latestApprovedRequest = reservationRequests.find(
        (request) => request.status === "approved",
    );
    const latestRejectedRequest = reservationRequests.find(
        (request) => request.status === "rejected",
    );


    const {
        data: cancellationRequestsData,
        isPending: isCancellationRequestsPending,
        isError: isCancellationRequestsError,
    } = useQuery({
        queryKey: ["client", "reservation-cancellation-requests"],
        queryFn: () => clientPortalApi.reservationCancellationRequests(),
        refetchInterval: 2_000,
    });

    const reservationCancellationRequests = (cancellationRequestsData?.data ?? []).filter(
        (request) => request.reservation_id === currentReservationId,
    );
    const pendingCancellationRequest = reservationCancellationRequests.find(
        (request) => request.status === "pending",
    );
    const latestApprovedCancellationRequest = reservationCancellationRequests.find(
        (request) => request.status === "approved",
    );
    const latestRejectedCancellationRequest = reservationCancellationRequests.find(
        (request) => request.status === "rejected",
    );
    const {
        data: candidatePropertiesData,
        isPending: isCandidatePropertiesPending,
        isError: isCandidatePropertiesError,
    } = useQuery({
        queryKey: ["public", "properties", "agent", reservationAgentId],
        queryFn: () => publicApi.properties({ agent_id: reservationAgentId }),
        enabled: isChangeRequestOpen && Boolean(reservationAgentId),
    });

    const candidateProperties = (candidatePropertiesData?.data ?? []).filter(
        (candidate) => candidate.status === "available" && candidate.id !== currentPropertyId,
    );
    const trimmedChangeRequestReason = changeRequestReason.trim();
    const trimmedCancellationRequestReason = cancellationRequestReason.trim();

    const createCancellationRequestMutation = useMutation({
        mutationFn: () => {
            if (!reservation?.id) {
                return Promise.reject(new Error("Reservation details are unavailable."));
            }

            if (!trimmedCancellationRequestReason) {
                return Promise.reject(new Error("A cancellation reason is required."));
            }

            if (!hasAcknowledgedCancellationPolicy) {
                return Promise.reject(
                    new Error("Please acknowledge the cancellation policy before submitting."),
                );
            }

            return clientPortalApi.createReservationCancellationRequest({
                reservation_id: reservation.id,
                reason: trimmedCancellationRequestReason,
                acknowledged: true,
            });
        },
        onSuccess: (response) => {
            toast.success(response.message || "Cancellation request submitted.");
            setCancellationRequestReason("");
            setHasAcknowledgedCancellationPolicy(false);
            setIsCancellationRequestOpen(false);
            invalidateLifecycleQueries();
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error));
        },
    });

    const withdrawCancellationRequestMutation = useMutation({
        mutationFn: () => {
            if (!pendingCancellationRequest?.id) {
                return Promise.reject(new Error("No pending cancellation request is available."));
            }

            return clientPortalApi.cancelReservationCancellationRequest(
                pendingCancellationRequest.id,
            );
        },
        onSuccess: (response) => {
            toast.success(response.message || "Cancellation request withdrawn.");
            setIsWithdrawCancellationRequestOpen(false);
            invalidateLifecycleQueries();
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error));
        },
    });


    const createChangeRequestMutation = useMutation({
        mutationFn: () => {
            if (!reservation?.id || !selectedPropertyId || !trimmedChangeRequestReason) {
                return Promise.reject(new Error("Complete all required change request fields."));
            }

            return clientPortalApi.createReservationChangeRequest({
                reservation_id: reservation.id,
                new_property_id: selectedPropertyId,
                reason: trimmedChangeRequestReason,
            });
        },
        onSuccess: (response) => {
            toast.success(response.message);
            setSelectedPropertyId("");
            setChangeRequestReason("");
            setIsChangeRequestOpen(false);
            invalidateLifecycleQueries();
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error));
        },
    });

    const cancelChangeRequestMutation = useMutation({
        mutationFn: () => {
            if (!pendingRequest?.id) {
                return Promise.reject(new Error("No pending change request is available."));
            }

            return clientPortalApi.cancelReservationChangeRequest(pendingRequest.id);
        },
        onSuccess: (response) => {
            toast.success(response.message);
            setIsCancelRequestOpen(false);
            invalidateLifecycleQueries();
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error));
        },
    });

    const canSubmitChangeRequest =
        Boolean(selectedPropertyId) &&
        trimmedChangeRequestReason.length > 0 &&
        trimmedChangeRequestReason.length <= 1000 &&
        !createChangeRequestMutation.isPending;

    const handleChangeRequestOpenChange = (open: boolean) => {
        if (createChangeRequestMutation.isPending) return;
        setIsChangeRequestOpen(open);
        if (!open) {
            setSelectedPropertyId("");
            setChangeRequestReason("");
        }
    };

    const handleCancelRequestOpenChange = (open: boolean) => {
        if (cancelChangeRequestMutation.isPending) return;
        setIsCancelRequestOpen(open);
    };

    const {
        data: agentReassignmentRequestsData,
        isPending: isAgentReassignmentsPending,
        isError: isAgentReassignmentsError,
    } = useQuery({
        queryKey: ["client", "agent-reassignment-requests"],
        queryFn: () => clientPortalApi.agentReassignmentRequests(),

    });

    const reservationAgentReassignments = (agentReassignmentRequestsData?.data ?? []).filter(
        (request) => request.reservation_id === currentReservationId,
    );
    const pendingAgentReassignment = reservationAgentReassignments.find(
        (request) => request.status === "pending",
    );

    const lifecycleRequestsReady =
        !isChangeRequestsPending &&
        !isChangeRequestsError &&
        !isAgentReassignmentsPending &&
        !isAgentReassignmentsError &&
        !isCancellationRequestsPending &&
        !isCancellationRequestsError;
    const canRequestChange =
        isActive &&
        Boolean(reservation?.id) &&
        Boolean(reservationAgentId) &&
        !pendingRequest &&
        !pendingAgentReassignment &&
        !pendingCancellationRequest &&
        lifecycleRequestsReady;
    const canRequestCancellation =
        isActive &&
        Boolean(reservation?.id) &&
        !pendingRequest &&
        !pendingAgentReassignment &&
        !pendingCancellationRequest &&
        lifecycleRequestsReady;
    const canSubmitCancellationRequest =
        trimmedCancellationRequestReason.length > 0 &&
        trimmedCancellationRequestReason.length <= 1000 &&
        hasAcknowledgedCancellationPolicy &&
        !createCancellationRequestMutation.isPending;

    const handleCancellationRequestOpenChange = (open: boolean) => {
        if (createCancellationRequestMutation.isPending) return;
        setIsCancellationRequestOpen(open);
        if (!open) {
            setCancellationRequestReason("");
            setHasAcknowledgedCancellationPolicy(false);
        }
    };

    const handleWithdrawCancellationRequestOpenChange = (open: boolean) => {
        if (withdrawCancellationRequestMutation.isPending) return;
        setIsWithdrawCancellationRequestOpen(open);
    };

    return (
        <div className="flex flex-col gap-5">
            <ScreenBackLink to="/dashboard/reservations" label="Reservations" hideFrom="md" />

            {isPending ? (
                <PageSkeleton />
            ) : isError ? (
                <p className="text-destructive">Could not load reservation.</p>
            ) : (
                <>
                    {/* ── Page header ── */}
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/10 flex size-9 shrink-0 items-center justify-center rounded-lg">
                                <FileTextIcon className="text-primary size-4" />
                            </div>
                            <div>
                                <h1 className="text-xl font-semibold leading-tight">
                                    Reservation details
                                </h1>
                                <p className="text-muted-foreground text-xs">
                                    Reference: {shortRef(reservationReference)}
                                </p>
                            </div>
                        </div>
                        <span
                            className={`rounded-md px-3 py-1 text-xs font-semibold capitalize ${colorClass}`}
                        >
                            {statusLabel}
                        </span>
                    </div>

                    {/* ── Reservation content ── */}
                    <div className="grid items-start gap-5 lg:grid-cols-2">
                        <div className="space-y-5">
                            {/* Reservation details */}
                            <Card className="border-border/80 shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                        Reservation
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Separator className="mb-4" />
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-muted-foreground text-xs uppercase tracking-wide">
                                                Reference
                                            </p>
                                            <p className="mt-1 break-all font-mono text-sm">
                                                {reservationReference}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground text-xs uppercase tracking-wide">
                                                Reserved
                                            </p>
                                            <p className="mt-1 text-sm">{reservedAt}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground text-xs uppercase tracking-wide">
                                                Remarks
                                            </p>
                                            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">
                                                {remarks}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-border/80 shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                        Property change request
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Separator className="mb-4" />
                                    {isChangeRequestsPending ? (
                                        <div className="space-y-3">
                                            <Skeleton className="h-5 w-24" />
                                            <Skeleton className="h-16 w-full" />
                                        </div>
                                    ) : isChangeRequestsError ? (
                                        <p className="text-destructive text-sm">
                                            Could not load reservation change requests.
                                        </p>
                                    ) : pendingRequest ? (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between gap-3">
                                                <RequestStatusBadge status="pending" />
                                                <span className="text-muted-foreground text-xs">
                                                    Submitted: {formatDateTime(pendingRequest.created_at)}
                                                </span>
                                            </div>
                                            {pendingRequest.new_property ? (
                                                <PropertySummaryView property={pendingRequest.new_property} />
                                            ) : (
                                                <p className="text-muted-foreground text-sm">
                                                    Requested property unavailable.
                                                </p>
                                            )}
                                            <div>
                                                <p className="text-muted-foreground text-xs uppercase tracking-wide">
                                                    Reason
                                                </p>
                                                <p className="mt-1 whitespace-pre-wrap text-sm">
                                                    {pendingRequest.reason}
                                                </p>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="w-full"
                                                onClick={() => setIsCancelRequestOpen(true)}
                                            >
                                                Cancel request
                                            </Button>
                                        </div>
                                    ) : canRequestChange ? (
                                        <div className="space-y-3">
                                            <p className="text-muted-foreground text-sm leading-relaxed">
                                                Request a different available property from your assigned agent.
                                            </p>
                                            <Button
                                                type="button"
                                                size="sm"
                                                className="w-full"
                                                onClick={() => setIsChangeRequestOpen(true)}
                                            >
                                                Request property change
                                            </Button>
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground text-sm">
                                            {!isActive
                                                ? "Property changes are only available for active reservations."
                                                : pendingCancellationRequest
                                                    ? "Resolve or cancel the pending reservation cancellation request first."
                                                    : pendingAgentReassignment
                                                        ? "Resolve or cancel the pending agent reassignment request first."
                                                        : !reservationAgentId
                                                            ? "An assigned agent is required to request a property change."
                                                            : "A property change request is currently unavailable."}
                                        </p>
                                    )}
                                </CardContent>
                            </Card>

                            {!isChangeRequestsPending &&
                                !isChangeRequestsError &&
                                (latestApprovedRequest || latestRejectedRequest) ? (
                                <Card className="border-border/80 shadow-sm">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                            Property change request history
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <Separator className="mb-4" />
                                        <div className="space-y-3">
                                            {latestApprovedRequest ? (
                                                <ChangeRequestHistoryItem
                                                    request={latestApprovedRequest}
                                                    status="approved"
                                                    dateLabel="Approved"
                                                    dateValue={latestApprovedRequest.approved_at}
                                                />
                                            ) : null}
                                            {latestRejectedRequest ? (
                                                <ChangeRequestHistoryItem
                                                    request={latestRejectedRequest}
                                                    status="rejected"
                                                    dateLabel="Rejected"
                                                    dateValue={latestRejectedRequest.rejected_at}
                                                />
                                            ) : null}
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : null}

                            <Card className="border-border/80 shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                        Assigned agent
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Separator className="mb-4" />
                                    {hasAssignedAgent ? (
                                        <div className="flex items-center gap-3">
                                            <div className="bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-primary">
                                                {agentInitials}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate font-medium">{agentDisplayName}</p>
                                                {agentEmail ? (
                                                    <p className="text-muted-foreground break-all text-xs">
                                                        {agentEmail}
                                                    </p>
                                                ) : null}
                                                {agentMobile ? (
                                                    <p className="text-muted-foreground text-xs">
                                                        {agentMobile}
                                                    </p>
                                                ) : null}
                                                {!hasAgentDetails ? (
                                                    <p className="text-muted-foreground text-xs italic">
                                                        Agent contact details unavailable.
                                                    </p>
                                                ) : null}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-muted/60 flex items-center gap-3 rounded-lg p-3">
                                            <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-full">
                                                <UserIcon className="text-muted-foreground size-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">
                                                    Agent details unavailable
                                                </p>
                                                <p className="text-muted-foreground text-xs">
                                                    Assigned agent information could not be loaded.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-5">
                            <Card className="border-border/80 shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                        Property
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Separator className="mb-4" />
                                    <p className="break-words text-sm font-medium">{propertyTitle}</p>
                                    <p className="text-muted-foreground mt-1 break-words text-xs leading-relaxed">
                                        {propertyAddress}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-border/80 shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                        Reservation cancellation request
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Separator className="mb-4" />
                                    {isCancellationRequestsPending ? (
                                        <div className="space-y-3">
                                            <Skeleton className="h-5 w-24" />
                                            <Skeleton className="h-16 w-full" />
                                        </div>
                                    ) : isCancellationRequestsError ? (
                                        <p className="text-destructive text-sm">
                                            Could not load reservation cancellation requests.
                                        </p>
                                    ) : pendingCancellationRequest ? (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between gap-3">
                                                <RequestStatusBadge status="pending" />
                                                <span className="text-muted-foreground text-xs">
                                                    Submitted: {formatDateTime(pendingCancellationRequest.created_at)}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground text-xs uppercase tracking-wide">
                                                    Reason
                                                </p>
                                                <p className="mt-1 whitespace-pre-wrap text-sm">
                                                    {pendingCancellationRequest.reason}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground text-xs uppercase tracking-wide">
                                                    Policy acknowledged
                                                </p>
                                                <p className="mt-1 text-sm">
                                                    {formatDateTime(pendingCancellationRequest.acknowledged_at)}
                                                </p>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="w-full"
                                                onClick={() => setIsWithdrawCancellationRequestOpen(true)}
                                            >
                                                Cancel request
                                            </Button>
                                        </div>
                                    ) : canRequestCancellation ? (
                                        <div className="space-y-3">
                                            <p className="text-muted-foreground text-sm leading-relaxed">
                                                Submit a cancellation request for Admin review. Your reservation
                                                remains active unless the request is approved.
                                            </p>
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="sm"
                                                className="w-full"
                                                onClick={() => setIsCancellationRequestOpen(true)}
                                            >
                                                Request reservation cancellation
                                            </Button>
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground text-sm">
                                            {!isActive
                                                ? "Cancellation requests are only available for active reservations."
                                                : pendingRequest
                                                    ? "Resolve or cancel the pending property change request first."
                                                    : pendingAgentReassignment
                                                        ? "Resolve or cancel the pending agent reassignment request first."
                                                        : "A reservation cancellation request is currently unavailable."}
                                        </p>
                                    )}
                                </CardContent>
                            </Card>

                            {!isCancellationRequestsPending &&
                                !isCancellationRequestsError &&
                                (latestApprovedCancellationRequest ||
                                    latestRejectedCancellationRequest) ? (
                                <Card className="border-border/80 shadow-sm">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                            Reservation cancellation request history
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <Separator className="mb-4" />
                                        <div className="space-y-3">
                                            {latestApprovedCancellationRequest ? (
                                                <CancellationRequestHistoryItem
                                                    request={latestApprovedCancellationRequest}
                                                    status="approved"
                                                    dateLabel="Approved"
                                                    dateValue={latestApprovedCancellationRequest.approved_at}
                                                />
                                            ) : null}
                                            {latestRejectedCancellationRequest ? (
                                                <CancellationRequestHistoryItem
                                                    request={latestRejectedCancellationRequest}
                                                    status="rejected"
                                                    dateLabel="Rejected"
                                                    dateValue={latestRejectedCancellationRequest.rejected_at}
                                                />
                                            ) : null}
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : null}

                            {isCancelled ? (
                                <Card className="border-border/80 shadow-sm">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                            Cancellation
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <Separator className="mb-4" />
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-muted-foreground text-xs uppercase tracking-wide">
                                                    Reason
                                                </p>
                                                <p className="mt-1 whitespace-pre-wrap text-sm">
                                                    {reservation?.cancellation_reason?.trim() ||
                                                        "No cancellation reason provided."}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground text-xs uppercase tracking-wide">
                                                    Cancelled
                                                </p>
                                                <p className="mt-1 text-sm">
                                                    {formatDateTime(reservation?.cancelled_at)}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : null}

                        </div>
                    </div>

                    <Dialog
                        open={isCancellationRequestOpen}
                        onOpenChange={handleCancellationRequestOpenChange}
                    >
                        <DialogContent className="sm:max-w-xl">
                            <DialogHeader>
                                <DialogTitle>Request reservation cancellation</DialogTitle>
                                <DialogDescription>
                                    Submit this request for Admin review. Your reservation is not cancelled
                                    immediately. If approved, the server-authoritative workflow may cancel the
                                    reservation and release the reserved property.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-5 py-2">
                                <div className="bg-muted/50 rounded-lg border p-4">
                                    <p className="text-sm leading-relaxed">
                                        Refund or forfeiture terms, if applicable, are subject to the
                                        company&rsquo;s approved reservation policy and are not automatically
                                        calculated by AFFORDAHOMES.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between gap-3">
                                        <Label htmlFor="cancellation-request-reason">Reason</Label>
                                        <span className="text-muted-foreground text-xs">
                                            {cancellationRequestReason.length}/1000
                                        </span>
                                    </div>
                                    <Textarea
                                        id="cancellation-request-reason"
                                        value={cancellationRequestReason}
                                        onChange={(event) =>
                                            setCancellationRequestReason(event.target.value)
                                        }
                                        maxLength={1000}
                                        rows={4}
                                        placeholder="Explain why you are requesting cancellation."
                                        disabled={createCancellationRequestMutation.isPending}
                                    />
                                </div>

                                <label
                                    htmlFor="cancellation-policy-acknowledgement"
                                    className="flex cursor-pointer items-start gap-3 rounded-lg border p-4"
                                >
                                    <input
                                        id="cancellation-policy-acknowledgement"
                                        type="checkbox"
                                        checked={hasAcknowledgedCancellationPolicy}
                                        onChange={(event) =>
                                            setHasAcknowledgedCancellationPolicy(event.target.checked)
                                        }
                                        disabled={createCancellationRequestMutation.isPending}
                                        className="mt-0.5 size-4 shrink-0 accent-primary"
                                    />
                                    <span className="text-sm leading-relaxed">
                                        I acknowledge that I have read and understand the cancellation policy
                                        statement above.
                                    </span>
                                </label>
                            </div>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={createCancellationRequestMutation.isPending}
                                    onClick={() => handleCancellationRequestOpenChange(false)}
                                >
                                    Keep reservation
                                </Button>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    disabled={!canSubmitCancellationRequest}
                                    onClick={() => createCancellationRequestMutation.mutate()}
                                >
                                    {createCancellationRequestMutation.isPending
                                        ? "Submitting..."
                                        : "Submit cancellation request"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog
                        open={isWithdrawCancellationRequestOpen}
                        onOpenChange={handleWithdrawCancellationRequestOpenChange}
                    >
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Cancel reservation cancellation request?</DialogTitle>
                                <DialogDescription>
                                    This withdraws only the pending cancellation request. The reservation,
                                    property, and current assignments remain unchanged.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={withdrawCancellationRequestMutation.isPending}
                                    onClick={() => handleWithdrawCancellationRequestOpenChange(false)}
                                >
                                    Keep request
                                </Button>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    disabled={withdrawCancellationRequestMutation.isPending}
                                    onClick={() => withdrawCancellationRequestMutation.mutate()}
                                >
                                    {withdrawCancellationRequestMutation.isPending
                                        ? "Cancelling..."
                                        : "Cancel request"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isChangeRequestOpen} onOpenChange={handleChangeRequestOpenChange}>
                        <DialogContent className="sm:max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Request a property change</DialogTitle>
                                <DialogDescription>
                                    Choose another available property from your assigned agent and explain
                                    why you would like to change your reservation.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-5 py-2">
                                <div className="space-y-2">
                                    <Label>Available properties</Label>
                                    {isCandidatePropertiesPending ? (
                                        <div className="space-y-2">
                                            <Skeleton className="h-20 w-full" />
                                            <Skeleton className="h-20 w-full" />
                                        </div>
                                    ) : isCandidatePropertiesError ? (
                                        <p className="text-destructive rounded-lg border border-dashed p-4 text-sm">
                                            Could not load available properties.
                                        </p>
                                    ) : candidateProperties.length === 0 ? (
                                        <div className="rounded-lg border border-dashed p-5 text-center">
                                            <HomeIcon className="text-muted-foreground mx-auto size-7" strokeWidth={1.5} />
                                            <p className="mt-2 text-sm font-medium">No properties available</p>
                                            <p className="text-muted-foreground mt-1 text-xs">
                                                Your assigned agent has no other available properties right now.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="max-h-[340px] space-y-2 overflow-y-auto pr-1">
                                            {candidateProperties.map((candidate) => {
                                                const isSelected = selectedPropertyId === candidate.id;
                                                return (
                                                    <button
                                                        key={candidate.id}
                                                        type="button"
                                                        aria-pressed={isSelected}
                                                        className={`w-full rounded-lg border p-3 transition-colors ${isSelected
                                                            ? "border-primary bg-primary/5 ring-primary/20 ring-2"
                                                            : "border-border hover:bg-muted/50"
                                                            }`}
                                                        onClick={() => setSelectedPropertyId(candidate.id)}
                                                    >
                                                        <PropertySummaryView property={candidate} />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between gap-3">
                                        <Label htmlFor="change-request-reason">Reason</Label>
                                        <span className="text-muted-foreground text-xs">
                                            {changeRequestReason.length}/1000
                                        </span>
                                    </div>
                                    <Textarea
                                        id="change-request-reason"
                                        value={changeRequestReason}
                                        onChange={(event) => setChangeRequestReason(event.target.value)}
                                        maxLength={1000}
                                        rows={4}
                                        placeholder="Explain why you would like to change properties."
                                        disabled={createChangeRequestMutation.isPending}
                                    />
                                </div>
                            </div>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={createChangeRequestMutation.isPending}
                                    onClick={() => handleChangeRequestOpenChange(false)}
                                >
                                    Keep current property
                                </Button>
                                <Button
                                    type="button"
                                    disabled={!canSubmitChangeRequest}
                                    onClick={() => createChangeRequestMutation.mutate()}
                                >
                                    {createChangeRequestMutation.isPending
                                        ? "Submitting..."
                                        : "Submit request"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog
                        open={isCancelRequestOpen}
                        onOpenChange={handleCancelRequestOpenChange}
                    >
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Cancel property change request?</DialogTitle>
                                <DialogDescription>
                                    This will withdraw your pending request. Your current reservation and
                                    property will remain unchanged.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={cancelChangeRequestMutation.isPending}
                                    onClick={() => handleCancelRequestOpenChange(false)}
                                >
                                    Keep request
                                </Button>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    disabled={cancelChangeRequestMutation.isPending}
                                    onClick={() => cancelChangeRequestMutation.mutate()}
                                >
                                    {cancelChangeRequestMutation.isPending
                                        ? "Cancelling..."
                                        : "Cancel request"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                </>
            )}
        </div>
    );
};

export default ClientReservationDetail;
