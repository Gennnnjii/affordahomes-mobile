import { ScreenBackLink } from "@/components/navigation/ScreenBackLink";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { clientPortalApi } from "@/db/api/client.portal.api";
import { asRecord, str } from "@/lib/record";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
    CalendarCheckIcon,
    CheckCircle2Icon,
    CircleDotIcon,
    FileCheck2Icon,
    KeyRoundIcon,
    MessageSquareTextIcon,
    UserRoundCheckIcon,
    type LucideIcon,
} from "lucide-react";
import { useMemo } from "react";

type JourneyMilestoneState = "complete" | "current" | "upcoming";

type JourneyMilestone = {
    key: string;
    title: string;
    description: string;
    detail: string;
    state: JourneyMilestoneState;
    icon: LucideIcon;
    to:
        | "/dashboard/inquiries"
        | "/dashboard/my-agent"
        | "/dashboard/appointments"
        | "/dashboard/prequalification"
        | "/dashboard/reservations";
    action: string;
};

const formatDateTime = (value?: string | null) => {
    if (!value) return null;

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;

    return date.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
};

const ClientJourneyTracker = () => {
    const inquiriesQuery = useQuery({
        queryKey: ["client", "inquiries"],
        queryFn: () => clientPortalApi.inquiries(),
        refetchInterval: 5_000,
    });

    const appointmentsQuery = useQuery({
        queryKey: ["client", "appointments"],
        queryFn: () => clientPortalApi.appointments(),
        refetchInterval: 5_000,
    });

    const prequalificationQuery = useQuery({
        queryKey: ["client", "prequalification"],
        queryFn: () => clientPortalApi.getOwnPrequalification(),
        refetchInterval: 5_000,
    });

    const reservationsQuery = useQuery({
        queryKey: ["client", "reservations"],
        queryFn: () => clientPortalApi.reservations(),
        refetchInterval: 5_000,
    });

    const isLoading =
        inquiriesQuery.isPending ||
        appointmentsQuery.isPending ||
        prequalificationQuery.isPending ||
        reservationsQuery.isPending;

    const hasLoadError =
        inquiriesQuery.isError ||
        appointmentsQuery.isError ||
        prequalificationQuery.isError ||
        reservationsQuery.isError;

    const journey = useMemo(() => {
        const inquiries = inquiriesQuery.data?.data ?? [];
        const appointments = appointmentsQuery.data?.data ?? [];
        const reservations = reservationsQuery.data?.data ?? [];
        const prequalification = prequalificationQuery.data?.data
            ? asRecord(prequalificationQuery.data.data)
            : null;

        const newestInquiry = [...inquiries].sort((a, b) => {
            const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
            const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
            return bTime - aTime;
        })[0];

        const assignedInquiry = inquiries.find((inquiry) => Boolean(inquiry.agent_id));
        const assignedAgent = assignedInquiry ? asRecord(assignedInquiry.agent) : {};
        const assignedAgentName =
            [str(assignedAgent.first_name), str(assignedAgent.last_name)]
                .filter(Boolean)
                .join(" ") || str(assignedAgent.email);

        const completedAppointment = [...appointments]
            .filter((appointment) => appointment.status === "completed")
            .sort((a, b) => {
                const aTime = a.schedule ? new Date(a.schedule).getTime() : 0;
                const bTime = b.schedule ? new Date(b.schedule).getTime() : 0;
                return bTime - aTime;
            })[0];

        const scheduledAppointment = [...appointments]
            .filter(
                (appointment) =>
                    appointment.status === "pending" || appointment.status === "confirmed",
            )
            .sort((a, b) => {
                const aTime = a.schedule ? new Date(a.schedule).getTime() : Number.MAX_SAFE_INTEGER;
                const bTime = b.schedule ? new Date(b.schedule).getTime() : Number.MAX_SAFE_INTEGER;
                return aTime - bTime;
            })[0];

        const hasInquiry = inquiries.length > 0;
        const hasAssignedAgent = Boolean(assignedInquiry);
        const hasCompletedVisit = Boolean(completedAppointment);
        const prequalificationSubmitted = Boolean(
            prequalification && str(prequalification.submitted_at),
        );
        const hasReservation = reservations.some(
            (reservation) => reservation.status === "active" || reservation.status === "sold",
        );

        const completionFlags = [
            hasInquiry,
            hasAssignedAgent,
            hasCompletedVisit,
            prequalificationSubmitted,
            hasReservation,
        ];
        const currentIndex = completionFlags.findIndex((complete) => !complete);
        const stateFor = (index: number): JourneyMilestoneState => {
            if (completionFlags[index]) return "complete";
            if (index === currentIndex) return "current";
            return "upcoming";
        };

        const identityStatus = prequalification
            ? str(prequalification.identity_verification_status)
            : null;
        const activeReservation = reservations.find(
            (reservation) => reservation.status === "active",
        );
        const soldReservation = reservations.find(
            (reservation) => reservation.status === "sold",
        );

        const milestones: JourneyMilestone[] = [
            {
                key: "inquiry",
                title: "Send an inquiry",
                description: "Tell AffordaHomes which property or home option interests you.",
                detail: newestInquiry
                    ? `${newestInquiry.subject || "Inquiry submitted"}${formatDateTime(newestInquiry.created_at) ? ` · ${formatDateTime(newestInquiry.created_at)}` : ""}`
                    : "No inquiry submitted yet.",
                state: stateFor(0),
                icon: MessageSquareTextIcon,
                to: "/dashboard/inquiries",
                action: hasInquiry ? "View inquiries" : "Start inquiry",
            },
            {
                key: "agent",
                title: "Connect with your agent",
                description: "An assigned agent can guide your property and appointment journey.",
                detail: hasAssignedAgent
                    ? assignedAgentName
                        ? `Assigned to ${assignedAgentName}`
                        : "An agent has been assigned to your inquiry."
                    : "Waiting for an agent assignment.",
                state: stateFor(1),
                icon: UserRoundCheckIcon,
                to: "/dashboard/my-agent",
                action: "View agent",
            },
            {
                key: "visit",
                title: "Complete a site visit",
                description: "Visit the property or project and confirm the details with your agent.",
                detail: completedAppointment
                    ? `Completed${formatDateTime(completedAppointment.schedule) ? ` · ${formatDateTime(completedAppointment.schedule)}` : ""}`
                    : scheduledAppointment
                        ? `${scheduledAppointment.status === "confirmed" ? "Confirmed" : "Pending"} visit${formatDateTime(scheduledAppointment.schedule) ? ` · ${formatDateTime(scheduledAppointment.schedule)}` : ""}`
                        : "No site visit completed yet.",
                state: stateFor(2),
                icon: CalendarCheckIcon,
                to: "/dashboard/appointments",
                action: "View appointments",
            },
            {
                key: "documents",
                title: "Submit prequalification",
                description: "Provide your financial information and required documents for review.",
                detail: prequalificationSubmitted
                    ? identityStatus === "verified"
                        ? "Submitted · Government ID verified"
                        : identityStatus === "rejected"
                            ? "Submitted · Government ID needs attention"
                            : "Submitted · Verification in progress"
                    : "Prequalification has not been submitted yet.",
                state: stateFor(3),
                icon: FileCheck2Icon,
                to: "/dashboard/prequalification",
                action: "View documents",
            },
            {
                key: "reservation",
                title: "Secure your reservation",
                description: "Track the official reservation status for your selected property.",
                detail: soldReservation
                    ? "Property marked as sold."
                    : activeReservation
                        ? `Active reservation${formatDateTime(activeReservation.reserved_at) ? ` · ${formatDateTime(activeReservation.reserved_at)}` : ""}`
                        : "No active reservation yet.",
                state: stateFor(4),
                icon: KeyRoundIcon,
                to: "/dashboard/reservations",
                action: "View reservations",
            },
        ];

        const completedCount = completionFlags.filter(Boolean).length;
        return {
            milestones,
            completedCount,
            progress: Math.round((completedCount / completionFlags.length) * 100),
        };
    }, [
        appointmentsQuery.data,
        inquiriesQuery.data,
        prequalificationQuery.data,
        reservationsQuery.data,
    ]);

    if (isLoading) {
        return (
            <div className="flex min-h-[240px] items-center justify-center">
                <Spinner className="size-6" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <ScreenBackLink to="/dashboard" label="Dashboard" hideFrom="md" />

            <div>
                <p className="text-primary text-sm font-medium">Mobile journey tracker</p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight">Your homeownership journey</h1>
                <p className="text-muted-foreground mt-1 max-w-2xl text-sm leading-relaxed">
                    See the major milestones already recorded in AffordaHomes and what comes next.
                </p>
            </div>

            {hasLoadError ? (
                <Card className="border-amber-300/70 bg-amber-50/60 py-4 dark:border-amber-900/60 dark:bg-amber-950/20">
                    <CardContent className="px-4 text-sm text-amber-900 dark:text-amber-200">
                        Some journey data could not be refreshed. The tracker is showing the information that is currently available.
                    </CardContent>
                </Card>
            ) : null}

            <Card className="overflow-hidden border-border/80">
                <CardHeader className="gap-3">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <CardTitle>Journey progress</CardTitle>
                            <p className="text-muted-foreground mt-1 text-sm">
                                {journey.completedCount} of {journey.milestones.length} milestones completed
                            </p>
                        </div>
                        <div className="bg-primary/10 text-primary flex size-12 shrink-0 items-center justify-center rounded-full">
                            <span className="text-sm font-semibold">{journey.progress}%</span>
                        </div>
                    </div>
                    <div className="bg-muted h-2 overflow-hidden rounded-full">
                        <div
                            className="bg-primary h-full rounded-full transition-[width]"
                            style={{ width: `${journey.progress}%` }}
                        />
                    </div>
                </CardHeader>
            </Card>

            <div className="space-y-3">
                {journey.milestones.map((milestone, index) => {
                    const Icon = milestone.icon;
                    const isComplete = milestone.state === "complete";
                    const isCurrent = milestone.state === "current";

                    return (
                        <Card
                            key={milestone.key}
                            className={
                                isCurrent
                                    ? "border-primary/50 bg-primary/[0.03] py-5"
                                    : "border-border/80 py-5"
                            }
                        >
                            <CardContent className="px-4 sm:px-6">
                                <div className="flex gap-4">
                                    <div className="flex shrink-0 flex-col items-center">
                                        <div
                                            className={
                                                isComplete
                                                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 flex size-10 items-center justify-center rounded-full"
                                                    : isCurrent
                                                        ? "bg-primary text-primary-foreground flex size-10 items-center justify-center rounded-full"
                                                        : "bg-muted text-muted-foreground flex size-10 items-center justify-center rounded-full"
                                            }
                                        >
                                            {isComplete ? (
                                                <CheckCircle2Icon className="size-5" />
                                            ) : isCurrent ? (
                                                <CircleDotIcon className="size-5" />
                                            ) : (
                                                <Icon className="size-5" />
                                            )}
                                        </div>
                                        {index < journey.milestones.length - 1 ? (
                                            <div className="bg-border mt-2 h-full min-h-6 w-px" />
                                        ) : null}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="font-semibold">{milestone.title}</h2>
                                            <span
                                                className={
                                                    isComplete
                                                        ? "rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                                        : isCurrent
                                                            ? "bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium"
                                                            : "bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-medium"
                                                }
                                            >
                                                {isComplete
                                                    ? "Completed"
                                                    : isCurrent
                                                        ? "Current"
                                                        : "Upcoming"}
                                            </span>
                                        </div>

                                        <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                                            {milestone.description}
                                        </p>
                                        <p className="mt-2 text-sm font-medium">{milestone.detail}</p>

                                        <Button variant="outline" size="sm" className="mt-4" asChild>
                                            <Link to={milestone.to}>{milestone.action}</Link>
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <p className="text-muted-foreground text-xs leading-relaxed">
                This tracker summarizes records already stored in AffordaHomes. Official inquiry, appointment,
                verification, and reservation statuses remain authoritative in their respective screens.
            </p>
        </div>
    );
};

export default ClientJourneyTracker;
