import { adminResourceApi } from "@/db/api/admin.api";
import { asRecord, idStr, str } from "@/lib/record";
import { publicStorageUrl } from "@/lib/storage-url";
import { getApiErrorMessage } from "@/lib/api-error";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useParams } from "@tanstack/react-router";
import { ScreenBackLink } from "@/components/navigation/ScreenBackLink";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
    CalendarDaysIcon,
    CheckCircle2Icon,
    ClockIcon,
    ExternalLinkIcon,
    ImagePlusIcon,
    StarIcon,
    UserRoundIcon,
    XCircleIcon,
} from "lucide-react";

type DocField =
    | "nbi_clearance"
    | "police_clearance"
    | "tin_number"
    | "resume"
    | "cv"
    | "birth_certificate";

type DocStatus = "pending" | "approved" | "rejected";

const DOC_DEFS: { field: DocField; label: string }[] = [
    { field: "nbi_clearance", label: "NBI clearance" },
    { field: "police_clearance", label: "Police clearance" },
    { field: "tin_number", label: "TIN number document" },
    { field: "resume", label: "Resume" },
    { field: "cv", label: "CV" },
    { field: "birth_certificate", label: "Birth certificate" },
];

type AgentFormValues = {
    first_name: string;
    last_name: string;
    age: string;
    email: string;
    mobile: string;
    location: string;
    position: string;
    description: string;
    employment_type: string;
    monthly_allowance: string;
    monthly_quota: string;
};

const EMPTY_AGENT_FORM: AgentFormValues = {
    first_name: "",
    last_name: "",
    age: "",
    email: "",
    mobile: "",
    location: "",
    position: "",
    description: "",
    employment_type: "",
    monthly_allowance: "",
    monthly_quota: "",
};

const currentDate = new Date();
const DEFAULT_TO_DATE = [
    currentDate.getFullYear(),
    String(currentDate.getMonth() + 1).padStart(2, "0"),
    String(currentDate.getDate()).padStart(2, "0"),
].join("-");
const DEFAULT_FROM_DATE = `${DEFAULT_TO_DATE.slice(0, 7)}-01`;

const inputValue = (value: unknown): string => value == null ? "" : String(value);

const formFromAgent = (agent: Record<string, unknown>): AgentFormValues => ({
    first_name: inputValue(agent.first_name),
    last_name: inputValue(agent.last_name),
    age: inputValue(agent.age),
    email: inputValue(agent.email),
    mobile: inputValue(agent.mobile),
    location: inputValue(agent.location),
    position: inputValue(agent.position),
    description: inputValue(agent.description),
    employment_type: inputValue(agent.employment_type),
    monthly_allowance: inputValue(agent.monthly_allowance),
    monthly_quota: inputValue(agent.monthly_quota),
});

const numericValue = (value: unknown): number | null => {
    if (value == null || value === "") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const formatDate = (value: unknown, withTime = false): string => {
    const raw = inputValue(value);
    if (!raw) return "—";
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return raw.slice(0, 10) || "—";
    return withTime
        ? date.toLocaleString("en-PH", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
        })
        : date.toLocaleDateString("en-PH", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
        });
};

const formatTime = (value: unknown): string => {
    const raw = inputValue(value);
    if (!raw) return "—";
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleTimeString("en-PH", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });
};

const formatDuration = (value: unknown): string => {
    const minutes = numericValue(value);
    if (minutes == null) return "—";
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    return hours > 0 ? `${hours}h ${remainder}m` : `${remainder}m`;
};

const statusBadge = (status: DocStatus | null, hasFile: boolean) => {
    if (!hasFile) return (
        <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            <ClockIcon className="size-3" />
            Not uploaded
        </span>
    );
    if (status === "approved") return (
        <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
            <CheckCircle2Icon className="size-3" />
            Approved
        </span>
    );
    if (status === "rejected") return (
        <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-300">
            <XCircleIcon className="size-3" />
            Rejected
        </span>
    );
    return (
        <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
            <ClockIcon className="size-3" />
            Pending review
        </span>
    );
};

const InfoRow = ({ label, value }: { label: string; value?: string | null }) => (
    <div className="space-y-0.5">
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium">{value || <span className="text-muted-foreground font-normal">—</span>}</p>
    </div>
);

const AgentDetailSkeleton = () => (
    <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
            <div className="space-y-4">
                <Card className="border-border/80">
                    <CardContent className="flex flex-col items-center gap-4 pt-8 pb-6">
                        <Skeleton className="size-24 rounded-full" />
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-24" />
                    </CardContent>
                </Card>
            </div>
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <Card key={i} className="border-border/80">
                        <CardHeader><Skeleton className="h-5 w-28" /></CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            {Array.from({ length: 4 }).map((_, j) => (
                                <div key={j} className="space-y-1">
                                    <Skeleton className="h-3 w-16" />
                                    <Skeleton className="h-4 w-32" />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    </div>
);

const DocumentCard = ({
    agentId,
    field,
    label,
    url,
    status,
    rejectionReason,
}: {
    agentId: string;
    field: DocField;
    label: string;
    url: string | null;
    status: DocStatus | null;
    rejectionReason: string | null;
}) => {
    const queryClient = useQueryClient();
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [reason, setReason] = useState("");

    const approveMut = useMutation({
        mutationFn: () => adminResourceApi.approveAgentDocument(agentId, field),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "agent-requirements", agentId] });
            toast.success(`${label} approved.`);
        },
        onError: (e) => toast.error(getApiErrorMessage(e)),
    });

    const rejectMut = useMutation({
        mutationFn: () => adminResourceApi.rejectAgentDocument(agentId, field, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "agent-requirements", agentId] });
            toast.success(`${label} rejected.`);
            setShowRejectForm(false);
            setReason("");
        },
        onError: (e) => toast.error(getApiErrorMessage(e)),
    });

    const publicUrl = url ? publicStorageUrl(url) : null;

    return (
        <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
            {/* Header row */}
            <div className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{label}</span>
                </div>
                {statusBadge(status, !!url)}
            </div>

            {/* File + actions */}
            <div className="border-t border-border/40 px-4 py-3 space-y-3">
                {publicUrl ? (
                    <a
                        href={publicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline dark:text-blue-400"
                    >
                        <ExternalLinkIcon className="size-3.5" />
                        View uploaded file
                    </a>
                ) : (
                    <p className="text-muted-foreground text-xs">No file uploaded yet.</p>
                )}

                {/* Rejection reason display */}
                {status === "rejected" && rejectionReason && (
                    <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 dark:bg-red-950/30 dark:border-red-800">
                        <p className="text-xs font-medium text-red-700 dark:text-red-400">Rejection reason</p>
                        <p className="text-xs text-red-600 dark:text-red-300 mt-0.5 leading-relaxed">{rejectionReason}</p>
                    </div>
                )}

                {/* Approve / Reject buttons — only when a file exists */}
                {url && status !== "approved" && !showRejectForm && (
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400"
                            disabled={approveMut.isPending}
                            onClick={() => approveMut.mutate()}
                        >
                            <CheckCircle2Icon className="size-3.5" />
                            {approveMut.isPending ? "Approving…" : "Approve"}
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400"
                            onClick={() => setShowRejectForm(true)}
                        >
                            <XCircleIcon className="size-3.5" />
                            Reject
                        </Button>
                    </div>
                )}

                {/* Re-review approved docs */}
                {url && status === "approved" && !showRejectForm && (
                    <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1.5 text-xs text-muted-foreground h-7 px-2"
                        onClick={() => setShowRejectForm(true)}
                    >
                        <XCircleIcon className="size-3" />
                        Revoke approval
                    </Button>
                )}

                {/* Reject form */}
                {showRejectForm && (
                    <div className="space-y-2">
                        <Textarea
                            rows={2}
                            placeholder="Reason for rejection…"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="text-sm"
                        />
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="destructive"
                                disabled={!reason.trim() || rejectMut.isPending}
                                onClick={() => rejectMut.mutate()}
                            >
                                {rejectMut.isPending ? "Rejecting…" : "Confirm rejection"}
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => { setShowRejectForm(false); setReason(""); }}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const AdminAgentUpdatePage = () => {
    const { agentId } = useParams({ strict: false }) as { agentId: string };
    const queryClient = useQueryClient();
    const pictureInputRef = useRef<HTMLInputElement>(null);

    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState<AgentFormValues>(EMPTY_AGENT_FORM);
    const [pictureFile, setPictureFile] = useState<File | null>(null);
    const [picturePreview, setPicturePreview] = useState<string | null>(null);
    const [timesheetFrom, setTimesheetFrom] = useState(DEFAULT_FROM_DATE);
    const [timesheetTo, setTimesheetTo] = useState(DEFAULT_TO_DATE);
    const [appliedTimesheetRange, setAppliedTimesheetRange] = useState({
        from: DEFAULT_FROM_DATE,
        to: DEFAULT_TO_DATE,
    });
    const [timesheetDateError, setTimesheetDateError] = useState("");

    const agentsQ = useQuery({
        queryKey: ["admin", "agents"],
        queryFn: () => adminResourceApi.agents(),
        refetchInterval: 2_000,
    });

    const requirementsQ = useQuery({
        queryKey: ["admin", "agent-requirements", agentId],
        queryFn: () => adminResourceApi.agentRequirements(agentId),
        enabled: !!agentId,
        refetchInterval: 2_000,
    });

    const ratingsQ = useQuery({
        queryKey: ["admin", "agent-ratings", agentId],
        queryFn: () => adminResourceApi.getAgentRatings(agentId),
        enabled: !!agentId,
        refetchInterval: 2_000,
    });

    const timesheetsQ = useQuery({
        queryKey: [
            "admin",
            "agent-timesheets",
            agentId,
            appliedTimesheetRange.from,
            appliedTimesheetRange.to,
        ],
        queryFn: () => adminResourceApi.agentTimesheets(
            agentId,
            appliedTimesheetRange.from,
            appliedTimesheetRange.to,
        ),
        refetchInterval: 2_000,
        enabled: !!agentId,
    });

    const row = (agentsQ.data?.data as unknown[] | undefined)?.find(
        (r) => idStr(asRecord(r).id) === agentId,
    );
    const a = asRecord(row);
    const req = asRecord(requirementsQ.data?.data);

    const updateAgentMut = useMutation({
        mutationFn: (body: Record<string, unknown>) => adminResourceApi.updateAgent(agentId, body),
        onSuccess: async (response) => {
            await queryClient.invalidateQueries({ queryKey: ["admin", "agents"] });
            setIsEditing(false);
            toast.success(response.message || "Agent profile updated.");
        },
        onError: (error) => toast.error(getApiErrorMessage(error)),
    });

    const updatePictureMut = useMutation({
        mutationFn: (file: File) => adminResourceApi.updateAgentPicture(agentId, file),
        onSuccess: async (response) => {
            await queryClient.invalidateQueries({ queryKey: ["admin", "agents"] });
            setPictureFile(null);
            setPicturePreview(null);
            if (pictureInputRef.current) pictureInputRef.current.value = "";
            toast.success(response.message || "Profile picture updated.");
        },
        onError: (error) => toast.error(getApiErrorMessage(error)),
    });

    if (agentsQ.isPending) return <AgentDetailSkeleton />;
    if (!row) return <p className="text-destructive">Agent not found.</p>;

    const photoSrc = publicStorageUrl(str(a.profile_picture));
    const fullName = `${str(a.first_name) ?? ""} ${str(a.last_name) ?? ""}`.trim() || "—";
    const initials = `${str(a.first_name)?.charAt(0) ?? ""}${str(a.last_name)?.charAt(0) ?? ""}`.toUpperCase();

    const employmentType = str(a.employment_type);
    const employmentLabel = employmentType === "part_time"
        ? "Part-time"
        : employmentType === "full_time"
            ? "Full-time"
            : "Not specified";

    const approvedCount = DOC_DEFS.filter(
        ({ field }) => str(req[`${field}_status`]) === "approved",
    ).length;

    const ratingsData = asRecord(ratingsQ.data?.data);
    const ratings = Array.isArray(ratingsData.ratings)
        ? ratingsData.ratings.map((rating) => asRecord(rating))
        : [];
    const ratingDistribution = asRecord(ratingsData.distribution);
    const ratingCount = numericValue(ratingsData.count) ?? ratings.length;
    const averageRating = numericValue(ratingsData.average);
    const timesheetRecords = Array.isArray(timesheetsQ.data?.data)
        ? timesheetsQ.data.data.map((record) => asRecord(record))
        : [];

    const setFormField = (field: keyof AgentFormValues, value: string) => {
        setForm((current) => ({ ...current, [field]: value }));
    };

    const beginEditing = () => {
        setForm(formFromAgent(a));
        setIsEditing(true);
    };

    const cancelEditing = () => {
        setForm(formFromAgent(a));
        setIsEditing(false);
    };

    const saveProfile = () => {
        const firstName = form.first_name.trim();
        const lastName = form.last_name.trim();
        const email = form.email.trim();
        const age = Number(form.age);
        const allowanceText = form.monthly_allowance.trim();
        const quotaText = form.monthly_quota.trim();
        const allowance = allowanceText ? Number(allowanceText) : null;
        const quota = quotaText ? Number(quotaText) : null;

        if (!firstName || !lastName || !email || !form.age.trim()) {
            toast.error("First name, last name, age, and email are required.");
            return;
        }
        if (!Number.isFinite(age)) {
            toast.error("Age must be a valid number.");
            return;
        }
        if (allowanceText && !Number.isFinite(allowance)) {
            toast.error("Monthly allowance must be a valid number.");
            return;
        }
        if (quotaText && !Number.isFinite(quota)) {
            toast.error("Monthly quota must be a valid number.");
            return;
        }

        updateAgentMut.mutate({
            first_name: firstName,
            last_name: lastName,
            age,
            email,
            mobile: form.mobile.trim() || null,
            location: form.location.trim() || null,
            position: form.position.trim() || null,
            description: form.description.trim() || null,
            employment_type: form.employment_type || null,
            monthly_allowance: allowance,
            monthly_quota: quota,
        });
    };

    const selectPicture = (file: File | null) => {
        if (!file) {
            setPictureFile(null);
            setPicturePreview(null);
            return;
        }
        if (!file.type.startsWith("image/")) {
            setPictureFile(null);
            setPicturePreview(null);
            toast.error("Choose a valid image file.");
            if (pictureInputRef.current) pictureInputRef.current.value = "";
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            setPictureFile(null);
            setPicturePreview(null);
            toast.error("Profile picture must not exceed 2 MB.");
            if (pictureInputRef.current) pictureInputRef.current.value = "";
            return;
        }

        setPictureFile(file);
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === "string") setPicturePreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const applyTimesheetRange = () => {
        if (!timesheetFrom || !timesheetTo) {
            setTimesheetDateError("Choose both From and To dates.");
            return;
        }
        if (timesheetFrom > timesheetTo) {
            setTimesheetDateError("From date cannot be after To date.");
            return;
        }
        setTimesheetDateError("");
        setAppliedTimesheetRange({ from: timesheetFrom, to: timesheetTo });
    };

    const resetTimesheetRange = () => {
        setTimesheetFrom(DEFAULT_FROM_DATE);
        setTimesheetTo(DEFAULT_TO_DATE);
        setAppliedTimesheetRange({ from: DEFAULT_FROM_DATE, to: DEFAULT_TO_DATE });
        setTimesheetDateError("");
    };

    return (
        <div className="space-y-6">
            <ScreenBackLink to="/admin/agents" label="Agents" hideFrom="md" />

            <div className="grid gap-6 lg:grid-cols-[260px_1fr]">

                {/* Left: avatar + IDs */}
                <div className="flex flex-col gap-4 lg:self-start">
                    <Card className="border-border/80">
                        <CardContent className="flex flex-col items-center gap-3 pb-6 pt-8">
                            <div className="border-border bg-muted relative size-24 overflow-hidden rounded-full border-2">
                                {picturePreview || photoSrc ? (
                                    <img
                                        src={picturePreview || photoSrc || undefined}
                                        alt={fullName}
                                        className="size-full object-cover"
                                    />
                                ) : (
                                    <div className="flex size-full items-center justify-center">
                                        {initials ? (
                                            <span className="text-2xl font-semibold text-foreground/60">{initials}</span>
                                        ) : (
                                            <UserRoundIcon className="text-muted-foreground size-10" strokeWidth={1.2} />
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="text-center">
                                <p className="font-semibold">{fullName}</p>
                                <p className="text-muted-foreground text-sm">{str(a.position) ?? "Agent"}</p>
                            </div>
                            <span className={`rounded-full px-3 py-0.5 text-xs font-medium ${employmentType === "part_time"
                                    ? "bg-amber-100 text-amber-800"
                                    : employmentType === "full_time"
                                        ? "bg-blue-100 text-blue-800"
                                        : "bg-muted text-muted-foreground"
                                }`}>
                                {employmentLabel}
                            </span>
                            <Separator className="my-1" />
                            <div className="w-full space-y-2">
                                <Label htmlFor="agent-profile-picture" className="text-xs">
                                    Replace profile picture
                                </Label>
                                <Input
                                    ref={pictureInputRef}
                                    id="agent-profile-picture"
                                    type="file"
                                    accept="image/*"
                                    className="h-auto cursor-pointer py-1.5 text-xs"
                                    disabled={updatePictureMut.isPending}
                                    onChange={(event) => selectPicture(event.target.files?.[0] ?? null)}
                                />
                                <p className="text-muted-foreground text-xs">
                                    Image files only, up to 2 MB.
                                </p>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="w-full gap-1.5"
                                    disabled={!pictureFile || updatePictureMut.isPending}
                                    onClick={() => {
                                        if (pictureFile) updatePictureMut.mutate(pictureFile);
                                    }}
                                >
                                    <ImagePlusIcon className="size-3.5" />
                                    {updatePictureMut.isPending ? "Uploading…" : "Upload picture"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/80">
                        <CardContent className="space-y-3 pt-5 text-sm">
                            <InfoRow label="Internal ID" value={str(a.id)} />
                            <Separator />
                            <InfoRow label="Employee ID" value={str(a.employee_id)} />
                        </CardContent>
                    </Card>
                </div>

                {/* Right: info + documents */}
                <div className="space-y-4">

                    <Card className="border-border/80">
                        <CardHeader className="pb-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <CardTitle className="text-base">Personal information</CardTitle>
                                {isEditing ? (
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            disabled={updateAgentMut.isPending}
                                            onClick={cancelEditing}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            disabled={updateAgentMut.isPending}
                                            onClick={saveProfile}
                                        >
                                            {updateAgentMut.isPending ? "Saving…" : "Save changes"}
                                        </Button>
                                    </div>
                                ) : (
                                    <Button type="button" variant="outline" size="sm" onClick={beginEditing}>
                                        Edit profile
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        {isEditing ? (
                            <CardContent className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label htmlFor="agent-first-name">First name</Label>
                                    <Input
                                        id="agent-first-name"
                                        value={form.first_name}
                                        onChange={(event) => setFormField("first_name", event.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="agent-last-name">Last name</Label>
                                    <Input
                                        id="agent-last-name"
                                        value={form.last_name}
                                        onChange={(event) => setFormField("last_name", event.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="agent-age">Age</Label>
                                    <Input
                                        id="agent-age"
                                        type="number"
                                        value={form.age}
                                        onChange={(event) => setFormField("age", event.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="agent-email">Email</Label>
                                    <Input
                                        id="agent-email"
                                        type="email"
                                        value={form.email}
                                        onChange={(event) => setFormField("email", event.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="agent-mobile">Mobile</Label>
                                    <Input
                                        id="agent-mobile"
                                        value={form.mobile}
                                        onChange={(event) => setFormField("mobile", event.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="agent-location">Location</Label>
                                    <Input
                                        id="agent-location"
                                        value={form.location}
                                        onChange={(event) => setFormField("location", event.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5 sm:col-span-2">
                                    <Label htmlFor="agent-description">Description</Label>
                                    <Textarea
                                        id="agent-description"
                                        rows={3}
                                        value={form.description}
                                        onChange={(event) => setFormField("description", event.target.value)}
                                    />
                                </div>
                            </CardContent>
                        ) : (
                            <CardContent className="grid gap-5 sm:grid-cols-2">
                                <InfoRow label="First name" value={str(a.first_name)} />
                                <InfoRow label="Last name" value={str(a.last_name)} />
                                <InfoRow label="Age" value={a.age != null ? String(a.age) : null} />
                                <InfoRow label="Email" value={str(a.email)} />
                                <InfoRow label="Mobile" value={str(a.mobile)} />
                                <InfoRow label="Location" value={str(a.location)} />
                                <div className="space-y-0.5 sm:col-span-2">
                                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                                        Description
                                    </p>
                                    <p className="text-sm leading-relaxed">
                                        {str(a.description) || <span className="text-muted-foreground">—</span>}
                                    </p>
                                </div>
                            </CardContent>
                        )}
                    </Card>

                    <Card className="border-border/80">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">HR details</CardTitle>
                        </CardHeader>
                        {isEditing ? (
                            <CardContent className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label htmlFor="agent-position">Position</Label>
                                    <Input
                                        id="agent-position"
                                        value={form.position}
                                        onChange={(event) => setFormField("position", event.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="agent-employment-type">Employment type</Label>
                                    <select
                                        id="agent-employment-type"
                                        value={form.employment_type}
                                        onChange={(event) => setFormField("employment_type", event.target.value)}
                                        className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                    >
                                        <option value="">Not specified</option>
                                        <option value="full_time">Full-time</option>
                                        <option value="part_time">Part-time</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="agent-monthly-allowance">Monthly allowance (CAA)</Label>
                                    <Input
                                        id="agent-monthly-allowance"
                                        type="number"
                                        step="0.01"
                                        value={form.monthly_allowance}
                                        onChange={(event) => setFormField("monthly_allowance", event.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="agent-monthly-quota">Monthly quota</Label>
                                    <Input
                                        id="agent-monthly-quota"
                                        type="number"
                                        step="1"
                                        value={form.monthly_quota}
                                        onChange={(event) => setFormField("monthly_quota", event.target.value)}
                                    />
                                </div>
                            </CardContent>
                        ) : (
                            <CardContent className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                                <InfoRow label="Position" value={str(a.position)} />
                                <InfoRow label="Employment type" value={employmentLabel} />
                                <InfoRow
                                    label="Monthly allowance (CAA)"
                                    value={a.monthly_allowance != null
                                        ? `₱${Number(a.monthly_allowance).toLocaleString()}`
                                        : null}
                                />
                                <InfoRow
                                    label="Monthly quota"
                                    value={a.monthly_quota != null ? `${a.monthly_quota} units` : null}
                                />
                            </CardContent>
                        )}
                    </Card>

                    {/* Document review */}
                    <Card className="border-border/80">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between gap-2">
                                <CardTitle className="text-base">Document requirements</CardTitle>
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${approvedCount === DOC_DEFS.length
                                        ? "bg-emerald-100 text-emerald-700"
                                        : "bg-muted text-muted-foreground"
                                    }`}>
                                    {approvedCount} / {DOC_DEFS.length} approved
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {requirementsQ.isPending ? (
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <Skeleton key={i} className="h-24 w-full rounded-xl" />
                                    ))}
                                </div>
                            ) : (
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {DOC_DEFS.map(({ field, label }) => (
                                        <DocumentCard
                                            key={field}
                                            agentId={agentId}
                                            field={field}
                                            label={label}
                                            url={str(req[`${field}_url`]) ?? null}
                                            status={(str(req[`${field}_status`]) as DocStatus) ?? null}
                                            rejectionReason={str(req[`${field}_rejection_reason`]) ?? null}
                                        />
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Ratings */}
                    <Card className="border-border/80">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <StarIcon className="size-4 text-amber-500" />
                                Agent ratings
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {ratingsQ.isPending ? (
                                <div className="space-y-3">
                                    <Skeleton className="h-16 w-full" />
                                    <Skeleton className="h-28 w-full" />
                                </div>
                            ) : ratingsQ.isError ? (
                                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                                    <p className="text-destructive text-sm">Could not load agent ratings.</p>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="mt-3"
                                        onClick={() => void ratingsQ.refetch()}
                                    >
                                        Try again
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
                                        <div className="flex flex-col items-center justify-center rounded-xl bg-amber-50 p-4 text-center dark:bg-amber-950/20">
                                            <p className="text-3xl font-bold">
                                                {averageRating == null ? "—" : averageRating.toFixed(1)}
                                            </p>
                                            <div className="mt-1 flex items-center gap-1 text-amber-500">
                                                <StarIcon className="size-4 fill-current" />
                                                <span className="text-sm font-medium">Average rating</span>
                                            </div>
                                            <p className="text-muted-foreground mt-1 text-xs">
                                                {ratingCount} {ratingCount === 1 ? "rating" : "ratings"}
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            {[5, 4, 3, 2, 1].map((score) => {
                                                const count = numericValue(ratingDistribution[String(score)]) ?? 0;
                                                const percentage = ratingCount > 0
                                                    ? Math.min(100, Math.max(0, (count / ratingCount) * 100))
                                                    : 0;
                                                return (
                                                    <div key={score} className="grid grid-cols-[32px_1fr_32px] items-center gap-2">
                                                        <span className="text-muted-foreground text-xs">{score} star</span>
                                                        <div className="bg-muted h-2 overflow-hidden rounded-full">
                                                            <div
                                                                className="h-full rounded-full bg-amber-400"
                                                                style={{ width: `${percentage}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-right text-xs font-medium">{count}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <Separator />

                                    <div>
                                        <h3 className="mb-3 text-sm font-semibold">Rating history</h3>
                                        {ratings.length === 0 ? (
                                            <div className="rounded-xl border border-dashed py-8 text-center">
                                                <StarIcon className="text-muted-foreground mx-auto size-6" />
                                                <p className="mt-2 text-sm font-medium">No ratings yet</p>
                                                <p className="text-muted-foreground mt-1 text-xs">
                                                    Client ratings will appear here when available.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="divide-y rounded-xl border">
                                                {ratings.map((rating, index) => {
                                                    const client = asRecord(rating.client);
                                                    const clientName = `${str(client.first_name) ?? ""} ${str(client.last_name) ?? ""}`.trim();
                                                    const score = numericValue(rating.rating);
                                                    return (
                                                        <div
                                                            key={idStr(rating.id) || String(index)}
                                                            className="space-y-2 p-4"
                                                        >
                                                            <div className="flex flex-wrap items-start justify-between gap-2">
                                                                <div>
                                                                    <p className="text-sm font-medium">
                                                                        {clientName || "Client unavailable"}
                                                                    </p>
                                                                    <p className="text-muted-foreground text-xs">
                                                                        {formatDate(rating.created_at, true)}
                                                                    </p>
                                                                </div>
                                                                <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                                                                    <StarIcon className="size-3 fill-current" />
                                                                    {score == null ? "—" : score}
                                                                </span>
                                                            </div>
                                                            {str(rating.comment) ? (
                                                                <p className="text-muted-foreground text-sm leading-relaxed">
                                                                    {str(rating.comment)}
                                                                </p>
                                                            ) : (
                                                                <p className="text-muted-foreground text-xs italic">
                                                                    No written comment.
                                                                </p>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Timesheet history */}
                    <Card className="overflow-hidden border-border/80">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <CalendarDaysIcon className="text-primary size-4" />
                                Timesheet history
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-3 rounded-xl border bg-muted/20 p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]">
                                <div className="space-y-1.5">
                                    <Label htmlFor="agent-timesheet-from">From</Label>
                                    <Input
                                        id="agent-timesheet-from"
                                        type="date"
                                        value={timesheetFrom}
                                        max={timesheetTo || DEFAULT_TO_DATE}
                                        onChange={(event) => {
                                            setTimesheetFrom(event.target.value);
                                            setTimesheetDateError("");
                                        }}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="agent-timesheet-to">To</Label>
                                    <Input
                                        id="agent-timesheet-to"
                                        type="date"
                                        value={timesheetTo}
                                        min={timesheetFrom || undefined}
                                        max={DEFAULT_TO_DATE}
                                        onChange={(event) => {
                                            setTimesheetTo(event.target.value);
                                            setTimesheetDateError("");
                                        }}
                                    />
                                </div>
                                <div className="flex flex-wrap items-end gap-2">
                                    <Button
                                        type="button"
                                        size="sm"
                                        disabled={timesheetsQ.isFetching}
                                        onClick={applyTimesheetRange}
                                    >
                                        {timesheetsQ.isFetching ? "Loading…" : "Apply"}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        disabled={timesheetsQ.isFetching}
                                        onClick={resetTimesheetRange}
                                    >
                                        Current month
                                    </Button>
                                </div>
                                {timesheetDateError && (
                                    <p className="text-destructive text-xs sm:col-span-2 lg:col-span-3">
                                        {timesheetDateError}
                                    </p>
                                )}
                            </div>

                            {timesheetsQ.isPending ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map((item) => (
                                        <Skeleton key={item} className="h-11 w-full" />
                                    ))}
                                </div>
                            ) : timesheetsQ.isError ? (
                                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                                    <p className="text-destructive text-sm">Could not load timesheet records.</p>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="mt-3"
                                        onClick={() => void timesheetsQ.refetch()}
                                    >
                                        Try again
                                    </Button>
                                </div>
                            ) : timesheetRecords.length === 0 ? (
                                <div className="rounded-xl border border-dashed py-10 text-center">
                                    <ClockIcon className="text-muted-foreground mx-auto size-7" />
                                    <p className="mt-2 text-sm font-medium">No timesheet records found</p>
                                    <p className="text-muted-foreground mt-1 text-xs">
                                        Adjust the date range to view other attendance records.
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto rounded-xl border">
                                    <table className="w-full min-w-[650px] text-sm">
                                        <thead>
                                            <tr className="border-border/60 border-b bg-muted/40">
                                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Time In</th>
                                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Time Out</th>
                                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Duration</th>
                                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {timesheetRecords.map((record, index) => {
                                                const timeIn = inputValue(record.time_in);
                                                const timeOut = inputValue(record.time_out);
                                                return (
                                                    <tr
                                                        key={idStr(record.id) || String(index)}
                                                        className="border-border/60 border-b last:border-0"
                                                    >
                                                        <td className="whitespace-nowrap px-4 py-3">
                                                            {formatDate(record.date)}
                                                        </td>
                                                        <td className="px-4 py-3 font-medium text-emerald-700">
                                                            {formatTime(timeIn)}
                                                        </td>
                                                        <td className="px-4 py-3 font-medium text-red-700">
                                                            {formatTime(timeOut)}
                                                        </td>
                                                        <td className="px-4 py-3 text-muted-foreground">
                                                            {formatDuration(record.duration_minutes)}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {timeOut ? (
                                                                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                                                                    Completed
                                                                </span>
                                                            ) : timeIn ? (
                                                                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                                                                    Active
                                                                </span>
                                                            ) : (
                                                                <span className="text-muted-foreground">—</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                </div>
            </div>
        </div>
    );
};

export default AdminAgentUpdatePage;
