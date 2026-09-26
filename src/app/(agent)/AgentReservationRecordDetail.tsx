import { ChatPanel } from "@/components/chat/ChatPanel";
import { ScreenBackLink } from "@/components/navigation/ScreenBackLink";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { agentPortalApi } from "@/db/api/agent.portal.api";
import { useAgentAuth } from "@/db/queries/useAgentAuth";
import { getApiErrorMessage } from "@/lib/api-error";
import { asRecord, str } from "@/lib/record";
import { getAgentToken } from "@/lib/tokens";
import type { Reservation } from "@/types/reservation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { AlertTriangleIcon, FileTextIcon, MessageSquareIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const statusColors: Record<Reservation["status"], string> = {
    active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    sold: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
};

const neutralStatusColor =
    "bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground";

const reservationReference = (id: string) =>
    id ? "#" + id.slice(-8).toUpperCase() : "Not available";

const formatDateTime = (value?: string | null) => {
    if (!value) return "Not available";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Not available";

    return date.toLocaleString([], {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const joinedName = (record: Record<string, unknown>) => {
    const firstName = str(record.first_name);
    const lastName = str(record.last_name);
    const combined = [firstName, lastName].filter(Boolean).join(" ").trim();

    return combined || str(record.name) || str(record.full_name) || "Not available";
};

const DetailItem = ({
    label,
    value,
}: {
    label: string;
    value: string;
}) => (
    <div className="space-y-1">
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            {label}
        </p>
        <p className="text-sm">{value}</p>
    </div>
);

const ReservationRecordSkeleton = () => (
    <div className="space-y-6">
        <Skeleton className="h-9 w-36 rounded-md" />
        <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
                <Skeleton className="h-7 w-56" />
                <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-7 w-20 rounded-md" />
        </div>
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
            <div className="space-y-4">
                <Skeleton className="h-52 w-full rounded-xl" />
                <Skeleton className="h-48 w-full rounded-xl" />
                <Skeleton className="h-44 w-full rounded-xl" />
            </div>
            <div className="space-y-4">
                <Skeleton className="h-40 w-full rounded-xl" />
                <Skeleton className="h-[480px] w-full rounded-xl" />
            </div>
        </div>
    </div>
);

const AgentReservationRecordDetail = () => {
    const { reservationId } = useParams({ strict: false }) as {
        reservationId: string;
    };
    const queryClient = useQueryClient();
    const { sessionQuery: agentSession } = useAgentAuth();
    const currentAgentId =
        (agentSession.data?.data as { id_?: string } | undefined)?.id_ ?? "";
    const agentToken = getAgentToken() ?? "";

    const [isCancelOpen, setIsCancelOpen] = useState(false);
    const [isSoldOpen, setIsSoldOpen] = useState(false);
    const [cancellationReason, setCancellationReason] = useState("");

    const { data, isPending, isError } = useQuery({
        queryKey: ["agent", "reservation", reservationId],
        queryFn: () => agentPortalApi.reservation(reservationId),
        enabled: !!reservationId,
    });

    const invalidateReservationQueries = () => {
        void queryClient.invalidateQueries({
            queryKey: ["agent", "reservations"],
        });
        void queryClient.invalidateQueries({
            queryKey: ["agent", "reservation", reservationId],
        });
    };

    const cancelMutation = useMutation({
        mutationFn: (reason: string) =>
            agentPortalApi.cancelReservation(reservationId, { reason }),
        onSuccess: () => {
            toast.success("Reservation cancelled successfully.");
            setIsCancelOpen(false);
            setCancellationReason("");
            invalidateReservationQueries();
        },
        onError: (error) => toast.error(getApiErrorMessage(error)),
    });

    const soldMutation = useMutation({
        mutationFn: () => agentPortalApi.markReservationAsSold(reservationId),
        onSuccess: () => {
            toast.success("Reservation and property marked as sold.");
            setIsSoldOpen(false);
            invalidateReservationQueries();
        },
        onError: (error) => toast.error(getApiErrorMessage(error)),
    });

    const reservation = data?.data;
    const property = asRecord(reservation?.property);
    const client = asRecord(reservation?.client);
    const inquiry = asRecord(reservation?.inquiry);
    const status = str(reservation?.status) ?? "unknown";
    const statusColor =
        statusColors[status as Reservation["status"]] ?? neutralStatusColor;
    const isActive = status === "active";
    const linkedInquiryId = str(reservation?.inquiry_id);
    const clientName = joinedName(client);
    const propertyTitle =
        str(property.title) || str(property.name) || "Property details unavailable";
    const propertyAddress =
        str(property.address) ||
        str(property.location) ||
        str(property.full_address) ||
        "Address not available";
    const trimmedReason = cancellationReason.trim();
    const canCancel =
        trimmedReason.length > 0 &&
        trimmedReason.length <= 1000 &&
        !cancelMutation.isPending;

    const handleCancelDialogChange = (open: boolean) => {
        if (cancelMutation.isPending && !open) return;

        setIsCancelOpen(open);
        if (!open) setCancellationReason("");
    };

    const handleSoldDialogChange = (open: boolean) => {
        if (soldMutation.isPending && !open) return;
        setIsSoldOpen(open);
    };

    return (
        <div className="flex flex-col gap-5">
            <ScreenBackLink
                to="/dashboard/agent/reservations"
                label="Reservations"
                hideFrom="md"
            />

            {isPending ? (
                <ReservationRecordSkeleton />
            ) : isError || !reservation ? (
                <p className="text-destructive">
                    Could not load reservation.
                </p>
            ) : (
                <>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/10 flex size-9 shrink-0 items-center justify-center rounded-lg">
                                <FileTextIcon className="text-primary size-4" />
                            </div>
                            <div>
                                <h1 className="text-xl font-semibold leading-tight">
                                    Reservation {reservationReference(reservation.id)}
                                </h1>
                                <p className="text-muted-foreground text-xs">
                                    Reserved {formatDateTime(reservation.reserved_at)}
                                </p>
                            </div>
                        </div>
                        <span
                            className={
                                "rounded-md px-3 py-1 text-xs font-semibold capitalize " +
                                statusColor
                            }
                        >
                            {status}
                        </span>
                    </div>

                    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
                        <div className="space-y-4">
                            <Card className="border-border/80 shadow-sm">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">
                                        Reservation details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <DetailItem
                                            label="Reference"
                                            value={reservationReference(reservation.id)}
                                        />
                                        <DetailItem
                                            label="Current status"
                                            value={status}
                                        />
                                        <DetailItem
                                            label="Reserved date"
                                            value={formatDateTime(reservation.reserved_at)}
                                        />
                                        {reservation.cancelled_at && (
                                            <DetailItem
                                                label="Cancellation date"
                                                value={formatDateTime(
                                                    reservation.cancelled_at,
                                                )}
                                            />
                                        )}
                                    </div>
                                    <Separator />
                                    <DetailItem
                                        label="Remarks"
                                        value={
                                            reservation.remarks?.trim() ||
                                            "No remarks provided."
                                        }
                                    />
                                    {reservation.cancellation_reason && (
                                        <>
                                            <Separator />
                                            <DetailItem
                                                label="Cancellation reason"
                                                value={reservation.cancellation_reason}
                                            />
                                        </>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="border-border/80 shadow-sm">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">
                                        Property information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-4 sm:grid-cols-2">
                                    <DetailItem label="Property" value={propertyTitle} />
                                    <DetailItem label="Address" value={propertyAddress} />
                                    {str(property.project) && (
                                        <DetailItem
                                            label="Project"
                                            value={str(property.project)!}
                                        />
                                    )}
                                    {str(property.block) && (
                                        <DetailItem
                                            label="Block"
                                            value={str(property.block)!}
                                        />
                                    )}
                                    {str(property.lot_number) && (
                                        <DetailItem
                                            label="Lot"
                                            value={str(property.lot_number)!}
                                        />
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="border-border/80 shadow-sm">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">
                                        Client information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-4 sm:grid-cols-2">
                                    <DetailItem label="Client" value={clientName} />
                                    <DetailItem
                                        label="Email"
                                        value={str(client.email) || "Not available"}
                                    />
                                    <DetailItem
                                        label="Mobile"
                                        value={
                                            str(client.mobile) ||
                                            str(client.mobile_number) ||
                                            str(client.phone) ||
                                            "Not available"
                                        }
                                    />
                                </CardContent>
                            </Card>

                            {(linkedInquiryId ||
                                Object.keys(inquiry).length > 0) && (
                                <Card className="border-border/80 shadow-sm">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base">
                                            Linked inquiry
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid gap-4 sm:grid-cols-2">
                                        <DetailItem
                                            label="Inquiry reference"
                                            value={reservationReference(
                                                linkedInquiryId || str(inquiry.id) || "",
                                            )}
                                        />
                                        <DetailItem
                                            label="Status"
                                            value={
                                                str(inquiry.status) ||
                                                "Not available"
                                            }
                                        />
                                        {str(inquiry.subject) && (
                                            <DetailItem
                                                label="Subject"
                                                value={str(inquiry.subject)!}
                                            />
                                        )}
                                        {str(inquiry.message) && (
                                            <div className="sm:col-span-2">
                                                <DetailItem
                                                    label="Client message"
                                                    value={str(inquiry.message)!}
                                                />
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        <div className="space-y-4">
                            {isActive && (
                                <Card className="border-border/80 shadow-sm">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base">
                                            Reservation actions
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid gap-2">
                                        <Dialog
                                            open={isSoldOpen}
                                            onOpenChange={handleSoldDialogChange}
                                        >
                                            <Button
                                                type="button"
                                                onClick={() => setIsSoldOpen(true)}
                                                disabled={soldMutation.isPending}
                                            >
                                                Mark as Sold
                                            </Button>
                                            <DialogContent className="sm:max-w-md">
                                                <DialogHeader>
                                                    <DialogTitle>
                                                        Mark reservation as sold?
                                                    </DialogTitle>
                                                    <DialogDescription>
                                                        This will mark both the property and
                                                        this reservation as sold.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <DialogFooter>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() =>
                                                            handleSoldDialogChange(false)
                                                        }
                                                        disabled={soldMutation.isPending}
                                                    >
                                                        Keep Active
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        onClick={() =>
                                                            soldMutation.mutate()
                                                        }
                                                        disabled={soldMutation.isPending}
                                                    >
                                                        {soldMutation.isPending
                                                            ? "Marking as sold..."
                                                            : "Confirm Sold"}
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>

                                        <Dialog
                                            open={isCancelOpen}
                                            onOpenChange={handleCancelDialogChange}
                                        >
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                onClick={() => setIsCancelOpen(true)}
                                                disabled={cancelMutation.isPending}
                                            >
                                                Cancel Reservation
                                            </Button>
                                            <DialogContent className="sm:max-w-md">
                                                <DialogHeader>
                                                    <DialogTitle>
                                                        Cancel reservation?
                                                    </DialogTitle>
                                                    <DialogDescription>
                                                        A cancellation reason is required and
                                                        will be recorded with this reservation.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="space-y-2 py-2">
                                                    <Label htmlFor="cancellation-reason">
                                                        Cancellation reason
                                                    </Label>
                                                    <Textarea
                                                        id="cancellation-reason"
                                                        value={cancellationReason}
                                                        onChange={(event) =>
                                                            setCancellationReason(
                                                                event.target.value,
                                                            )
                                                        }
                                                        maxLength={1000}
                                                        rows={5}
                                                        placeholder="Explain why this reservation is being cancelled."
                                                        disabled={cancelMutation.isPending}
                                                    />
                                                    <p className="text-muted-foreground text-right text-xs">
                                                        {cancellationReason.length}/1000
                                                    </p>
                                                </div>
                                                <DialogFooter>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() =>
                                                            handleCancelDialogChange(false)
                                                        }
                                                        disabled={cancelMutation.isPending}
                                                    >
                                                        Keep Active
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        onClick={() =>
                                                            cancelMutation.mutate(
                                                                trimmedReason,
                                                            )
                                                        }
                                                        disabled={!canCancel}
                                                    >
                                                        {cancelMutation.isPending
                                                            ? "Cancelling..."
                                                            : "Cancel Reservation"}
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </CardContent>
                                </Card>
                            )}

                            {linkedInquiryId ? (
                                <ChatPanel
                                    inquiryId={linkedInquiryId}
                                    token={agentToken}
                                    currentUserId={currentAgentId}
                                    otherName={
                                        clientName === "Not available"
                                            ? undefined
                                            : clientName
                                    }
                                    className="h-[480px]"
                                />
                            ) : (
                                <Card className="border-border/80 shadow-sm">
                                    <CardContent className="flex min-h-48 flex-col items-center justify-center p-6 text-center">
                                        <div className="bg-muted mb-3 flex size-10 items-center justify-center rounded-full">
                                            <MessageSquareIcon className="text-muted-foreground size-5" />
                                        </div>
                                        <p className="text-sm font-medium">
                                            Chat unavailable
                                        </p>
                                        <p className="text-muted-foreground mt-1 text-xs">
                                            This reservation has no linked inquiry ID.
                                        </p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>

                    {isActive && (
                        <div className="text-muted-foreground flex items-center gap-2 text-xs">
                            <AlertTriangleIcon className="size-4" />
                            Reservation actions cannot be undone from this page.
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default AgentReservationRecordDetail;
