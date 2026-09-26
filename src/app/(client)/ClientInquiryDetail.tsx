import { ScreenBackLink } from "@/components/navigation/ScreenBackLink";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { clientPortalApi } from "@/db/api/client.portal.api";
import { publicApi } from "@/db/api/public.api";
import { getApiErrorMessage } from "@/lib/api-error";
import { formatPhpCurrency } from "@/lib/format-php-currency";
import { publicStorageUrl } from "@/lib/storage-url";
import { cn } from "@/lib/utils";
import type { AgentReassignmentRequest } from "@/types/agent-reassignment-request";
import type { CreateClientAppointmentPayload } from "@/types/inquiry-appointment";
import type { AgentSummary } from "@/types/reservation-change-request";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import {
    BotIcon,
    Building2Icon,
    CalendarClockIcon,
    CalendarPlusIcon,
    MailIcon,
    MapPinIcon,
    MessageSquareTextIcon,
    PhoneIcon,
    UserRoundIcon,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

const statusStyles: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    responded: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    closed: "bg-muted text-muted-foreground",
};

const siteVisitStatusStyles: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
};

const reassignmentStatusStyles: Record<AgentReassignmentRequest["status"], string> = {
    pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const statusLabel = (status: string) => {
    if (status === "pending") return "Pending";
    if (status === "responded") return "Responded";
    if (status === "closed") return "Closed";
    return "Status unavailable";
};

const statusDescription = (status: string) => {
    if (status === "pending") {
        return "Your inquiry is awaiting review or follow-up from an available agent.";
    }
    if (status === "responded") {
        return "An agent has started responding to or following up on this inquiry.";
    }
    if (status === "closed") {
        return "This inquiry is closed. Its details remain available for your records.";
    }
    return "The current inquiry status could not be recognized.";
};

const sourceLabel = (source?: string | null) => {
    if (source === "ai_chat") return "Nexia assistance";
    if (!source || source === "manual") return "Property inquiry";
    return source.replace(/_/g, " ");
};

const formatDate = (value?: string | null) => {
    if (!value) return "Date unavailable";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Date unavailable";
    return date.toLocaleString(undefined, {
        dateStyle: "long",
        timeStyle: "short",
    });
};

const ReassignmentStatusBadge = ({
    status,
}: {
    status: AgentReassignmentRequest["status"];
}) => (
    <span
        className={cn(
            "rounded-md px-2.5 py-1 text-xs font-semibold capitalize",
            reassignmentStatusStyles[status],
        )}
    >
        {status}
    </span>
);

const AgentSummaryView = ({ agent }: { agent: AgentSummary }) => {
    const firstName = agent.first_name?.trim() || "";
    const lastName = agent.last_name?.trim() || "";
    const name = `${firstName} ${lastName}`.trim() || agent.email?.trim() || "Agent";
    const initials =
        `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() ||
        name.charAt(0).toUpperCase() ||
        "A";
    const photoUrl = publicStorageUrl(agent.profile_picture);

    return (
        <div className="flex min-w-0 items-center gap-3 text-left">
            <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-semibold text-primary">
                {photoUrl ? (
                    <img
                        src={photoUrl}
                        alt={name}
                        className="size-full object-cover object-top"
                    />
                ) : (
                    initials
                )}
            </div>
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{name}</p>
                {agent.email?.trim() ? (
                    <p className="text-muted-foreground truncate text-xs">{agent.email.trim()}</p>
                ) : null}
                {agent.mobile?.trim() ? (
                    <p className="text-muted-foreground text-xs">{agent.mobile.trim()}</p>
                ) : null}
            </div>
        </div>
    );
};

const AgentReassignmentHistoryItem = ({
    request,
    status,
    dateLabel,
    dateValue,
}: {
    request: AgentReassignmentRequest;
    status: "approved" | "rejected";
    dateLabel: string;
    dateValue?: string | null;
}) => (
    <div className="space-y-3 rounded-lg border p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
            <ReassignmentStatusBadge status={status} />
            <span className="text-muted-foreground text-xs">
                {dateLabel}: {formatDate(dateValue)}
            </span>
        </div>
        {request.new_agent ? (
            <AgentSummaryView agent={request.new_agent} />
        ) : (
            <p className="text-muted-foreground text-sm">Requested agent unavailable.</p>
        )}
        <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide">Reason</p>
            <p className="mt-1 whitespace-pre-wrap break-words text-sm">{request.reason}</p>
        </div>
        {request.admin_remarks?.trim() ? (
            <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide">
                    Admin remarks
                </p>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm">
                    {request.admin_remarks}
                </p>
            </div>
        ) : null}
    </div>
);

const padDateTimePart = (value: number) => String(value).padStart(2, "0");

const toLocalDateTimeInput = (date: Date) =>
    `${date.getFullYear()}-${padDateTimePart(date.getMonth() + 1)}-${padDateTimePart(date.getDate())}T${padDateTimePart(date.getHours())}:${padDateTimePart(date.getMinutes())}`;

const formatLocalDateTimeForApi = (date: Date) =>
    `${date.getFullYear()}-${padDateTimePart(date.getMonth() + 1)}-${padDateTimePart(date.getDate())} ${padDateTimePart(date.getHours())}:${padDateTimePart(date.getMinutes())}:${padDateTimePart(date.getSeconds())}`;

const InquiryDetailSkeleton = () => (
    <div className="space-y-6">
        <Skeleton className="h-9 w-28 rounded-md" />
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-4">
                <Skeleton className="h-40 w-full rounded-xl" />
                <Skeleton className="h-52 w-full rounded-xl" />
            </div>
            <div className="space-y-4">
                <Skeleton className="h-44 w-full rounded-xl" />
                <Skeleton className="h-36 w-full rounded-xl" />
            </div>
        </div>
    </div>
);

const ClientInquiryDetail = () => {
    const { inquiryId } = useParams({ strict: false }) as { inquiryId: string };
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isSiteVisitOpen, setIsSiteVisitOpen] = useState(false);
    const [siteVisitSchedule, setSiteVisitSchedule] = useState("");
    const [siteVisitLocation, setSiteVisitLocation] = useState("");
    const [siteVisitNotes, setSiteVisitNotes] = useState("");
    const [siteVisitFormError, setSiteVisitFormError] = useState("");
    const [isAgentReassignmentOpen, setIsAgentReassignmentOpen] = useState(false);
    const [selectedAgentId, setSelectedAgentId] = useState("");
    const [agentReassignmentReason, setAgentReassignmentReason] = useState("");
    const [isCancelAgentReassignmentOpen, setIsCancelAgentReassignmentOpen] = useState(false);

    const inquiryQuery = useQuery({
        queryKey: ["client", "inquiries", inquiryId],
        queryFn: () => clientPortalApi.inquiry(inquiryId),
        enabled: Boolean(inquiryId),
    });

    const inquiry = inquiryQuery.data?.data;
    const inquiryStatus = String(inquiry?.status ?? "");
    const isSiteVisitEligible =
        (inquiryStatus === "pending" || inquiryStatus === "responded") &&
        Boolean(inquiry?.agent_id) &&
        Boolean(inquiry?.property_id);

    const appointmentsQuery = useQuery({
        queryKey: ["client", "appointments"],
        queryFn: () => clientPortalApi.appointments(),
        enabled: Boolean(inquiry?.id) && isSiteVisitEligible,
    });

    const activeAppointment = appointmentsQuery.data?.data.find(
        (appointment) =>
            appointment.inquiry_id === inquiry?.id &&
            (appointment.status === "pending" || appointment.status === "confirmed"),
    );

    const reservationsQuery = useQuery({
        queryKey: ["client", "reservations"],
        queryFn: () => clientPortalApi.reservations(),
        enabled: Boolean(inquiry?.id),
    });
    const linkedReservation = reservationsQuery.data?.data.find(
        (reservation) => reservation.inquiry_id === inquiry?.id,
    );
    const linkedReservationId = linkedReservation?.id ?? "";
    const reservationAgentId = linkedReservation?.agent_id?.trim() ?? "";

    const propertyChangeRequestsQuery = useQuery({
        queryKey: ["client", "reservation-change-requests"],
        queryFn: () => clientPortalApi.reservationChangeRequests(),

        enabled: Boolean(linkedReservationId),
    });
    const cancellationRequestsQuery = useQuery({
        queryKey: ["client", "reservation-cancellation-requests"],
        queryFn: () => clientPortalApi.reservationCancellationRequests(),

        enabled: Boolean(linkedReservationId),
    });
    const agentReassignmentRequestsQuery = useQuery({
        queryKey: ["client", "agent-reassignment-requests"],
        queryFn: () => clientPortalApi.agentReassignmentRequests(),

        enabled: Boolean(linkedReservationId),
    });

    const linkedPropertyChangeRequests = (propertyChangeRequestsQuery.data?.data ?? []).filter(
        (request) => request.reservation_id === linkedReservationId,
    );
    const linkedCancellationRequests = (cancellationRequestsQuery.data?.data ?? []).filter(
        (request) => request.reservation_id === linkedReservationId,
    );
    const linkedAgentReassignmentRequests = (
        agentReassignmentRequestsQuery.data?.data ?? []
    ).filter((request) => request.reservation_id === linkedReservationId);
    const pendingPropertyChangeRequest = linkedPropertyChangeRequests.find(
        (request) => request.status === "pending",
    );
    const pendingCancellationRequest = linkedCancellationRequests.find(
        (request) => request.status === "pending",
    );
    const pendingAgentReassignment = linkedAgentReassignmentRequests.find(
        (request) => request.status === "pending",
    );
    const latestApprovedAgentReassignment = linkedAgentReassignmentRequests.find(
        (request) => request.status === "approved",
    );
    const latestRejectedAgentReassignment = linkedAgentReassignmentRequests.find(
        (request) => request.status === "rejected",
    );

    const lifecycleQueriesPending =
        Boolean(linkedReservationId) &&
        (propertyChangeRequestsQuery.isPending ||
            propertyChangeRequestsQuery.isFetching ||
            cancellationRequestsQuery.isPending ||
            cancellationRequestsQuery.isFetching ||
            agentReassignmentRequestsQuery.isPending ||
            agentReassignmentRequestsQuery.isFetching);
    const lifecycleQueriesError =
        Boolean(linkedReservationId) &&
        (propertyChangeRequestsQuery.isError ||
            cancellationRequestsQuery.isError ||
            agentReassignmentRequestsQuery.isError);
    const lifecycleRequestsReady =
        Boolean(linkedReservationId) &&
        propertyChangeRequestsQuery.isSuccess &&
        cancellationRequestsQuery.isSuccess &&
        agentReassignmentRequestsQuery.isSuccess;
    const canRequestAgentReassignment =
        reservationsQuery.isSuccess &&
        !reservationsQuery.isFetching &&
        !lifecycleQueriesPending &&
        linkedReservation?.status === "active" &&
        Boolean(linkedReservationId) &&
        Boolean(reservationAgentId) &&
        !pendingPropertyChangeRequest &&
        !pendingCancellationRequest &&
        !pendingAgentReassignment &&
        lifecycleRequestsReady;

    const agentDirectoryQuery = useQuery({
        queryKey: ["public", "agents"],
        queryFn: () => publicApi.agents(),
        enabled: isAgentReassignmentOpen,
    });
    const selectableAgents = (agentDirectoryQuery.data?.data ?? []).filter(
        (directoryAgent) => directoryAgent.id !== reservationAgentId,
    );
    const trimmedAgentReassignmentReason = agentReassignmentReason.trim();

    const refreshReassignmentContext = () => {
        void queryClient.invalidateQueries({ queryKey: ["client", "inquiries"] });
        if (inquiryId) {
            void queryClient.invalidateQueries({
                queryKey: ["client", "inquiries", inquiryId],
                exact: true,
            });
        }
        void queryClient.invalidateQueries({ queryKey: ["client", "reservations"] });
        if (linkedReservationId) {
            void queryClient.invalidateQueries({
                queryKey: ["client", "reservation", linkedReservationId],
                exact: true,
            });
        }
        void queryClient.invalidateQueries({
            queryKey: ["client", "reservation-change-requests"],
        });
        void queryClient.invalidateQueries({
            queryKey: ["client", "reservation-cancellation-requests"],
        });
        void queryClient.invalidateQueries({
            queryKey: ["client", "agent-reassignment-requests"],
        });
    };

    const createAgentReassignmentMutation = useMutation({
        mutationFn: () => {
            if (
                !canRequestAgentReassignment ||
                !linkedReservationId ||
                !selectedAgentId ||
                !trimmedAgentReassignmentReason
            ) {
                return Promise.reject(new Error("Complete all required reassignment fields."));
            }

            return clientPortalApi.createAgentReassignmentRequest({
                reservation_id: linkedReservationId,
                new_agent_id: selectedAgentId,
                reason: trimmedAgentReassignmentReason,
            });
        },
        onSuccess: (response) => {
            toast.success(response.message || "Agent reassignment request submitted.");
            setSelectedAgentId("");
            setAgentReassignmentReason("");
            setIsAgentReassignmentOpen(false);
            refreshReassignmentContext();
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error));
            refreshReassignmentContext();
        },
    });

    const cancelAgentReassignmentMutation = useMutation({
        mutationFn: () => {
            if (!pendingAgentReassignment?.id) {
                return Promise.reject(new Error("No pending agent reassignment is available."));
            }

            return clientPortalApi.cancelAgentReassignmentRequest(pendingAgentReassignment.id);
        },
        onSuccess: (response) => {
            toast.success(response.message || "Agent reassignment request cancelled.");
            setIsCancelAgentReassignmentOpen(false);
            refreshReassignmentContext();
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error));
            refreshReassignmentContext();
        },
    });

    const canSubmitAgentReassignment =
        canRequestAgentReassignment &&
        Boolean(selectedAgentId) &&
        trimmedAgentReassignmentReason.length > 0 &&
        trimmedAgentReassignmentReason.length <= 1000 &&
        !createAgentReassignmentMutation.isPending;

    const handleAgentReassignmentOpenChange = (open: boolean) => {
        if (createAgentReassignmentMutation.isPending) return;
        setIsAgentReassignmentOpen(open);
        if (!open) {
            setSelectedAgentId("");
            setAgentReassignmentReason("");
        }
    };

    const handleCancelAgentReassignmentOpenChange = (open: boolean) => {
        if (cancelAgentReassignmentMutation.isPending) return;
        setIsCancelAgentReassignmentOpen(open);
    };

    const reassignmentUnavailableMessage = reservationsQuery.isError
        ? "Reservation information could not be verified. Try again before requesting reassignment."
        : !linkedReservation
            ? "Agent reassignment is available only when this inquiry has a linked active reservation."
            : linkedReservation.status !== "active"
                ? "Agent reassignment is only available while the linked reservation is active."
                : !reservationAgentId
                    ? "A current reservation agent is required before requesting reassignment."
                    : lifecycleQueriesError
                        ? "Request eligibility could not be verified. Try again before requesting reassignment."
                        : pendingCancellationRequest
                            ? "Resolve or cancel the pending reservation cancellation request first."
                            : pendingPropertyChangeRequest
                                ? "Resolve or cancel the pending property change request first."
                                : "Agent reassignment is currently unavailable.";

    const resetSiteVisitForm = () => {
        setSiteVisitSchedule("");
        setSiteVisitLocation("");
        setSiteVisitNotes("");
        setSiteVisitFormError("");
    };

    const requestSiteVisitMutation = useMutation({
        mutationFn: (payload: CreateClientAppointmentPayload) =>
            clientPortalApi.createAppointment(payload),
        onSuccess: (response) => {
            toast.success(response.message || "Site visit requested successfully.");
            void queryClient.invalidateQueries({ queryKey: ["client", "appointments"] });
            resetSiteVisitForm();
            setIsSiteVisitOpen(false);
            navigate({
                to: "/dashboard/appointment/$appointmentId",
                params: { appointmentId: response.data.id },
            });
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error));
        },
    });

    const handleSiteVisitDialogChange = (open: boolean) => {
        if (!open && requestSiteVisitMutation.isPending) return;
        setIsSiteVisitOpen(open);
        if (!open) resetSiteVisitForm();
    };

    const handleSiteVisitSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSiteVisitFormError("");

        if (
            !inquiry?.id ||
            !isSiteVisitEligible ||
            activeAppointment ||
            appointmentsQuery.isPending ||
            appointmentsQuery.isError ||
            requestSiteVisitMutation.isPending
        ) {
            return;
        }

        const scheduleDate = new Date(siteVisitSchedule);
        if (!siteVisitSchedule || Number.isNaN(scheduleDate.getTime())) {
            setSiteVisitFormError("Choose a valid date and time.");
            return;
        }
        if (scheduleDate.getTime() <= Date.now()) {
            setSiteVisitFormError("Choose a future date and time.");
            return;
        }

        const location = siteVisitLocation.trim();
        if (!location) {
            setSiteVisitFormError("Enter a location for the site visit.");
            return;
        }

        const notes = siteVisitNotes.trim();
        requestSiteVisitMutation.mutate({
            inquiry_id: inquiry.id,
            schedule: formatLocalDateTimeForApi(scheduleDate),
            location,
            ...(notes ? { notes } : {}),
        });
    };

    if (inquiryQuery.isPending) {
        return <InquiryDetailSkeleton />;
    }

    if (inquiryQuery.isError || !inquiry) {
        return (
            <div className="space-y-6">
                <ScreenBackLink to="/dashboard/inquiries" label="My inquiries" hideFrom="md" />
                <Card className="border-destructive/40">
                    <CardContent className="space-y-3 p-6 text-center">
                        <p className="text-destructive text-sm">Could not load this inquiry.</p>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => inquiryQuery.refetch()}
                        >
                            Try again
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const status = inquiryStatus;
    const agent = inquiry.agent;
    const property = inquiry.property;
    const agentName = agent
        ? `${agent.first_name?.trim() ?? ""} ${agent.last_name?.trim() ?? ""}`.trim()
        : "";
    const agentIdentity = agentName || agent?.email?.trim() || "";
    const assignedAgentId = inquiry.agent_id?.trim() ?? "";
    const propertyPrice =
        property?.price != null && property.price !== ""
            ? Number(property.price)
            : null;

    return (
        <div className="space-y-6">
            <ScreenBackLink to="/dashboard/inquiries" label="My inquiries" hideFrom="md" />

            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-primary text-sm font-semibold tracking-wide uppercase">
                        AFFORDAHOMES inquiry
                    </p>
                    <h1 className="mt-1 break-words text-2xl font-semibold tracking-tight">
                        {inquiry.subject?.trim() || "Inquiry"}
                    </h1>
                    <p className="text-muted-foreground mt-2 break-all font-mono text-xs">
                        {inquiry.id}
                    </p>
                </div>
                <span
                    className={cn(
                        "rounded-md px-2.5 py-1 text-xs font-semibold",
                        statusStyles[status] ?? "bg-muted text-muted-foreground",
                    )}
                >
                    {statusLabel(status)}
                </span>
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(300px,360px)]">
                <div className="space-y-6">
                    <Card className="border-border/80 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <MessageSquareTextIcon className="text-primary size-5" />
                                Your message
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <p className="whitespace-pre-wrap text-sm leading-7">
                                {inquiry.message?.trim() || "No message provided."}
                            </p>
                            <Separator />
                            <div className="text-muted-foreground flex flex-wrap gap-x-5 gap-y-2 text-xs">
                                <span className="inline-flex items-center gap-1.5">
                                    {inquiry.source === "ai_chat" ? (
                                        <BotIcon className="size-3.5" />
                                    ) : (
                                        <MessageSquareTextIcon className="size-3.5" />
                                    )}
                                    {sourceLabel(inquiry.source)}
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                    <CalendarClockIcon className="size-3.5" />
                                    Submitted {formatDate(inquiry.created_at)}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/80 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Building2Icon className="text-primary size-5" />
                                Property
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {property ? (
                                <div className="space-y-4">
                                    <div>
                                        <p className="font-semibold">
                                            {property.title?.trim() || "Property"}
                                        </p>
                                        {property.address?.trim() ? (
                                            <p className="text-muted-foreground mt-1 flex items-start gap-1.5 text-sm">
                                                <MapPinIcon className="mt-0.5 size-4 shrink-0" />
                                                {property.address.trim()}
                                            </p>
                                        ) : null}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        {Number.isFinite(propertyPrice) ? (
                                            <span className="text-primary font-semibold">
                                                {formatPhpCurrency(propertyPrice)}
                                            </span>
                                        ) : null}
                                        {property.status?.trim() ? (
                                            <span className="bg-muted text-muted-foreground rounded-md px-2 py-0.5 text-xs font-medium capitalize">
                                                {property.status.trim()}
                                            </span>
                                        ) : null}
                                    </div>
                                    {property.id ? (
                                        <Button variant="outline" size="sm" asChild>
                                            <Link
                                                to="/property/$propertyId"
                                                params={{ propertyId: property.id }}
                                            >
                                                View property
                                            </Link>
                                        </Button>
                                    ) : null}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <p className="font-medium">General inquiry</p>
                                    <p className="text-muted-foreground text-sm leading-relaxed">
                                        This request is not linked to a specific property. Nexia and
                                        human-assistance inquiries can appear here safely.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="grid gap-6 lg:grid-cols-2">
                        <Card className="border-border/80 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-base">Current status</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <span
                                    className={cn(
                                        "inline-flex rounded-md px-2.5 py-1 text-xs font-semibold",
                                        statusStyles[status] ?? "bg-muted text-muted-foreground",
                                    )}
                                >
                                    {statusLabel(status)}
                                </span>
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                    {statusDescription(status)}
                                </p>
                            </CardContent>
                        </Card>

                        {isSiteVisitEligible ? (
                            <Card className="border-border/80 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <CalendarPlusIcon className="text-primary size-4" />
                                        Site visit
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {appointmentsQuery.isPending ? (
                                        <div className="space-y-2">
                                            <Skeleton className="h-5 w-36" />
                                            <Skeleton className="h-4 w-full" />
                                            <p className="text-muted-foreground text-xs">
                                                Checking your existing site visits...
                                            </p>
                                        </div>
                                    ) : appointmentsQuery.isError ? (
                                        <div className="space-y-3">
                                            <p className="text-muted-foreground text-sm leading-relaxed">
                                                Site visit availability could not be checked. Try
                                                again before submitting a request.
                                            </p>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => appointmentsQuery.refetch()}
                                            >
                                                Try again
                                            </Button>
                                        </div>
                                    ) : activeAppointment ? (
                                        <div className="space-y-4">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <p className="font-medium">Existing site visit</p>
                                                <span
                                                    className={cn(
                                                        "rounded-md px-2 py-0.5 text-xs font-medium capitalize",
                                                        siteVisitStatusStyles[
                                                        activeAppointment.status
                                                        ] ?? "bg-muted text-muted-foreground",
                                                    )}
                                                >
                                                    {activeAppointment.status}
                                                </span>
                                            </div>
                                            <div className="text-muted-foreground space-y-1.5 text-sm">
                                                <p>{formatDate(activeAppointment.schedule)}</p>
                                                <p className="break-words">
                                                    {activeAppointment.location?.trim() ||
                                                        "Location unavailable"}
                                                </p>
                                            </div>
                                            <Button variant="outline" size="sm" asChild>
                                                <Link
                                                    to="/dashboard/appointment/$appointmentId"
                                                    params={{
                                                        appointmentId: activeAppointment.id,
                                                    }}
                                                >
                                                    View Site Visit
                                                </Link>
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <p className="text-muted-foreground text-sm leading-relaxed">
                                                Request a visit to this property with your assigned
                                                AFFORDAHOMES agent.
                                            </p>
                                            <Button
                                                type="button"
                                                size="sm"
                                                onClick={() => setIsSiteVisitOpen(true)}
                                            >
                                                Request Site Visit
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ) : null}
                    </div>
                </div>

                <div className="space-y-5 xl:self-start">
                    <Card className="border-border/80 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base">Assigned agent</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {agent ? (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-full">
                                            <UserRoundIcon className="text-muted-foreground size-5" />
                                        </div>
                                        <p className="font-medium">
                                            {agentIdentity || "Assigned agent"}
                                        </p>
                                    </div>
                                    {agent.email?.trim() ? (
                                        <p className="text-muted-foreground flex items-center gap-2 text-sm">
                                            <MailIcon className="size-4 shrink-0" />
                                            <span className="break-all">{agent.email.trim()}</span>
                                        </p>
                                    ) : null}
                                    {agent.mobile?.trim() ? (
                                        <p className="text-muted-foreground flex items-center gap-2 text-sm">
                                            <PhoneIcon className="size-4 shrink-0" />
                                            {agent.mobile.trim()}
                                        </p>
                                    ) : null}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <p className="font-medium">Awaiting agent</p>
                                    <p className="text-muted-foreground text-sm leading-relaxed">
                                        An available AFFORDAHOMES agent can claim and review this
                                        inquiry.
                                    </p>
                                </div>
                            )}
                            {assignedAgentId ? (
                                <>
                                    <Separator className="my-4" />
                                    <div className="space-y-3">
                                        <div>
                                            <p className="font-medium">Continue the conversation</p>
                                            <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                                                Open the dedicated Chat view to message your assigned agent.
                                            </p>
                                        </div>
                                        <Button size="sm" asChild>
                                            <Link
                                                to="/dashboard/chat/$inquiryId"
                                                params={{ inquiryId: inquiry.id }}
                                            >
                                                Send message
                                            </Link>
                                        </Button>
                                    </div>
                                </>
                            ) : null}
                        </CardContent>
                    </Card>

                    <Card className="border-border/80 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base">Agent reassignment</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Separator className="mb-4" />
                            {reservationsQuery.isPending ||
                                reservationsQuery.isFetching ||
                                lifecycleQueriesPending ? (
                                <div className="space-y-3">
                                    <Skeleton className="h-5 w-24" />
                                    <Skeleton className="h-14 w-full" />
                                </div>
                            ) : reservationsQuery.isError || lifecycleQueriesError ? (
                                <div className="space-y-3">
                                    <p className="text-muted-foreground text-sm leading-relaxed">
                                        {reassignmentUnavailableMessage}
                                    </p>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={refreshReassignmentContext}
                                    >
                                        Try again
                                    </Button>
                                </div>
                            ) : pendingAgentReassignment ? (
                                <div className="space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <ReassignmentStatusBadge status="pending" />
                                        <span className="text-muted-foreground text-xs">
                                            Submitted: {formatDate(pendingAgentReassignment.created_at)}
                                        </span>
                                    </div>
                                    {pendingAgentReassignment.new_agent ? (
                                        <AgentSummaryView agent={pendingAgentReassignment.new_agent} />
                                    ) : (
                                        <p className="text-muted-foreground text-sm">
                                            Requested agent unavailable.
                                        </p>
                                    )}
                                    <div>
                                        <p className="text-muted-foreground text-xs uppercase tracking-wide">
                                            Reason
                                        </p>
                                        <p className="mt-1 whitespace-pre-wrap break-words text-sm">
                                            {pendingAgentReassignment.reason}
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="w-full"
                                        onClick={() => setIsCancelAgentReassignmentOpen(true)}
                                    >
                                        Cancel request
                                    </Button>
                                </div>
                            ) : canRequestAgentReassignment ? (
                                <div className="space-y-3">
                                    <p className="text-muted-foreground text-sm leading-relaxed">
                                        Ask to have another agent assigned to this inquiry&rsquo;s active
                                        reservation.
                                    </p>
                                    <Button
                                        type="button"
                                        size="sm"
                                        className="w-full"
                                        onClick={() => setIsAgentReassignmentOpen(true)}
                                    >
                                        Request different agent
                                    </Button>
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                    {reassignmentUnavailableMessage}
                                </p>
                            )}
                            {agentReassignmentRequestsQuery.isSuccess &&
                                (latestApprovedAgentReassignment || latestRejectedAgentReassignment) ? (
                                <div className="mt-5 border-t pt-5">
                                    <p className="mb-3 text-sm font-semibold">Request history</p>
                                    <div className="space-y-3">
                                        {latestApprovedAgentReassignment ? (
                                            <AgentReassignmentHistoryItem
                                                request={latestApprovedAgentReassignment}
                                                status="approved"
                                                dateLabel="Approved"
                                                dateValue={latestApprovedAgentReassignment.approved_at}
                                            />
                                        ) : null}
                                        {latestRejectedAgentReassignment ? (
                                            <AgentReassignmentHistoryItem
                                                request={latestRejectedAgentReassignment}
                                                status="rejected"
                                                dateLabel="Rejected"
                                                dateValue={latestRejectedAgentReassignment.rejected_at}
                                            />
                                        ) : null}
                                    </div>
                                </div>
                            ) : null}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Dialog open={isSiteVisitOpen} onOpenChange={handleSiteVisitDialogChange}>
                <DialogContent className="sm:max-w-lg">
                    <form className="space-y-5" onSubmit={handleSiteVisitSubmit}>
                        <DialogHeader>
                            <DialogTitle>Request Site Visit</DialogTitle>
                            <DialogDescription>
                                Choose a future schedule for this property. Your assigned agent will
                                receive the request.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="site-visit-schedule">Date and time</Label>
                                <Input
                                    id="site-visit-schedule"
                                    type="datetime-local"
                                    min={toLocalDateTimeInput(new Date())}
                                    value={siteVisitSchedule}
                                    onChange={(event) => {
                                        setSiteVisitSchedule(event.target.value);
                                        setSiteVisitFormError("");
                                    }}
                                    disabled={requestSiteVisitMutation.isPending}
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="site-visit-location">Location</Label>
                                <Input
                                    id="site-visit-location"
                                    value={siteVisitLocation}
                                    onChange={(event) => {
                                        setSiteVisitLocation(event.target.value);
                                        setSiteVisitFormError("");
                                    }}
                                    placeholder="e.g. Property address or model unit"
                                    maxLength={255}
                                    disabled={requestSiteVisitMutation.isPending}
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="site-visit-notes">
                                    Notes <span className="text-muted-foreground font-normal">(optional)</span>
                                </Label>
                                <Textarea
                                    id="site-visit-notes"
                                    value={siteVisitNotes}
                                    onChange={(event) => setSiteVisitNotes(event.target.value)}
                                    placeholder="Share any helpful details for your assigned agent."
                                    rows={3}
                                    disabled={requestSiteVisitMutation.isPending}
                                />
                            </div>

                            {siteVisitFormError ? (
                                <p className="text-destructive text-sm" role="alert">
                                    {siteVisitFormError}
                                </p>
                            ) : null}
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleSiteVisitDialogChange(false)}
                                disabled={requestSiteVisitMutation.isPending}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={requestSiteVisitMutation.isPending}>
                                {requestSiteVisitMutation.isPending
                                    ? "Submitting request..."
                                    : "Submit Request"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={isAgentReassignmentOpen}
                onOpenChange={handleAgentReassignmentOpenChange}
            >
                <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Request a different agent</DialogTitle>
                        <DialogDescription>
                            Select another agent and explain why you are requesting reassignment.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-5 py-2">
                        <div className="space-y-2">
                            <Label>Available agents</Label>
                            {agentDirectoryQuery.isPending ? (
                                <div className="space-y-2">
                                    <Skeleton className="h-20 w-full" />
                                    <Skeleton className="h-20 w-full" />
                                </div>
                            ) : agentDirectoryQuery.isError ? (
                                <div className="space-y-3 rounded-lg border border-dashed p-4">
                                    <p className="text-destructive text-sm">
                                        Could not load the agent directory.
                                    </p>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => agentDirectoryQuery.refetch()}
                                    >
                                        Try again
                                    </Button>
                                </div>
                            ) : selectableAgents.length === 0 ? (
                                <div className="rounded-lg border border-dashed p-5 text-center">
                                    <UserRoundIcon
                                        className="text-muted-foreground mx-auto size-7"
                                        strokeWidth={1.5}
                                    />
                                    <p className="mt-2 text-sm font-medium">No other agents available</p>
                                    <p className="text-muted-foreground mt-1 text-xs">
                                        There are no other agents available for selection right now.
                                    </p>
                                </div>
                            ) : (
                                <div className="max-h-[42dvh] space-y-2 overflow-y-auto pr-1">
                                    {selectableAgents.map((directoryAgent) => {
                                        const isSelected = selectedAgentId === directoryAgent.id;

                                        return (
                                            <button
                                                key={directoryAgent.id}
                                                type="button"
                                                aria-pressed={isSelected}
                                                disabled={createAgentReassignmentMutation.isPending}
                                                className={cn(
                                                    "w-full rounded-lg border p-3 transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                                                    isSelected
                                                        ? "border-primary bg-primary/5 ring-primary/20 ring-2"
                                                        : "border-border hover:bg-muted/50",
                                                )}
                                                onClick={() => setSelectedAgentId(directoryAgent.id)}
                                            >
                                                <AgentSummaryView agent={directoryAgent} />
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between gap-3">
                                <Label htmlFor="agent-reassignment-reason">Reason</Label>
                                <span className="text-muted-foreground text-xs">
                                    {agentReassignmentReason.length}/1000
                                </span>
                            </div>
                            <Textarea
                                id="agent-reassignment-reason"
                                value={agentReassignmentReason}
                                onChange={(event) => setAgentReassignmentReason(event.target.value)}
                                maxLength={1000}
                                rows={4}
                                placeholder="Explain why you would like another agent."
                                disabled={createAgentReassignmentMutation.isPending}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={createAgentReassignmentMutation.isPending}
                            onClick={() => handleAgentReassignmentOpenChange(false)}
                        >
                            Keep current agent
                        </Button>
                        <Button
                            type="button"
                            disabled={!canSubmitAgentReassignment}
                            onClick={() => createAgentReassignmentMutation.mutate()}
                        >
                            {createAgentReassignmentMutation.isPending
                                ? "Submitting..."
                                : "Submit request"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={isCancelAgentReassignmentOpen}
                onOpenChange={handleCancelAgentReassignmentOpenChange}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cancel agent reassignment request?</DialogTitle>
                        <DialogDescription>
                            This will withdraw your pending request. Your current agent and reservation
                            will remain unchanged.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={cancelAgentReassignmentMutation.isPending}
                            onClick={() => handleCancelAgentReassignmentOpenChange(false)}
                        >
                            Keep request
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            disabled={cancelAgentReassignmentMutation.isPending}
                            onClick={() => cancelAgentReassignmentMutation.mutate()}
                        >
                            {cancelAgentReassignmentMutation.isPending
                                ? "Cancelling..."
                                : "Cancel request"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ClientInquiryDetail;
