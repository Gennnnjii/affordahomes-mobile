import { ProtectedDocumentPreviewDialog } from "@/components/app/ProtectedDocumentPreviewDialog";
import { clientPortalApi } from "@/db/api/client.portal.api";
import { getApiErrorMessage } from "@/lib/api-error";
import { asRecord, str } from "@/lib/record";
import { publicStorageUrl } from "@/lib/storage-url";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useEffect, useRef, useState } from "react";
import { ScreenBackLink } from "@/components/navigation/ScreenBackLink";
import {
    CheckCircle2Icon,
    FileTextIcon,
    PaperclipIcon,
    UploadCloudIcon,
    ZoomInIcon,
} from "lucide-react";

type EmploymentStatus = "employed" | "self_employed" | "unemployed";
type IdentityDisplayStatus = "not_submitted" | "pending" | "verified" | "rejected";

const identityStatusStyles: Record<IdentityDisplayStatus, string> = {
    not_submitted: "bg-muted text-muted-foreground",
    pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    verified: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const identityStatusLabels: Record<IdentityDisplayStatus, string> = {
    not_submitted: "Not submitted",
    pending: "Pending review",
    verified: "Verified",
    rejected: "Rejected",
};

interface PrequalFormValues {
    employment_status: EmploymentStatus;
    monthly_income: string;
    is_pagibig_member: boolean;
    company_name: string;
    notes: string;
}

const employmentLabels: Record<EmploymentStatus, string> = {
    employed: "Employed",
    self_employed: "Self-employed",
    unemployed: "Unemployed",
};


const ClientPrequalificationPage = () => {
    const qc = useQueryClient();
    const payslipRef = useRef<HTMLInputElement | null>(null);
    const pagibigRef = useRef<HTMLInputElement | null>(null);
    const validIdRef = useRef<HTMLInputElement | null>(null);

    const [payslipSelected, setPayslipSelected] = useState<File | null>(null);
    const [pagibigSelected, setPagibigSelected] = useState<File | null>(null);
    const [validIdSelected, setValidIdSelected] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isValidIdPreviewOpen, setIsValidIdPreviewOpen] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    const { data, isPending, isError } = useQuery({
        queryKey: ["client", "prequalification"],
        queryFn: () => clientPortalApi.getOwnPrequalification(),
        refetchInterval: 2_000,
    });

    const record = data?.data ? asRecord(data.data) : null;
    const isSubmitted = !!record && !!str(record.submitted_at);
    const hasValidId = record?.has_valid_id === true || record?.has_valid_id === 1;
    const rawIdentityStatus = str(record?.identity_verification_status);
    const identityStatus: IdentityDisplayStatus = !hasValidId
        ? "not_submitted"
        : rawIdentityStatus === "verified" || rawIdentityStatus === "rejected"
            ? rawIdentityStatus
            : "pending";
    const identityRejectionRemarks = str(record?.identity_rejection_remarks);
    const isIdentityVerified = identityStatus === "verified";

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<PrequalFormValues>({
        defaultValues: {
            employment_status: "employed",
            monthly_income: "",
            is_pagibig_member: false,
            company_name: "",
            notes: "",
        },
    });

    useEffect(() => {
        if (!record) return;
        if (str(record.employment_status)) {
            setValue("employment_status", str(record.employment_status) as EmploymentStatus);
        }
        if (record.monthly_income !== undefined && record.monthly_income !== null) {
            setValue("monthly_income", String(record.monthly_income));
        }
        setValue("is_pagibig_member", record.is_pagibig_member === true || record.is_pagibig_member === 1);
        setValue("company_name", str(record.company_name) ?? "");
        setValue("notes", str(record.notes) ?? "");
    }, [record, setValue]);

    const mutation = useMutation({
        mutationFn: (formData: FormData) => clientPortalApi.upsertPrequalification(formData),
        onMutate: () => setSaveError(null),
        onSuccess: () => {
            setSaveError(null);
            qc.invalidateQueries({ queryKey: ["client", "prequalification"] });
            setPayslipSelected(null);
            setPagibigSelected(null);
            setValidIdSelected(null);
            if (payslipRef.current) payslipRef.current.value = "";
            if (pagibigRef.current) pagibigRef.current.value = "";
            if (validIdRef.current) validIdRef.current.value = "";
        },
        onError: (error) => {
            const responseStatus = (error as { response?: { status?: number } }).response?.status;
            setSaveError(
                responseStatus === 409
                    ? "Your verified government ID cannot be replaced through this form."
                    : getApiErrorMessage(error),
            );
        },
    });

    const onSubmit = handleSubmit((values) => {
        const fd = new FormData();
        fd.append("employment_status", values.employment_status);
        if (values.monthly_income) fd.append("monthly_income", values.monthly_income);
        fd.append("is_pagibig_member", values.is_pagibig_member ? "1" : "0");
        if (values.company_name) fd.append("company_name", values.company_name);
        if (values.notes) fd.append("notes", values.notes);

        const payslipFile = payslipRef.current?.files?.[0];
        const pagibigFile = pagibigRef.current?.files?.[0];
        const validIdFile = validIdRef.current?.files?.[0];

        if (payslipFile) fd.append("payslip", payslipFile);
        if (pagibigFile) fd.append("pagibig_doc", pagibigFile);
        if (validIdFile) fd.append("valid_id", validIdFile);

        mutation.mutate(fd);
    });

    const isPagibig = watch("is_pagibig_member");
    const employment = watch("employment_status");

    if (isPending) {
        return (
            <div className="flex min-h-[200px] items-center justify-center">
                <Spinner className="size-6" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="space-y-6">
                <ScreenBackLink to="/dashboard" label="Dashboard" hideFrom="md" />
                <PageHeader isSubmitted={false} />
                <p className="text-destructive text-sm">Could not load your prequalification record.</p>
            </div>
        );
    }

    const payslipUrl = publicStorageUrl(str(record?.payslip_url)) ?? null;
    const pagibigUrl = publicStorageUrl(str(record?.pagibig_url)) ?? null;

    return (
        <div className="space-y-6">
            <ScreenBackLink to="/dashboard" label="Dashboard" hideFrom="md" />
            <PageHeader isSubmitted={isSubmitted} />

            <form onSubmit={onSubmit} className="space-y-6">
                <Card className="border-border/80">
                    <CardHeader>
                        <CardTitle>Financial information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="employment_status">Employment status</Label>
                                <select
                                    id="employment_status"
                                    className="border-input bg-background focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1"
                                    {...register("employment_status", { required: true })}
                                >
                                    {(Object.entries(employmentLabels) as [EmploymentStatus, string][]).map(
                                        ([value, label]) => (
                                            <option key={value} value={value}>
                                                {label}
                                            </option>
                                        ),
                                    )}
                                </select>
                                {errors.employment_status && (
                                    <p className="text-destructive text-xs">Required.</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="monthly_income">Monthly income (PHP)</Label>
                                <Input
                                    id="monthly_income"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="e.g. 25000"
                                    {...register("monthly_income")}
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="company_name">
                                    {employment === "employed"
                                        ? "Employer / company name"
                                        : "Business name (optional)"}
                                </Label>
                                <Input
                                    id="company_name"
                                    placeholder={
                                        employment === "employed" ? "e.g. Acme Inc." : "Optional"
                                    }
                                    {...register("company_name")}
                                />
                            </div>

                            <div className="flex flex-col justify-end space-y-1.5">
                                <Label>Pag-IBIG membership</Label>
                                <label className="flex cursor-pointer items-center gap-2">
                                    <input
                                        type="checkbox"
                                        className="size-4 rounded"
                                        checked={isPagibig}
                                        onChange={(e) => setValue("is_pagibig_member", e.target.checked)}
                                    />
                                    <span className="text-sm">I am a Pag-IBIG member</span>
                                </label>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="notes">Additional notes (optional)</Label>
                            <Textarea
                                id="notes"
                                placeholder="Any other details you'd like your agent to know…"
                                rows={3}
                                {...register("notes")}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border/80">
                    <CardHeader>
                        <CardTitle>Supporting documents</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <p className="text-muted-foreground text-sm">
                            Upload clear photos or scanned PDFs (max 4 MB each). Accepted formats: JPG, PNG, PDF.
                        </p>

                        <DocumentField
                            id="payslip"
                            label="Payslip / Proof of income"
                            existingUrl={payslipUrl}
                            inputRef={payslipRef}
                            selectedFile={payslipSelected}
                            onFileChange={setPayslipSelected}
                            onPreview={setPreviewUrl}
                        />

                        <Separator />

                        <DocumentField
                            id="pagibig_doc"
                            label="Pag-IBIG membership document"
                            existingUrl={pagibigUrl}
                            inputRef={pagibigRef}
                            selectedFile={pagibigSelected}
                            onFileChange={setPagibigSelected}
                            onPreview={setPreviewUrl}
                        />

                        <Separator />

                        <DocumentField
                            id="valid_id"
                            label="Valid government ID"
                            existingUrl={null}
                            hasExistingFile={hasValidId}
                            inputRef={validIdRef}
                            selectedFile={validIdSelected}
                            onFileChange={setValidIdSelected}
                            onPreview={setPreviewUrl}
                            onViewExisting={() => setIsValidIdPreviewOpen(true)}
                            uploadDisabled={isIdentityVerified}
                        />

                        <div className="bg-muted/30 space-y-2 rounded-lg border p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-sm font-medium">Identity verification status</p>
                                <span
                                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${identityStatusStyles[identityStatus]}`}
                                >
                                    {identityStatusLabels[identityStatus]}
                                </span>
                            </div>
                            {identityStatus === "pending" ? (
                                <p className="text-muted-foreground text-sm">
                                    Your valid government ID is awaiting review by your assigned agent.
                                </p>
                            ) : identityStatus === "verified" ? (
                                <p className="text-muted-foreground text-sm">
                                    Your identity document has been verified. It cannot be replaced through this form.
                                </p>
                            ) : identityStatus === "rejected" ? (
                                <div className="space-y-1 text-sm">
                                    <p className="text-muted-foreground">
                                        Upload a replacement valid ID, then save and resubmit it for review.
                                    </p>
                                    {identityRejectionRemarks ? (
                                        <p className="whitespace-pre-wrap break-words">
                                            <span className="font-medium">Reviewer remarks: </span>
                                            {identityRejectionRemarks}
                                        </p>
                                    ) : null}
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-sm">
                                    Upload a valid government ID to submit it for review.
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {mutation.isError && (
                    <p className="text-destructive text-sm" role="alert">
                        {saveError ?? "Failed to save your record. Please check your inputs and try again."}
                    </p>
                )}

                {mutation.isSuccess && (
                    <p className="text-sm text-green-600 dark:text-green-400">
                        Your prequalification record has been saved.
                    </p>
                )}

                <div className="flex justify-end">
                    <Button type="submit" disabled={mutation.isPending}>
                        {mutation.isPending ? (
                            <>
                                <Spinner className="mr-2 size-4" />
                                Saving…
                            </>
                        ) : (
                            <>
                                <UploadCloudIcon className="mr-2 size-4" />
                                Save &amp; submit
                            </>
                        )}
                    </Button>
                </div>
            </form>

            <DocumentPreviewModal url={previewUrl} onClose={() => setPreviewUrl(null)} />
            {isValidIdPreviewOpen ? (
                <ProtectedDocumentPreviewDialog
                    open
                    onOpenChange={setIsValidIdPreviewOpen}
                    fetchDocument={clientPortalApi.getOwnValidId}
                    title="Valid government ID"
                />
            ) : null}
        </div>
    );
};

function PageHeader({ isSubmitted }: { isSubmitted: boolean }) {
    return (
        <div className="flex items-start justify-between gap-4">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">My documents</h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    Submit your financial information and supporting documents before making a reservation.
                </p>
            </div>
            {isSubmitted && (
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300">
                    <CheckCircle2Icon className="size-4" />
                    Submitted
                </span>
            )}
        </div>
    );
}

function DocumentField({
    id,
    label,
    existingUrl,
    inputRef,
    selectedFile,
    onFileChange,
    onPreview,
    hasExistingFile = false,
    onViewExisting,
    uploadDisabled = false,
}: {
    id: string;
    label: string;
    existingUrl: string | null;
    inputRef: React.RefObject<HTMLInputElement | null>;
    selectedFile: File | null;
    onFileChange: (file: File | null) => void;
    onPreview: (url: string) => void;
    hasExistingFile?: boolean;
    onViewExisting?: () => void;
    uploadDisabled?: boolean;
}) {
    const hasExisting = !!existingUrl || hasExistingFile;
    const hasAnything = !!selectedFile || hasExisting;

    return (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
                <div
                    className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${hasAnything ? "bg-green-100 dark:bg-green-900/30" : "bg-muted"
                        }`}
                >
                    <FileTextIcon
                        className={`size-4 ${hasAnything
                                ? "text-green-700 dark:text-green-400"
                                : "text-muted-foreground"
                            }`}
                    />
                </div>
                <div>
                    <p className="text-sm font-medium">{label}</p>

                    {selectedFile ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-700 dark:text-green-400">
                            <PaperclipIcon className="size-3" />
                            {selectedFile.name}
                            <span className="text-muted-foreground ml-1">— ready to save</span>
                        </span>
                    ) : hasExisting ? (
                        <button
                            type="button"
                            onClick={() => {
                                if (onViewExisting) onViewExisting();
                                else if (existingUrl) onPreview(existingUrl);
                            }}
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400"
                        >
                            <ZoomInIcon className="size-3" />
                            View uploaded file
                        </button>
                    ) : (
                        <p className="text-muted-foreground text-xs">No file uploaded yet</p>
                    )}
                </div>
            </div>

            {uploadDisabled ? (
                <span className="text-muted-foreground text-xs">Replacement unavailable</span>
            ) : (
                <label
                    htmlFor={id}
                    className="border-input hover:bg-accent inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm"
                >
                    <UploadCloudIcon className="size-4" />
                    {selectedFile ? "Change" : hasExisting ? "Replace" : "Upload"}
                    <input
                        id={id}
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        className="sr-only"
                        ref={inputRef}
                        onChange={(e) => {
                            const file = e.target.files?.[0] ?? null;
                            onFileChange(file);
                        }}
                    />
                </label>
            )}
        </div>
    );
}

function DocumentPreviewModal({
    url,
    onClose,
}: {
    url: string | null;
    onClose: () => void;
}) {
    const isPdf = url?.toLowerCase().includes(".pdf");

    return (
        <Dialog open={!!url} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent
                className="flex flex-col gap-0 overflow-hidden p-0"
                style={{ maxWidth: "min(92vw, 1100px)", height: "90vh" }}
            >
                <DialogHeader className="shrink-0 border-b px-4 py-3">
                    <DialogTitle className="text-sm font-medium">Document preview</DialogTitle>
                </DialogHeader>

                <div className="bg-muted flex flex-1 overflow-hidden">
                    {url && (
                        isPdf ? (
                            <iframe
                                src={url}
                                title="Document preview"
                                className="h-full w-full border-0"
                            />
                        ) : (
                            <div className="flex flex-1 items-center justify-center overflow-auto p-4">
                                <img
                                    src={url}
                                    alt="Document preview"
                                    className="max-h-full w-auto object-contain"
                                />
                            </div>
                        )
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default ClientPrequalificationPage;
