import { agentPortalApi } from "@/db/api/agent.portal.api";
import { asRecord, str } from "@/lib/record";
import { publicStorageUrl } from "@/lib/storage-url";
import { getApiErrorMessage } from "@/lib/api-error";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useParams } from "@tanstack/react-router";
import { ScreenBackLink } from "@/components/navigation/ScreenBackLink";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useEffect, useRef, useState } from "react";
import {
    Building2Icon,
    CalendarIcon,
    FileTextIcon,
    ImagePlusIcon,
    MapPinIcon,
    PaperclipIcon,
    PrinterIcon,
    ShieldCheckIcon,
    UploadCloudIcon,
    UserIcon,
    ZoomInIcon,
} from "lucide-react";

type ApptStatus = "pending" | "confirmed" | "completed" | "cancelled";

const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    confirmed: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-muted text-muted-foreground",
};

const MAX_TIMER_DELAY = 2_147_483_647;

const parseManilaSchedule = (value: unknown) => {
    const schedule = str(value)?.trim();
    const match = schedule?.match(
        /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/,
    );

    if (!match) return null;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const hour = Number(match[4]);
    const minute = Number(match[5]);
    const second = Number(match[6] ?? "00");
    const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const daysInMonth = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    if (
        year < 1000 ||
        month < 1 ||
        month > 12 ||
        day < 1 ||
        day > daysInMonth[month - 1] ||
        hour > 23 ||
        minute > 59 ||
        second > 59
    ) {
        return null;
    }

    const parsed = new Date(
        `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6] ?? "00"}+08:00`,
    );
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const AppointmentDetailSkeleton = () => (
    <div className="space-y-6">
        <Skeleton className="h-9 w-36 rounded-md" />
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="border-border/80 space-y-5 rounded-xl border p-6 shadow-sm">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-7 w-36" />
                    <Skeleton className="h-6 w-20 rounded-md" />
                </div>
                <Skeleton className="h-px w-full" />
                {Array.from({ length: 3 }).map((_, i) => (
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
                        <Skeleton className="h-8 w-24 rounded-md" />
                        <Skeleton className="h-8 w-24 rounded-md" />
                    </div>
                </div>
                <div className="border-border/80 rounded-xl border p-6 shadow-sm">
                    <Skeleton className="mb-3 h-6 w-16" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                </div>
            </div>
        </div>
    </div>
);

const AgentAppointmentDetail = () => {
    const { appointmentId } = useParams({ strict: false }) as { appointmentId: string };
    const queryClient = useQueryClient();
    const slipImageInputRef = useRef<HTMLInputElement | null>(null);
    const [slipImageSelected, setSlipImageSelected] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [showCasPrint, setShowCasPrint] = useState(false);
    const [reachedScheduleTime, setReachedScheduleTime] = useState<number | null>(null);

    const printCas = () => {
        const win = window.open("", "_blank", "width=800,height=900");
        if (!win) return;
        const clientName = `${str(client.first_name) ?? ""} ${str(client.last_name) ?? ""}`.trim();
        const agentName = `${str(asRecord(a.agent).first_name) ?? ""} ${str(asRecord(a.agent).last_name) ?? ""}`.trim();
        const fmtDate = (v: unknown) => {
            if (!v) return "—";
            return new Date(String(v)).toLocaleDateString(undefined, { dateStyle: "medium" });
        };
        win.document.write(`<!DOCTYPE html><html><head>
<meta charset="utf-8"/>
<title>CAS – ${str(slip.slip_number) ?? ""}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Georgia, serif; font-size: 13px; color: #111; padding: 48px; }
  h1 { font-size: 20px; text-transform: uppercase; letter-spacing: 0.08em; text-align: center; margin-bottom: 2px; }
  .sub { text-align: center; font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 0.12em; }
  .cas-no { text-align: center; font-size: 12px; margin-top: 6px; color: #444; }
  .cas-no span { font-family: monospace; font-weight: bold; color: #111; }
  hr { border: none; border-top: 1px solid #ccc; margin: 18px 0; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 14px; }
  .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #888; margin-bottom: 3px; }
  .value { font-size: 13px; font-weight: 600; }
  .value-small { font-size: 12px; color: #444; margin-top: 1px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { background: #f5f5f5; text-align: left; padding: 7px 10px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #666; border: 1px solid #ddd; }
  td { padding: 8px 10px; border: 1px solid #ddd; vertical-align: middle; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
  .badge-blue { background: #dbeafe; color: #1d4ed8; }
  .badge-green { background: #dcfce7; color: #16a34a; }
  .badge-gray { background: #f3f4f6; color: #6b7280; }
  .sigs { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; margin-top: 40px; }
  .sig-line { border-top: 1px solid #111; padding-top: 6px; }
  .sig-name { font-size: 13px; font-weight: 600; margin-bottom: 2px; }
  .sig-role { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.08em; }
  .footer { text-align: center; font-size: 10px; color: #aaa; margin-top: 36px; }
</style>
</head><body>
  <p class="sub">Fiesta Communities Inc.</p>
  <h1>Client Appointment Slip</h1>
  <p class="cas-no">CAS No. <span>${str(slip.slip_number) ?? "—"}</span></p>
  <hr/>
  <div class="grid2">
    <div>
      <p class="label">Client</p>
      <p class="value">${clientName || "—"}</p>
      <p class="value-small">${str(client.email) ?? ""}</p>
    </div>
    <div>
      <p class="label">Property</p>
      <p class="value">${str(property.title) ?? "—"}</p>
      <p class="value-small">${str(property.address) ?? ""}</p>
    </div>
  </div>
  <div class="grid2">
    <div>
      <p class="label">Schedule</p>
      <p class="value">${fmtWhen(a.schedule)}</p>
    </div>
    ${str(a.location) ? `<div><p class="label">Location</p><p class="value">${str(a.location)}</p></div>` : ""}
  </div>
  ${agentName ? `<div style="margin-bottom:14px"><p class="label">Handled by</p><p class="value">${agentName}</p></div>` : ""}
  ${str(slip.details) ? `<div style="margin-bottom:14px"><p class="label">Details</p><p>${str(slip.details)}</p></div>` : ""}
  <hr/>
  <table>
    <thead>
      <tr><th>Type</th><th>Valid Until</th><th>Status</th></tr>
    </thead>
    <tbody>
      <tr>
        <td>Site Tripping Request</td>
        <td>${fmtDate(slip.request_valid_until)}</td>
        <td><span class="badge badge-blue">1 month</span></td>
      </tr>
      <tr>
        <td>Site Tripping Accomplishment</td>
        <td>${slip.accomplishment_valid_until ? fmtDate(slip.accomplishment_valid_until) : "Not yet signed"}</td>
        <td>${slip.accomplishment_signed_at
            ? `<span class="badge badge-green">Signed — 3 months</span>`
            : `<span class="badge badge-gray">Pending signature</span>`}</td>
      </tr>
    </tbody>
  </table>
  <div class="sigs">
    <div class="sig-line">
      <p class="sig-name">${clientName || "—"}</p>
      <p class="sig-role">Client — Site tripping request</p>
    </div>
    <div class="sig-line">
      <p class="sig-name">&nbsp;</p>
      <p class="sig-role">Agent / Manager — Accomplishment</p>
    </div>
  </div>
  <p class="footer">Generated by Fiesta Communities Portal &mdash; ${new Date().toLocaleDateString(undefined, { dateStyle: "long" })}</p>
</body></html>`);
        win.document.close();
        win.focus();
        setTimeout(() => { win.print(); }, 400);
    };

    const { data, isPending, isError, dataUpdatedAt } = useQuery({
        queryKey: ["agent", "appointment", appointmentId],
        queryFn: () => agentPortalApi.appointment(appointmentId),
        enabled: !!appointmentId,
    });

    const mut = useMutation({
        mutationFn: (status: ApptStatus) =>
            agentPortalApi.updateAppointmentStatus(appointmentId, status),
        onSuccess: (_, status) => {
            queryClient.invalidateQueries({ queryKey: ["agent", "appointments"] });
            queryClient.invalidateQueries({ queryKey: ["agent", "appointment", appointmentId] });
            toast.success(`Status set to ${status}.`);
        },
        onError: (e) => toast.error(getApiErrorMessage(e)),
    });

    const slipImageMut = useMutation({
        mutationFn: (file: File) =>
            agentPortalApi.uploadSlipImage(str(asRecord(asRecord(data?.data).slip).id) ?? "", file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["agent", "appointment", appointmentId] });
            setSlipImageSelected(null);
            if (slipImageInputRef.current) slipImageInputRef.current.value = "";
            toast.success("CAS image uploaded.");
        },
        onError: (e) => toast.error(getApiErrorMessage(e)),
    });

    const a = asRecord(data?.data);
    const client = asRecord(a.client);
    const property = asRecord(a.property);
    const slip = asRecord(a.slip);
    const status = str(a.status) ?? "pending";
    const colorClass = statusColors[status] ?? statusColors.cancelled;
    const slipImageUrl = publicStorageUrl(str(slip.slip_image_url)) ?? null;
    const scheduledAt = parseManilaSchedule(a.schedule);
    const scheduledAtTime = scheduledAt?.getTime() ?? null;
    const hasScheduleOccurred =
        scheduledAtTime !== null &&
        (scheduledAtTime <= dataUpdatedAt || reachedScheduleTime === scheduledAtTime);
    const canSignAccomplishment =
        status === "completed" && hasScheduleOccurred && !slip.accomplishment_signed_at;

    useEffect(() => {
        if (
            status !== "completed" ||
            scheduledAtTime === null ||
            scheduledAtTime <= dataUpdatedAt ||
            slip.accomplishment_signed_at
        ) {
            return;
        }

        let timeoutId: number;

        const scheduleNextCheck = () => {
            const remaining = scheduledAtTime - Date.now();

            timeoutId = window.setTimeout(
                () => {
                    if (scheduledAtTime <= Date.now()) {
                        setReachedScheduleTime(scheduledAtTime);
                        return;
                    }

                    scheduleNextCheck();
                },
                Math.min(Math.max(remaining, 0), MAX_TIMER_DELAY),
            );
        };

        scheduleNextCheck();

        return () => window.clearTimeout(timeoutId);
    }, [dataUpdatedAt, scheduledAtTime, slip.accomplishment_signed_at, status]);

    const fmtWhen = (v: unknown) => {
        if (v == null || v === "") return "—";
        const d = new Date(String(v));
        if (Number.isNaN(d.getTime())) return String(v);
        return d.toLocaleString(undefined, { dateStyle: "long", timeStyle: "short" });
    };

    return (
        <div className="space-y-6">
            <ScreenBackLink to="/dashboard/agent/appointments" label="Site visits" hideFrom="md" />

            {isPending ? (
                <AppointmentDetailSkeleton />
            ) : isError ? (
                <p className="text-destructive">Could not load appointment.</p>
            ) : (
                <div className="grid gap-6 lg:grid-cols-[1fr_320px]">

                    <Card className="border-border/80 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
                            <CardTitle className="text-lg">Site visit</CardTitle>
                            <span className={`rounded-md px-2.5 py-0.5 text-xs font-semibold capitalize whitespace-nowrap ${colorClass}`}>
                                {status}
                            </span>
                        </CardHeader>
                        <CardContent>
                            <Separator className="mb-5" />
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg">
                                        <CalendarIcon className="text-muted-foreground size-4" />
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                                            Date &amp; time
                                        </p>
                                        <p className="mt-0.5 font-medium">{fmtWhen(a.schedule)}</p>
                                    </div>
                                </div>

                                {str(a.location) && (
                                    <div className="flex items-start gap-3">
                                        <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg">
                                            <MapPinIcon className="text-muted-foreground size-4" />
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                                                Location
                                            </p>
                                            <p className="mt-0.5 font-medium">{str(a.location)}</p>
                                        </div>
                                    </div>
                                )}

                                {property.id as string && (
                                    <div className="flex items-start gap-3">
                                        <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg">
                                            <Building2Icon className="text-muted-foreground size-4" />
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                                                Property
                                            </p>
                                            <p className="mt-0.5 font-medium">{str(property.title) ?? "—"}</p>
                                        </div>
                                    </div>
                                )}

                                {str(a.notes) && (
                                    <>
                                        <Separator />
                                        <p className="text-muted-foreground text-sm leading-relaxed">
                                            {str(a.notes)}
                                        </p>
                                    </>
                                )}

                                {!!slip.slip_number && (
                                    <>
                                        <Separator />
                                        <div className="space-y-3">
                                            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide flex items-center gap-1.5">
                                                <FileTextIcon className="size-3.5" />
                                                CAS details
                                            </p>
                                            <div className="flex items-center gap-3">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="gap-1.5"
                                                    onClick={() => setShowCasPrint(true)}
                                                >
                                                    <PrinterIcon className="size-3.5" />
                                                    View / Print CAS
                                                </Button>
                                            </div>
                                            <div className="grid gap-3 sm:grid-cols-2">
                                                <div>
                                                    <p className="text-muted-foreground text-xs">Slip number</p>
                                                    <p className="font-mono text-sm mt-0.5">{str(slip.slip_number)}</p>
                                                </div>
                                                {str(slip.request_valid_until) && (
                                                    <div>
                                                        <p className="text-muted-foreground text-xs flex items-center gap-1">
                                                            <ShieldCheckIcon className="size-3" />
                                                            Request valid until
                                                        </p>
                                                        <p className="text-sm mt-0.5 font-medium">
                                                            {new Date(str(slip.request_valid_until)!).toLocaleDateString(undefined, { dateStyle: "medium" })}
                                                        </p>
                                                    </div>
                                                )}
                                                {str(slip.accomplishment_valid_until) && (
                                                    <div>
                                                        <p className="text-muted-foreground text-xs flex items-center gap-1">
                                                            <ShieldCheckIcon className="size-3 text-green-600" />
                                                            Accomplishment valid until
                                                        </p>
                                                        <p className="text-sm mt-0.5 font-medium">
                                                            {new Date(str(slip.accomplishment_valid_until)!).toLocaleDateString(undefined, { dateStyle: "medium" })}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                            {!slip.accomplishment_signed_at && (
                                                canSignAccomplishment ? (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="gap-1.5"
                                                        disabled={mut.isPending}
                                                        onClick={() =>
                                                            agentPortalApi
                                                                .signSlipAccomplishment(str(slip.id) ?? "")
                                                                .then(() => {
                                                                    queryClient.invalidateQueries({ queryKey: ["agent", "appointment", appointmentId] });
                                                                    toast.success("Accomplishment signed. Valid for 3 months.");
                                                                })
                                                                .catch((e: unknown) => toast.error(getApiErrorMessage(e)))
                                                        }
                                                    >
                                                        <ShieldCheckIcon className="size-3.5" />
                                                        Sign accomplishment
                                                    </Button>
                                                ) : (
                                                    <p className="text-muted-foreground text-xs">
                                                        {status !== "completed"
                                                            ? "Accomplishment signing becomes available after the site visit is completed."
                                                            : scheduledAt
                                                              ? "Accomplishment signing becomes available after the scheduled visit time."
                                                              : "Accomplishment signing is unavailable because the appointment schedule could not be verified."}
                                                    </p>
                                                )
                                            )}

                                            <Separator />

                                            <div className="space-y-2">
                                                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide flex items-center gap-1.5">
                                                    <ImagePlusIcon className="size-3.5" />
                                                    Upload signed copy
                                                </p>
                                                <p className="text-muted-foreground text-xs -mt-1">
                                                    Archive the physically-signed CAS paper as a backup.
                                                </p>
                                                {slipImageUrl && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setPreviewUrl(slipImageUrl)}
                                                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400"
                                                    >
                                                        <ZoomInIcon className="size-3" />
                                                        View archived copy
                                                    </button>
                                                )}
                                                {slipImageSelected ? (
                                                    <p className="inline-flex items-center gap-1 text-xs text-green-700 dark:text-green-400">
                                                        <PaperclipIcon className="size-3" />
                                                        {slipImageSelected.name}
                                                        <span className="text-muted-foreground ml-1">— ready to upload</span>
                                                    </p>
                                                ) : !slipImageUrl ? (
                                                    <p className="text-muted-foreground text-xs">No signed copy archived yet</p>
                                                ) : null}
                                                <div className="flex items-center gap-2">
                                                    <label
                                                        htmlFor="slip-image-input"
                                                        className="border-input hover:bg-accent inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm"
                                                    >
                                                        <UploadCloudIcon className="size-4" />
                                                        {slipImageUrl ? "Replace" : "Upload"}
                                                        <input
                                                            id="slip-image-input"
                                                            type="file"
                                                            accept=".jpg,.jpeg,.png,.pdf"
                                                            className="sr-only"
                                                            ref={slipImageInputRef}
                                                            onChange={(e) => setSlipImageSelected(e.target.files?.[0] ?? null)}
                                                        />
                                                    </label>
                                                    {slipImageSelected && (
                                                        <Button
                                                            size="sm"
                                                            disabled={slipImageMut.isPending}
                                                            onClick={() => slipImageMut.mutate(slipImageSelected)}
                                                        >
                                                            {slipImageMut.isPending ? "Saving…" : "Save image"}
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-4">

                        <Card className="border-border/80 shadow-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Update status</CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-wrap gap-2">
                                <Button
                                    size="sm"
                                    disabled={mut.isPending || status === "confirmed"}
                                    onClick={() => mut.mutate("confirmed")}
                                >
                                    Confirm
                                </Button>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    disabled={mut.isPending || status === "completed"}
                                    onClick={() => mut.mutate("completed")}
                                >
                                    Complete
                                </Button>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    disabled={mut.isPending || status === "cancelled"}
                                    onClick={() => mut.mutate("cancelled")}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={mut.isPending || status === "pending"}
                                    onClick={() => mut.mutate("pending")}
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
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            <Dialog open={showCasPrint} onOpenChange={setShowCasPrint}>
                <DialogContent
                    className="flex flex-col gap-0 overflow-hidden p-0"
                    style={{ maxWidth: "min(92vw, 800px)", height: "90vh" }}
                >
                    <div className="flex shrink-0 flex-col items-start gap-2 border-b px-4 py-3 pr-14 sm:flex-row sm:items-center sm:justify-between">
                        <DialogHeader>
                            <DialogTitle className="text-sm font-medium">Client Appointment Slip</DialogTitle>
                        </DialogHeader>
                        <Button
                            size="sm"
                            variant="outline"
                            className="shrink-0 gap-1.5"
                            onClick={printCas}
                        >
                            <PrinterIcon className="size-3.5" />
                            Print
                        </Button>
                    </div>
                    <div className="flex-1 overflow-auto bg-white p-8 text-black">
                        <div className="mx-auto max-w-lg space-y-6 font-sans text-sm">
                            <div className="text-center space-y-1 border-b pb-4">
                                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Fiesta Communities Inc.</p>
                                <h1 className="text-xl font-bold uppercase tracking-wide">Client Appointment Slip</h1>
                                <p className="text-xs text-gray-500">CAS No. <span className="font-mono font-semibold text-black">{str(slip.slip_number) ?? "—"}</span></p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs uppercase font-semibold text-gray-500 mb-0.5">Client</p>
                                    <p className="font-medium">{str(client.first_name)} {str(client.last_name)}</p>
                                    {str(client.email) && <p className="text-xs text-gray-500">{str(client.email)}</p>}
                                </div>
                                <div>
                                    <p className="text-xs uppercase font-semibold text-gray-500 mb-0.5">Property</p>
                                    <p className="font-medium">{str(property.title) ?? "—"}</p>
                                    {str(property.address) && <p className="text-xs text-gray-500">{str(property.address)}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs uppercase font-semibold text-gray-500 mb-0.5">Schedule</p>
                                    <p className="font-medium">{fmtWhen(a.schedule)}</p>
                                </div>
                                {str(a.location) && (
                                    <div>
                                        <p className="text-xs uppercase font-semibold text-gray-500 mb-0.5">Location</p>
                                        <p className="font-medium">{str(a.location)}</p>
                                    </div>
                                )}
                            </div>

                            {str(slip.details) && (
                                <div>
                                    <p className="text-xs uppercase font-semibold text-gray-500 mb-0.5">Details</p>
                                    <p>{str(slip.details)}</p>
                                </div>
                            )}

                            <div className="rounded-lg border border-gray-200 overflow-hidden">
                                <table className="w-full text-xs">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-3 py-2 text-left font-semibold uppercase tracking-wide text-gray-500">Type</th>
                                            <th className="px-3 py-2 text-left font-semibold uppercase tracking-wide text-gray-500">Valid Until</th>
                                            <th className="px-3 py-2 text-left font-semibold uppercase tracking-wide text-gray-500">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        <tr>
                                            <td className="px-3 py-2 font-medium">Site Tripping Request</td>
                                            <td className="px-3 py-2">
                                                {str(slip.request_valid_until)
                                                    ? new Date(str(slip.request_valid_until)!).toLocaleDateString(undefined, { dateStyle: "medium" })
                                                    : "—"}
                                            </td>
                                            <td className="px-3 py-2">
                                                <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                                                    1 month
                                                </span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="px-3 py-2 font-medium">Site Tripping Accomplishment</td>
                                            <td className="px-3 py-2">
                                                {str(slip.accomplishment_valid_until)
                                                    ? new Date(str(slip.accomplishment_valid_until)!).toLocaleDateString(undefined, { dateStyle: "medium" })
                                                    : "Not yet signed"}
                                            </td>
                                            <td className="px-3 py-2">
                                                {slip.accomplishment_signed_at ? (
                                                    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                                                        Signed — 3 months
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                                                        Pending signature
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div className="grid grid-cols-2 gap-8 pt-6">
                                <div className="space-y-1">
                                    <div className="border-t border-black pt-1">
                                        <p className="text-xs text-gray-500">Client signature</p>
                                        <p className="font-medium text-sm">{str(client.first_name)} {str(client.last_name)}</p>
                                        <p className="text-xs text-gray-400">Site tripping request</p>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="border-t border-black pt-1">
                                        <p className="text-xs text-gray-500">Agent / Manager signature</p>
                                        <p className="text-xs text-gray-400">Accomplishment confirmation</p>
                                    </div>
                                </div>
                            </div>

                            <p className="text-center text-xs text-gray-400 pt-2 border-t">
                                Generated by Fiesta Communities Portal — {new Date().toLocaleDateString(undefined, { dateStyle: "long" })}
                            </p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={!!previewUrl} onOpenChange={(open) => { if (!open) setPreviewUrl(null); }}>
                <DialogContent
                    className="flex flex-col gap-0 overflow-hidden p-0"
                    style={{ maxWidth: "min(92vw, 1100px)", height: "90vh" }}
                >
                    <DialogHeader className="shrink-0 border-b px-4 py-3">
                        <DialogTitle className="text-sm font-medium">CAS image preview</DialogTitle>
                    </DialogHeader>
                    <div className="bg-muted flex flex-1 overflow-hidden">
                        {previewUrl && (
                            previewUrl.toLowerCase().includes(".pdf") ? (
                                <iframe src={previewUrl} title="CAS preview" className="h-full w-full border-0" />
                            ) : (
                                <div className="flex flex-1 items-center justify-center overflow-auto p-4">
                                    <img src={previewUrl} alt="CAS" className="max-h-full w-auto object-contain" />
                                </div>
                            )
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AgentAppointmentDetail;
