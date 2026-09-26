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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useParams } from "@tanstack/react-router";
import { ScreenBackLink } from "@/components/navigation/ScreenBackLink";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";
import {
    AlertTriangleIcon,
    BadgeCheckIcon,
    BriefcaseIcon,
    BuildingIcon,
    FileTextIcon,
    UserIcon,
    XCircleIcon,
    ZoomInIcon,
} from "lucide-react";

type PrequalStatus = "pending" | "qualified" | "not_qualified";

const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    qualified: "bg-green-100 text-green-800",
    not_qualified: "bg-red-100 text-red-800",
};

const employmentLabels: Record<string, string> = {
    employed: "Employed",
    self_employed: "Self-employed",
    unemployed: "Unemployed",
};

const PrequalDetailSkeleton = () => (
    <div className="space-y-6">
        <Skeleton className="h-9 w-40 rounded-md" />
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
            <div className="border-border/80 space-y-5 rounded-xl border p-6 shadow-sm">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-7 w-48" />
                    <Skeleton className="h-6 w-24 rounded-md" />
                </div>
                <Skeleton className="h-px w-full" />
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex gap-3">
                        <Skeleton className="size-9 shrink-0 rounded-lg" />
                        <div className="flex-1 space-y-1.5">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-4 w-2/3" />
                        </div>
                    </div>
                ))}
            </div>
            <div className="space-y-4">
                <div className="border-border/80 rounded-xl border p-6 shadow-sm">
                    <Skeleton className="mb-4 h-6 w-28" />
                    <div className="flex flex-wrap gap-2">
                        <Skeleton className="h-8 w-24 rounded-md" />
                        <Skeleton className="h-8 w-28 rounded-md" />
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const AgentPrequalificationDetail = () => {
    const { prequalificationId } = useParams({ strict: false }) as { prequalificationId: string };
    const queryClient = useQueryClient();

    const { data, isPending, isError } = useQuery({
        queryKey: ["agent", "prequalification", prequalificationId],
        queryFn: () => agentPortalApi.prequalification(prequalificationId),
        enabled: !!prequalificationId,
    });

    const identityQuery = useQuery({
        queryKey: [
            "agent",
            "prequalification",
            prequalificationId,
            "identity-verification",
        ],
        queryFn: () =>
            agentPortalApi.prequalificationIdentityVerification(prequalificationId),
        enabled: !!prequalificationId,
        refetchInterval: 2_000,
    });

    const invalidateIdentityQueries = () =>
        Promise.all([
            queryClient.invalidateQueries({
                queryKey: ["agent", "prequalifications"],

            }),

            queryClient.invalidateQueries({
                queryKey: ["agent", "prequalification", prequalificationId],
            }),
            queryClient.invalidateQueries({
                queryKey: [
                    "agent",
                    "prequalification",
                    prequalificationId,
                    "identity-verification",
                ],

            }),
        ]);

    const statusMut = useMutation({
        mutationFn: (status: PrequalStatus) =>
            agentPortalApi.updatePrequalificationStatus(prequalificationId, status),
        onSuccess: (_, status) => {
            queryClient.invalidateQueries({ queryKey: ["agent", "prequalifications"] });
            queryClient.invalidateQueries({
                queryKey: ["agent", "prequalification", prequalificationId],
            });
            toast.success(`Status set to ${status.replace("_", " ")}.`);
        },
        onError: (e) => toast.error(getApiErrorMessage(e)),
    });

    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isValidIdPreviewOpen, setIsValidIdPreviewOpen] = useState(false);
    const [isRejectOpen, setIsRejectOpen] = useState(false);
    const [rejectionRemarks, setRejectionRemarks] = useState("");

    const verifyIdentityMutation = useMutation({
        mutationFn: () =>
            agentPortalApi.verifyPrequalificationIdentity(prequalificationId),
        onSuccess: async () => {
            await invalidateIdentityQueries();
            toast.success("Client identity verified.");
        },
        onError: (error) => toast.error(getApiErrorMessage(error)),
    });

    const rejectIdentityMutation = useMutation({
        mutationFn: () =>
            agentPortalApi.rejectPrequalificationIdentity(
                prequalificationId,
                rejectionRemarks.trim(),
            ),
        onSuccess: async () => {
            setIsRejectOpen(false);
            setRejectionRemarks("");
            await invalidateIdentityQueries();
            toast.success("Client identity rejected.");
        },
        onError: (error) => toast.error(getApiErrorMessage(error)),
    });

    const pq = asRecord(data?.data);
    const client = asRecord(pq.client);
    const inquiry = asRecord(pq.inquiry);
    const status = str(pq.status) ?? "pending";
    const colorClass = statusColors[status] ?? statusColors.pending;
    const employmentStatus = str(pq.employment_status) ?? "";

    const propertyPrice = inquiry.property
        ? (asRecord(inquiry.property).price as number | null | undefined)
        : null;
    const requiredIncome = propertyPrice != null ? propertyPrice * 0.016 : null;
    const clientIncome = pq.monthly_income != null ? Number(pq.monthly_income) : null;
    const bracketShortfall =
        requiredIncome != null && clientIncome != null && clientIncome < requiredIncome;

    const docs = [
        { label: "Payslip / Proof of income", url: publicStorageUrl(str(pq.payslip_url)) ?? null },
        { label: "Pag-IBIG membership document", url: publicStorageUrl(str(pq.pagibig_url)) ?? null },
    ];
    const identity = identityQuery.data?.data;
    const identityStatus = identity?.identity_verification_status ?? null;
    const hasValidId = identity?.has_valid_id ?? false;
    const identityMutationPending =
        verifyIdentityMutation.isPending || rejectIdentityMutation.isPending;

    return (
        <div className="space-y-6">
            <ScreenBackLink to="/dashboard/agent/prequalifications" label="Prequalifications" hideFrom="md" />

            {isPending ? (
                <PrequalDetailSkeleton />
            ) : isError ? (
                <p className="text-destructive">Could not load prequalification record.</p>
            ) : (
                <div className="grid gap-6 lg:grid-cols-[1fr_300px]">

                    <Card className="border-border/80 shadow-sm">
                        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/10 flex size-9 shrink-0 items-center justify-center rounded-lg">
                                    <FileTextIcon className="text-primary size-4" />
                                </div>
                                <CardTitle className="text-lg">Prequalification record</CardTitle>
                            </div>
                            <span
                                className={`rounded-md px-2.5 py-0.5 text-xs font-semibold capitalize whitespace-nowrap ${colorClass}`}
                            >
                                {status.replace("_", " ")}
                            </span>
                        </CardHeader>
                        <CardContent>
                            <Separator className="mb-5" />

                            {bracketShortfall && requiredIncome != null && clientIncome != null && (
                                <div className="mb-5 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800/40 dark:bg-amber-900/20">
                                    <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                                    <div className="text-sm">
                                        <p className="font-medium text-amber-900 dark:text-amber-200">
                                            Salary bracket may not qualify
                                        </p>
                                        <p className="mt-0.5 text-xs text-amber-800 dark:text-amber-300">
                                            The linked property requires a minimum monthly income of{" "}
                                            <strong>₱{requiredIncome.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</strong>
                                            {" "}based on the 1.6% bracket rule. Client declared{" "}
                                            <strong>₱{clientIncome.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</strong>.
                                            Consider suggesting a lower-priced option.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">

                                <div className="flex items-start gap-3">
                                    <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg">
                                        <BriefcaseIcon className="text-muted-foreground size-4" />
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                                            Employment status
                                        </p>
                                        <p className="mt-0.5 font-medium">
                                            {employmentLabels[employmentStatus] ?? (employmentStatus || "—")}
                                        </p>
                                    </div>
                                </div>

                                {pq.monthly_income != null && (
                                    <div className="flex items-start gap-3">
                                        <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg">
                                            <span className="text-muted-foreground text-xs font-bold">₱</span>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                                                Monthly income
                                            </p>
                                            <p className="mt-0.5 font-medium">
                                                {formatPhpCurrency(pq.monthly_income as number)}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-start gap-3">
                                    <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg">
                                        {pq.is_pagibig_member ? (
                                            <BadgeCheckIcon className="text-green-600 size-4" />
                                        ) : (
                                            <XCircleIcon className="text-muted-foreground size-4" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                                            Pag-IBIG member
                                        </p>
                                        <p className="mt-0.5 font-medium">
                                            {pq.is_pagibig_member ? "Yes" : "No"}
                                        </p>
                                    </div>
                                </div>

                                {str(pq.company_name) && (
                                    <div className="flex items-start gap-3">
                                        <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg">
                                            <BuildingIcon className="text-muted-foreground size-4" />
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                                                Company
                                            </p>
                                            <p className="mt-0.5 font-medium">{str(pq.company_name)}</p>
                                        </div>
                                    </div>
                                )}

                                {str(pq.notes) && (
                                    <>
                                        <Separator />
                                        <p className="text-muted-foreground text-sm leading-relaxed">
                                            {str(pq.notes)}
                                        </p>
                                    </>
                                )}

                                <Separator />

                                <div className="space-y-3">
                                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                                        Supporting documents
                                    </p>
                                    {docs.map(({ label, url }) => (
                                        <div key={label} className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${url ? "bg-green-100 dark:bg-green-900/30" : "bg-muted"
                                                        }`}
                                                >
                                                    <FileTextIcon
                                                        className={`size-3.5 ${url
                                                            ? "text-green-700 dark:text-green-400"
                                                            : "text-muted-foreground"
                                                            }`}
                                                    />
                                                </div>
                                                <span className="text-sm">{label}</span>
                                            </div>
                                            {url ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setPreviewUrl(url)}
                                                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400"
                                                >
                                                    <ZoomInIcon className="size-3" />
                                                    View
                                                </button>
                                            ) : (
                                                <span className="text-muted-foreground text-xs">Not uploaded</span>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {!!inquiry.id && (
                                    <>
                                        <Separator />
                                        <p className="text-muted-foreground text-sm">
                                            <span className="text-foreground font-medium">Linked inquiry: </span>
                                            {str(inquiry.subject) ?? str(inquiry.id) ?? "—"}
                                        </p>
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-4">

                        <Card className="border-border/80 shadow-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Identity verification</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {identityQuery.isPending ? (
                                    <div className="space-y-2">
                                        <Skeleton className="h-5 w-24" />
                                        <Skeleton className="h-9 w-full" />
                                    </div>
                                ) : identityQuery.isError ? (
                                    <p className="text-destructive text-sm" role="alert">
                                        Could not load identity verification details.
                                    </p>
                                ) : (
                                    <>
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-muted-foreground text-sm">Status</span>
                                            <span
                                                className={`rounded-md px-2 py-0.5 text-xs font-semibold capitalize ${identityStatus === "verified"
                                                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                                    : identityStatus === "rejected"
                                                        ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                                        : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                                                    }`}
                                            >
                                                {identityStatus ?? "Not submitted"}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-muted-foreground text-sm">
                                                Valid government ID
                                            </span>
                                            {hasValidId ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setIsValidIdPreviewOpen(true)}
                                                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400"
                                                >
                                                    <ZoomInIcon className="size-3" />
                                                    View
                                                </button>
                                            ) : (
                                                <span className="text-muted-foreground text-xs">
                                                    Not uploaded
                                                </span>
                                            )}
                                        </div>

                                        {identityStatus === "rejected" &&
                                            identity?.identity_rejection_remarks ? (
                                            <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900/50 dark:bg-red-950/20">
                                                <p className="text-xs font-medium text-red-800 dark:text-red-300">
                                                    Rejection remarks
                                                </p>
                                                <p className="mt-1 break-words text-sm text-red-700 dark:text-red-300">
                                                    {identity.identity_rejection_remarks}
                                                </p>
                                            </div>
                                        ) : null}

                                        {identityStatus === "pending" && hasValidId ? (
                                            <div className="flex flex-wrap gap-2">
                                                <Button
                                                    size="sm"
                                                    disabled={identityMutationPending}
                                                    onClick={() => verifyIdentityMutation.mutate()}
                                                >
                                                    {verifyIdentityMutation.isPending
                                                        ? "Verifying..."
                                                        : "Verify identity"}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    disabled={identityMutationPending}
                                                    onClick={() => setIsRejectOpen(true)}
                                                >
                                                    Reject
                                                </Button>
                                            </div>
                                        ) : null}

                                        <p className="text-muted-foreground text-xs leading-relaxed">
                                            Identity verification is reviewed separately from
                                            financial qualification.
                                        </p>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="border-border/80 shadow-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">
                                    Financial qualification
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-wrap gap-2">
                                <Button
                                    size="sm"
                                    disabled={statusMut.isPending || status === "qualified"}
                                    onClick={() => statusMut.mutate("qualified")}
                                >
                                    Qualified
                                </Button>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    disabled={statusMut.isPending || status === "not_qualified"}
                                    onClick={() => statusMut.mutate("not_qualified")}
                                >
                                    Not qualified
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    disabled={statusMut.isPending || status === "pending"}
                                    onClick={() => statusMut.mutate("pending")}
                                >
                                    Reset to pending
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="border-border/80 shadow-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Client</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-full">
                                        <UserIcon className="text-muted-foreground size-4" />
                                    </div>
                                    <div>
                                        <p className="font-medium">
                                            {str(client.first_name)} {str(client.last_name)}
                                        </p>
                                        {str(client.email) && (
                                            <p className="text-muted-foreground text-xs">{str(client.email)}</p>
                                        )}
                                        {str(client.phone) && (
                                            <p className="text-muted-foreground text-xs">{str(client.phone)}</p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                    </div>
                </div>
            )}

            <Dialog
                open={isRejectOpen}
                onOpenChange={(open) => {
                    if (!rejectIdentityMutation.isPending) {
                        setIsRejectOpen(open);
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject identity verification</DialogTitle>
                        <DialogDescription>
                            Explain what the Client must correct before submitting another valid ID.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 py-2">
                        <Label htmlFor="identity-rejection-remarks">Rejection remarks</Label>
                        <Textarea
                            id="identity-rejection-remarks"
                            value={rejectionRemarks}
                            onChange={(event) => setRejectionRemarks(event.target.value)}
                            maxLength={1000}
                            rows={4}
                            placeholder="Describe why the submitted ID cannot be verified."
                            disabled={rejectIdentityMutation.isPending}
                        />
                        <p className="text-muted-foreground text-right text-xs">
                            {rejectionRemarks.length}/1000
                        </p>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={rejectIdentityMutation.isPending}
                            onClick={() => setIsRejectOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            disabled={
                                rejectIdentityMutation.isPending ||
                                rejectionRemarks.trim().length === 0
                            }
                            onClick={() => rejectIdentityMutation.mutate()}
                        >
                            {rejectIdentityMutation.isPending
                                ? "Rejecting..."
                                : "Reject identity"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {isValidIdPreviewOpen ? (
                <ProtectedDocumentPreviewDialog
                    open
                    onOpenChange={setIsValidIdPreviewOpen}
                    fetchDocument={() =>
                        agentPortalApi.prequalificationValidId(prequalificationId)
                    }
                    title="Valid government ID"
                />
            ) : null}

            <Dialog open={!!previewUrl} onOpenChange={(open) => { if (!open) setPreviewUrl(null); }}>
                <DialogContent
                    className="flex flex-col gap-0 overflow-hidden p-0"
                    style={{ maxWidth: "min(92vw, 1100px)", height: "90vh" }}
                >
                    <DialogHeader className="shrink-0 border-b px-4 py-3">
                        <DialogTitle className="text-sm font-medium">Document preview</DialogTitle>
                    </DialogHeader>
                    <div className="bg-muted flex flex-1 overflow-hidden">
                        {previewUrl && (
                            previewUrl.toLowerCase().includes(".pdf") ? (
                                <iframe
                                    src={previewUrl}
                                    title="Document preview"
                                    className="h-full w-full border-0"
                                />
                            ) : (
                                <div className="flex flex-1 items-center justify-center overflow-auto p-4">
                                    <img
                                        src={previewUrl}
                                        alt="Document preview"
                                        className="max-h-full w-auto object-contain"
                                    />
                                </div>
                            )
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AgentPrequalificationDetail;
