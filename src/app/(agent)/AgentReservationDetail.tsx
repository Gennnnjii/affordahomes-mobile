import { ProtectedDocumentPreviewDialog } from "@/components/app/ProtectedDocumentPreviewDialog";
import { agentPortalApi } from "@/db/api/agent.portal.api";
import { asRecord, str } from "@/lib/record";
import { formatPhpCurrency } from "@/lib/format-php-currency";
import { publicStorageUrl } from "@/lib/storage-url";
import { getApiErrorMessage } from "@/lib/api-error";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { useAgentAuth } from "@/db/queries/useAgentAuth";
import { getAgentToken } from "@/lib/tokens";
import { useNavigate, useParams } from "@tanstack/react-router";
import { ScreenBackLink } from "@/components/navigation/ScreenBackLink";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    AlertTriangleIcon,
    CalendarPlusIcon,
    ClipboardCheckIcon,
    ExternalLinkIcon,
    FileTextIcon,
} from "lucide-react";
import { useState } from "react";

const employmentLabels: Record<string, string> = {
    employed: "Employed",
    self_employed: "Self-employed",
    unemployed: "Unemployed",
};

const prequalStatusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    qualified: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    not_qualified: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

type InquiryStatus = "pending" | "responded" | "closed";

const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    responded: "bg-blue-100 text-blue-800",
    closed: "bg-muted text-muted-foreground",
};

const ReservationDetailSkeleton = () => (
    <div className="space-y-6">
        <Skeleton className="h-9 w-36 rounded-md" />
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="border-border/80 space-y-5 rounded-xl border p-6 shadow-sm">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-7 w-48" />
                    <Skeleton className="h-6 w-20 rounded-md" />
                </div>
                <Skeleton className="h-px w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="space-y-4">
                <div className="border-border/80 rounded-xl border p-6 shadow-sm">
                    <Skeleton className="mb-4 h-6 w-24" />
                    <div className="space-y-3">
                        <Skeleton className="h-9 w-full rounded-md" />
                        <Skeleton className="h-9 w-full rounded-md" />
                        <Skeleton className="h-20 w-full rounded-md" />
                        <Skeleton className="h-9 w-full rounded-md" />
                    </div>
                </div>
                <div className="border-border/80 rounded-xl border p-6 shadow-sm">
                    <Skeleton className="mb-3 h-6 w-28" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="mt-1.5 h-4 w-2/3" />
                </div>
            </div>
        </div>
    </div>
);

const AgentReservationDetail = () => {
    const { reservationId } = useParams({ strict: false }) as { reservationId: string };
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const { sessionQuery: agentSession } = useAgentAuth();
    const currentAgentId =
        (agentSession.data?.data as { id_?: string } | undefined)?.id_ ?? "";
    const agentToken = getAgentToken() ?? "";

    const [schedule, setSchedule] = useState("");
    const [location, setLocation] = useState("");
    const [notes, setNotes] = useState("");
    const [isCreateReservationOpen, setIsCreateReservationOpen] = useState(false);
    const [reservationRemarks, setReservationRemarks] = useState("");
    const [isValidIdPreviewOpen, setIsValidIdPreviewOpen] = useState(false);

    const { data, isPending, isError } = useQuery({
        queryKey: ["agent", "inquiry", reservationId],
        queryFn: () => agentPortalApi.inquiry(reservationId),
        enabled: !!reservationId,
    });

    const statusMut = useMutation({
        mutationFn: (status: InquiryStatus) =>
            agentPortalApi.updateInquiryStatus(reservationId, status),
        onSuccess: (_, status) => {
            queryClient.invalidateQueries({ queryKey: ["agent", "inquiries"] });
            queryClient.invalidateQueries({ queryKey: ["agent", "inquiry", reservationId] });
            toast.success(`Status set to ${status}.`);
        },
        onError: (e) => toast.error(getApiErrorMessage(e)),
    });

    const q = asRecord(data?.data);
    const client = asRecord(q.client);
    const property = asRecord(q.property);
    const propertyId = str(property.id);
    const clientId = str(client.id);
    const status = str(q.status) ?? "pending";

    const reservationsQuery = useQuery({
        queryKey: ["agent", "reservations"],
        queryFn: () => agentPortalApi.reservations(),
        enabled: Boolean(reservationId) && status === "responded",
    });

    const hasLinkedReservation =
        reservationsQuery.data?.data.some(
            (reservation) => reservation.inquiry_id === reservationId,
        ) ?? false;
    const isReservationLinkResolved =
        reservationsQuery.isSuccess && !reservationsQuery.isFetching;

    const createReservationMutation = useMutation({
        mutationFn: () =>
            agentPortalApi.createReservation({
                property_id: propertyId!,
                inquiry_id: reservationId,
                remarks: reservationRemarks.trim() || undefined,
            }),
        onSuccess: () => {
            toast.success("Reservation created successfully.");
            setIsCreateReservationOpen(false);
            setReservationRemarks("");
            queryClient.invalidateQueries({ queryKey: ["agent", "inquiries"] });
            queryClient.invalidateQueries({ queryKey: ["agent", "inquiry", reservationId] });
            queryClient.invalidateQueries({ queryKey: ["agent", "reservations"] });
        },
        onError: (error) => toast.error(getApiErrorMessage(error)),
    });

    const { data: prequalData } = useQuery({
        queryKey: ["agent", "client-prequalification", clientId],
        queryFn: () => agentPortalApi.prequalificationByClientId(clientId!),
        enabled: !!clientId,
        refetchInterval: 2_000,
    });

    const prequalMut = useMutation({
        mutationFn: (status: "pending" | "qualified" | "not_qualified") => {
            const rec = asRecord(prequalData?.data);
            const id = str(rec.id);
            if (!id) throw new Error("No prequalification record.");
            return agentPortalApi.updatePrequalificationStatus(id, status);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["agent", "client-prequalification", clientId] });
            queryClient.invalidateQueries({ queryKey: ["agent", "prequalifications"] });
            toast.success("Prequalification status updated.");
        },
        onError: (e) => toast.error(getApiErrorMessage(e)),
    });

    const prequalRecord = prequalData?.data ? asRecord(prequalData.data) : null;
    const prequalStatus = str(prequalRecord?.status) ?? "pending";
    const prequalificationId = str(prequalRecord?.id);
    const hasValidId =
        prequalRecord?.has_valid_id === true || prequalRecord?.has_valid_id === 1;

    const propertyPrice = property.price != null ? Number(property.price) : null;
    const requiredIncome = propertyPrice != null ? propertyPrice * 0.016 : null;
    const clientIncome =
        prequalRecord?.monthly_income != null ? Number(prequalRecord.monthly_income) : null;
    const bracketShortfall =
        requiredIncome != null && clientIncome != null && clientIncome < requiredIncome;
    const colorClass = statusColors[status] ?? statusColors.closed;

    const scheduleMut = useMutation({
        mutationFn: () =>
            agentPortalApi.createAppointment({
                schedule,
                location,
                notes: notes || undefined,
                client_id: str(client.id) ?? "",
                property_id: str(property.id) ?? undefined,
                inquiry_id: reservationId,
            }),
        onSuccess: () => {
            toast.success("Site visit scheduled. The client can now see it in their dashboard.");
            statusMut.mutate("responded");
            queryClient.invalidateQueries({ queryKey: ["agent", "appointments"] });
            setSchedule("");
            setLocation("");
            setNotes("");
            navigate({ to: "/dashboard/agent/appointments" });
        },
        onError: (e) => toast.error(getApiErrorMessage(e)),
    });

    const canSchedule =
        !scheduleMut.isPending &&
        schedule.trim() !== "" &&
        location.trim() !== "" &&
        !!str(client.id);

    const clientFullName = str(client.first_name)
        ? str(client.first_name) + " " + str(client.last_name)
        : "";
    const canCreateReservation =
        Boolean(reservationId) &&
        Boolean(propertyId) &&
        status === "responded" &&
        isReservationLinkResolved &&
        !hasLinkedReservation;

    const handleCreateReservationDialogChange = (open: boolean) => {
        if (createReservationMutation.isPending && !open) {
            return;
        }
        if (!open) {
            setReservationRemarks("");
        }
        setIsCreateReservationOpen(open);
    };

    return (
        <div className="flex flex-col gap-5">
            <ScreenBackLink to="/dashboard/agent/reservations" label="Reservations" hideFrom="md" />

            {isPending ? (
                <ReservationDetailSkeleton />
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
                                    {str(q.subject) ?? "Reservation"}
                                </h1>
                                <p className="text-muted-foreground text-xs">
                                    ID: {reservationId.slice(-8).toUpperCase()}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`rounded-md px-3 py-1 text-xs font-semibold capitalize ${colorClass}`}>
                                {status}
                            </span>
                            {status === "pending" ? (
                                <Button size="sm" variant="secondary"
                                    disabled={statusMut.isPending}
                                    onClick={() => statusMut.mutate("responded")}>
                                    Mark responded
                                </Button>
                            ) : null}
                            {status === "responded" && !isReservationLinkResolved ? (
                                <span className="text-muted-foreground text-xs">
                                    {reservationsQuery.isError
                                        ? "Reservation status unavailable."
                                        : "Checking reservation status…"}
                                </span>
                            ) : null}
                            {canCreateReservation && (
                                <Dialog open={isCreateReservationOpen} onOpenChange={handleCreateReservationDialogChange}>
                                    <Button size="sm" variant="default"
                                        disabled={createReservationMutation.isPending}
                                        onClick={() => setIsCreateReservationOpen(true)}>
                                        Create Reservation
                                    </Button>
                                    <DialogContent className="sm:max-w-md">
                                        <DialogHeader>
                                            <DialogTitle>Create reservation</DialogTitle>
                                            <DialogDescription>
                                                Create a reservation for {str(property.title) || "this property"}.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="reservation-remarks">Remarks</Label>
                                                <Textarea
                                                    id="reservation-remarks"
                                                    placeholder="Add any notes for the reservation…"
                                                    rows={4}
                                                    value={reservationRemarks}
                                                    onChange={(e) => setReservationRemarks(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => handleCreateReservationDialogChange(false)}
                                                disabled={createReservationMutation.isPending}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                type="button"
                                                onClick={() => createReservationMutation.mutate()}
                                                disabled={createReservationMutation.isPending}
                                            >
                                                {createReservationMutation.isPending ? "Creating…" : "Create Reservation"}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            )}
                            {status !== "closed" ? (
                                <Button size="sm" variant="outline"
                                    disabled={statusMut.isPending}
                                    onClick={() => statusMut.mutate("closed")}>
                                    Close
                                </Button>
                            ) : null}
                        </div>
                    </div>

                    {/* ── Main workspace ── */}
                    <div className="grid items-start gap-5 lg:grid-cols-[1fr_380px]">

                        {/* LEFT — inquiry info + prequal + schedule */}
                        <div className="space-y-4">

                            {/* Inquiry message + property */}
                            <Card className="border-border/80 shadow-sm">
                                <CardContent className="p-5 space-y-4">
                                    <div className="flex items-center gap-2">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            Client message
                                        </p>
                                    </div>
                                    {str(q.message) ? (
                                        <p className="text-sm leading-relaxed">{str(q.message)}</p>
                                    ) : (
                                        <p className="text-muted-foreground text-sm italic">No message provided.</p>
                                    )}
                                    {str(property.title) && (
                                        <>
                                            <Separator />
                                            <div className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-1.5">
                                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Property</p>
                                                <p className="font-medium text-sm">{str(property.title)}</p>
                                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                                    {str(property.project) && (
                                                        <span><span className="font-medium text-foreground">Project:</span> {str(property.project)}</span>
                                                    )}
                                                    {str(property.block) && (
                                                        <span><span className="font-medium text-foreground">Block:</span> {str(property.block)}</span>
                                                    )}
                                                    {str(property.lot_number) && (
                                                        <span><span className="font-medium text-foreground">Lot:</span> {str(property.lot_number)}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Schedule site visit */}
                            {status !== "closed" ? (
                                <Card className="border-border/80 shadow-sm">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center gap-2">
                                            <CalendarPlusIcon className="text-primary size-4" />
                                            <CardTitle className="text-base">Schedule site visit</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="grid gap-3 sm:grid-cols-2">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="sv-schedule">Date &amp; time</Label>
                                            <Input id="sv-schedule" type="datetime-local" value={schedule}
                                                onChange={(e) => setSchedule(e.target.value)} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="sv-location">Location</Label>
                                            <Input id="sv-location" placeholder="e.g. Model unit, Block 3 Lot 5"
                                                value={location} onChange={(e) => setLocation(e.target.value)} />
                                        </div>
                                        <div className="space-y-1.5 sm:col-span-2">
                                            <Label htmlFor="sv-notes">
                                                Notes <span className="text-muted-foreground font-normal">(optional)</span>
                                            </Label>
                                            <Textarea id="sv-notes" placeholder="Any preparation notes for the client…"
                                                rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <Button className="w-full" size="sm" disabled={!canSchedule}
                                                onClick={() => scheduleMut.mutate()}>
                                                {scheduleMut.isPending ? "Scheduling…" : "Confirm site visit"}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : null}

                            {/* Prequalification */}
                            <Card className="border-border/80 shadow-sm">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center gap-2">
                                        <ClipboardCheckIcon className="text-primary size-4" />
                                        <CardTitle className="text-base">Client prequalification</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {!prequalRecord ? (
                                        <p className="text-muted-foreground text-sm">No prequalification submitted yet.</p>
                                    ) : (
                                        <>
                                            {bracketShortfall && requiredIncome != null && clientIncome != null && (
                                                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                                                    <AlertTriangleIcon className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
                                                    <div className="text-xs">
                                                        <p className="font-medium text-amber-900">Salary bracket may not qualify</p>
                                                        <p className="mt-0.5 text-amber-800">
                                                            Required: ₱{requiredIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })} / mo. &nbsp;
                                                            Declared: ₱{clientIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })} / mo.
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                                                <span className="text-muted-foreground">Employment</span>
                                                <span className="font-medium text-right">
                                                    {employmentLabels[str(prequalRecord.employment_status) ?? ""] ??
                                                        (str(prequalRecord.employment_status) || "—")}
                                                </span>
                                                <span className="text-muted-foreground">Monthly income</span>
                                                <span className="font-medium tabular-nums text-right">
                                                    {prequalRecord.monthly_income != null
                                                        ? formatPhpCurrency(prequalRecord.monthly_income as number) : "—"}
                                                </span>
                                                <span className="text-muted-foreground">Pag-IBIG member</span>
                                                <span className="font-medium text-right">
                                                    {prequalRecord.is_pagibig_member ? "Yes" : "No"}
                                                </span>
                                                {str(prequalRecord.company_name) && (
                                                    <>
                                                        <span className="text-muted-foreground">Company</span>
                                                        <span className="font-medium text-right">{str(prequalRecord.company_name)}</span>
                                                    </>
                                                )}
                                            </div>
                                            <Separator />
                                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Documents</p>
                                            {[
                                                { label: "Payslip", path: prequalRecord.payslip_url },
                                                { label: "Pag-IBIG doc", path: prequalRecord.pagibig_url },
                                            ].map(({ label, path }) => {
                                                const url = publicStorageUrl(str(path)) ?? null;
                                                return (
                                                    <div key={label} className="flex items-center justify-between gap-2">
                                                        <span className="text-sm">{label}</span>
                                                        {url ? (
                                                            <a href={url} target="_blank" rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                                                                View <ExternalLinkIcon className="size-3" />
                                                            </a>
                                                        ) : (
                                                            <span className="text-muted-foreground text-xs">Not uploaded</span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-sm">Valid ID</span>
                                                {hasValidId ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsValidIdPreviewOpen(true)}
                                                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                                                    >
                                                        View <ExternalLinkIcon className="size-3" />
                                                    </button>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs">Not uploaded</span>
                                                )}
                                            </div>
                                            <Separator />
                                            <div className="flex items-center justify-between">
                                                <span className={`rounded-md px-2 py-0.5 text-xs font-medium capitalize ${prequalStatusColors[prequalStatus] ?? prequalStatusColors.pending}`}>
                                                    {prequalStatus.replace("_", " ")}
                                                </span>
                                                {status !== "closed" ? (
                                                    <div className="flex gap-1.5">
                                                        <Button size="sm" variant="secondary"
                                                            disabled={prequalMut.isPending || prequalStatus === "qualified"}
                                                            onClick={() => prequalMut.mutate("qualified")}>
                                                            Qualified
                                                        </Button>
                                                        <Button size="sm" variant="outline"
                                                            disabled={prequalMut.isPending || prequalStatus === "not_qualified"}
                                                            onClick={() => prequalMut.mutate("not_qualified")}>
                                                            Not qualified
                                                        </Button>
                                                    </div>
                                                ) : null}
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* RIGHT — client info + chat */}
                        <div className="space-y-4">
                            {/* Client card */}
                            <Card className="border-border/80 shadow-sm">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-primary">
                                            {clientFullName.split(" ").map((w: string) => w[0]).slice(0, 2).join("")}
                                        </div>
                                        <div>
                                            <p className="font-semibold leading-tight">{clientFullName || "—"}</p>
                                            {str(client.email) && (
                                                <p className="text-muted-foreground text-xs">{str(client.email)}</p>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Chat panel — grows to fill remaining space */}
                            {status === "closed" ? (
                                <Card className="border-border/80 shadow-sm">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base">Conversation closed</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-muted-foreground text-sm">
                                            Chat is unavailable because this inquiry is closed.
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <ChatPanel
                                    inquiryId={reservationId}
                                    token={agentToken}
                                    currentUserId={currentAgentId}
                                    otherName={clientFullName || undefined}
                                    className="h-[480px]"
                                />
                            )}
                        </div>
                    </div>
                </>
            )}

            {isValidIdPreviewOpen ? (
                <ProtectedDocumentPreviewDialog
                    open
                    onOpenChange={setIsValidIdPreviewOpen}
                    fetchDocument={() =>
                        prequalificationId
                            ? agentPortalApi.prequalificationValidId(prequalificationId)
                            : Promise.reject(new Error("Valid ID is unavailable."))
                    }
                    title="Valid government ID"
                />
            ) : null}
        </div>
    );
};

export default AgentReservationDetail;
