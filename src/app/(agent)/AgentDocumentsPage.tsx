import { agentPortalApi } from "@/db/api/agent.portal.api";
import { asRecord, str } from "@/lib/record";
import { publicStorageUrl } from "@/lib/storage-url";
import { getApiErrorMessage } from "@/lib/api-error";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScreenBackLink } from "@/components/navigation/ScreenBackLink";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
    AlertCircleIcon,
    CheckCircle2Icon,
    ClockIcon,
    ExternalLinkIcon,
    UploadCloudIcon,
} from "lucide-react";

type DocField =
    | "nbi_clearance"
    | "police_clearance"
    | "tin_number"
    | "resume"
    | "cv"
    | "birth_certificate";

type DocStatus = "pending" | "approved" | "rejected";

const DOCUMENT_DEFS: { field: DocField; label: string; hint: string }[] = [
    { field: "nbi_clearance", label: "NBI clearance", hint: "National Bureau of Investigation clearance" },
    { field: "police_clearance", label: "Police clearance", hint: "Local police clearance" },
    { field: "tin_number", label: "TIN number document", hint: "BIR TIN card or proof of TIN" },
    { field: "resume", label: "Resume", hint: "Updated resume / work history" },
    { field: "cv", label: "CV", hint: "Curriculum vitae — full academic and work history" },
    { field: "birth_certificate", label: "Birth certificate", hint: "PSA-issued birth certificate" },
];

const statusConfig: Record<
    DocStatus | "none",
    { label: string; className: string; icon: React.ReactNode }
> = {
    none: {
        label: "Not uploaded",
        className: "bg-muted text-muted-foreground",
        icon: <ClockIcon className="size-3" />,
    },
    pending: {
        label: "Pending review",
        className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
        icon: <ClockIcon className="size-3" />,
    },
    approved: {
        label: "Approved",
        className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
        icon: <CheckCircle2Icon className="size-3" />,
    },
    rejected: {
        label: "Rejected",
        className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
        icon: <AlertCircleIcon className="size-3" />,
    },
};

const AgentDocumentsPage = () => {
    const queryClient = useQueryClient();

    const docsQ = useQuery({
        queryKey: ["agent", "my-documents"],
        queryFn: () => agentPortalApi.myDocuments(),
        refetchInterval: 2_000,
    });

    const docs = asRecord(docsQ.data?.data);

    const [uploading, setUploading] = useState<DocField | null>(null);
    const inputRefs = useRef<Partial<Record<DocField, HTMLInputElement | null>>>({});

    const uploadMut = useMutation({
        mutationFn: ({ field, file }: { field: DocField; file: File }) =>
            agentPortalApi.uploadDocument(field, file),
        onSuccess: (_, { field }) => {
            queryClient.invalidateQueries({ queryKey: ["agent", "my-documents"] });
            toast.success(
                `${DOCUMENT_DEFS.find((d) => d.field === field)?.label} uploaded — pending admin review.`,
            );
            setUploading(null);
        },
        onError: (e) => {
            toast.error(getApiErrorMessage(e));
            setUploading(null);
        },
    });

    const handleFileChange = (field: DocField, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(field);
        uploadMut.mutate({ field, file });
        e.target.value = "";
    };

    const approvedCount = DOCUMENT_DEFS.filter(
        ({ field }) => str(docs[`${field}_status`]) === "approved",
    ).length;

    const rejectedCount = DOCUMENT_DEFS.filter(
        ({ field }) => str(docs[`${field}_status`]) === "rejected",
    ).length;

    return (
        <div className="space-y-6">
            <ScreenBackLink to="/dashboard/agent" label="Dashboard" hideFrom="md" />
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">My documents</h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    Upload your required employment documents. Each document is reviewed by your
                    administrator before it is approved.
                </p>
            </div>

            {/* Summary bar */}
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border/60 bg-muted/40 px-4 py-3 text-sm">
                <span className="flex items-center gap-1.5">
                    <CheckCircle2Icon className="size-4 text-emerald-500" />
                    <span className="font-medium">{approvedCount}</span>
                    <span className="text-muted-foreground">approved</span>
                </span>
                <span className="text-border">·</span>
                {rejectedCount > 0 && (
                    <>
                        <span className="flex items-center gap-1.5">
                            <AlertCircleIcon className="size-4 text-red-500" />
                            <span className="font-medium">{rejectedCount}</span>
                            <span className="text-muted-foreground">need re-upload</span>
                        </span>
                        <span className="text-border">·</span>
                    </>
                )}
                <span className="text-muted-foreground">
                    {DOCUMENT_DEFS.length - approvedCount - rejectedCount} pending / not uploaded
                </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {DOCUMENT_DEFS.map(({ field, label, hint }) => {
                    const storedUrl = str(docs[`${field}_url`]) ?? null;
                    const rawStatus = str(docs[`${field}_status`]) as DocStatus | null;
                    const statusKey = storedUrl ? (rawStatus ?? "pending") : "none";
                    const config = statusConfig[statusKey];
                    const publicUrl = storedUrl ? publicStorageUrl(storedUrl) : null;
                    const rejReason = str(docs[`${field}_rejection_reason`]) ?? null;
                    const isUploading = uploading === field && uploadMut.isPending;
                    const canUpload = !storedUrl || statusKey === "rejected";
                    const canReplace = !!storedUrl && statusKey !== "rejected";

                    return (
                        <Card
                            key={field}
                            className={`border-border/80 overflow-hidden ${statusKey === "rejected" ? "border-red-300 dark:border-red-800" : ""
                                }`}
                        >
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between gap-2">
                                    <CardTitle className="text-sm font-semibold">{label}</CardTitle>
                                    <span className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${config.className}`}>
                                        {config.icon}
                                        {config.label}
                                    </span>
                                </div>
                                <CardDescription className="text-xs">{hint}</CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-3 pt-0">
                                {/* Rejection reason */}
                                {statusKey === "rejected" && rejReason && (
                                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 dark:border-red-800 dark:bg-red-950/30">
                                        <p className="text-xs font-medium text-red-700 dark:text-red-400">
                                            Rejection reason
                                        </p>
                                        <p className="mt-0.5 text-xs leading-relaxed text-red-600 dark:text-red-300">
                                            {rejReason}
                                        </p>
                                    </div>
                                )}

                                {/* View link */}
                                {publicUrl && (
                                    <a
                                        href={publicUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline dark:text-blue-400"
                                    >
                                        <ExternalLinkIcon className="size-3.5" />
                                        View current file
                                    </a>
                                )}

                                <input
                                    ref={(el) => { inputRefs.current[field] = el; }}
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    className="hidden"
                                    onChange={(e) => handleFileChange(field, e)}
                                />

                                {/* Upload button */}
                                {(canUpload || canReplace) && (
                                    <Button
                                        size="sm"
                                        variant={statusKey === "rejected" ? "destructive" : canReplace ? "outline" : "default"}
                                        className="w-full gap-1.5"
                                        disabled={isUploading}
                                        onClick={() => inputRefs.current[field]?.click()}
                                    >
                                        <UploadCloudIcon className="size-3.5" />
                                        {isUploading
                                            ? "Uploading…"
                                            : statusKey === "rejected"
                                                ? "Re-upload file"
                                                : canReplace
                                                    ? "Replace file"
                                                    : "Upload file"}
                                    </Button>
                                )}

                                <p className="text-muted-foreground text-center text-xs">
                                    PDF, JPG, PNG — max 5 MB
                                </p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

export default AgentDocumentsPage;
