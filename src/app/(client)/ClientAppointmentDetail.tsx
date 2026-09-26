import { clientPortalApi } from "@/db/api/client.portal.api";
import { asRecord, str } from "@/lib/record";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useParams } from "@tanstack/react-router";
import { ScreenBackLink } from "@/components/navigation/ScreenBackLink";
import { useQuery } from "@tanstack/react-query";
import { Building2Icon, CalendarIcon, FileTextIcon, MapPinIcon, ShieldCheckIcon, UserIcon } from "lucide-react";

const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    confirmed: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-muted text-muted-foreground",
};

const AppointmentDetailSkeleton = () => (
    <div className="space-y-6">
        <Skeleton className="h-9 w-28 rounded-md" />
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="border-border/80 space-y-5 rounded-xl border p-6 shadow-sm">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-7 w-36" />
                    <Skeleton className="h-6 w-20 rounded-md" />
                </div>
                <Skeleton className="h-px w-full" />
                <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex gap-3">
                            <Skeleton className="size-9 shrink-0 rounded-lg" />
                            <div className="space-y-1.5 flex-1">
                                <Skeleton className="h-3 w-20" />
                                <Skeleton className="h-4 w-2/3" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="border-border/80 space-y-4 rounded-xl border p-6 shadow-sm">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
            </div>
        </div>
    </div>
);

const ClientAppointmentDetail = () => {
    const { appointmentId } = useParams({ strict: false }) as { appointmentId: string };

    const { data, isPending, isError } = useQuery({
        queryKey: ["client", "appointment", appointmentId],
        queryFn: () => clientPortalApi.appointment(appointmentId),
        enabled: !!appointmentId,
    });

    const a = asRecord(data?.data);
    const agent = asRecord(a.agent);
    const property = asRecord(a.property);
    const slip = asRecord(a.slip);
    const status = str(a.status) ?? "pending";
    const colorClass = statusColors[status] ?? statusColors.cancelled;

    const fmtWhen = (v: unknown) => {
        if (v == null || v === "") return "—";
        const d = new Date(String(v));
        if (Number.isNaN(d.getTime())) return String(v);
        return d.toLocaleString(undefined, { dateStyle: "long", timeStyle: "short" });
    };

    const fmtDate = (v: unknown) => {
        if (v == null || v === "") return "Not available";
        const d = new Date(String(v));
        if (Number.isNaN(d.getTime())) return String(v);
        return d.toLocaleDateString(undefined, { dateStyle: "medium" });
    };

    const hasSlip = Boolean(str(slip.id) || str(slip.slip_number) || str(slip.appointment_id));

    return (
        <div className="space-y-6">
            <ScreenBackLink to="/dashboard/appointments" label="Appointments & CAS" hideFrom="md" />

            {isPending ? (
                <AppointmentDetailSkeleton />
            ) : isError ? (
                <p className="text-destructive">Could not load appointment.</p>
            ) : (
                <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                    <div className="space-y-6">
                        <Card className="border-border/80 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
                            <CardTitle className="text-lg">Appointment</CardTitle>
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

                                {property?.id as string && (
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

                            </div>
                        </CardContent>
                        </Card>

                        <Card className="border-border/80 shadow-sm">
                            <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                                <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg">
                                    <FileTextIcon className="text-muted-foreground size-4" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">Client Appointment Slip (CAS)</CardTitle>
                                    <p className="text-muted-foreground mt-1 text-sm">
                                        Slip and accomplishment information for this site visit.
                                    </p>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Separator className="mb-5" />
                                {hasSlip ? (
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                                                CAS number
                                            </p>
                                            <p className="mt-1 font-mono text-sm">
                                                {str(slip.slip_number) ?? "Not available"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                                                Request valid until
                                            </p>
                                            <p className="mt-1 text-sm font-medium">
                                                {fmtDate(slip.request_valid_until)}
                                            </p>
                                        </div>
                                        {str(slip.accomplishment_signed_at) && (
                                            <div>
                                                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                                                    Accomplishment signed
                                                </p>
                                                <p className="mt-1 text-sm font-medium">
                                                    {fmtWhen(slip.accomplishment_signed_at)}
                                                </p>
                                            </div>
                                        )}
                                        {str(slip.accomplishment_valid_until) && (
                                            <div>
                                                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                                                    Accomplishment valid until
                                                </p>
                                                <p className="mt-1 text-sm font-medium">
                                                    {fmtDate(slip.accomplishment_valid_until)}
                                                </p>
                                            </div>
                                        )}
                                        {str(slip.slip_image_url) && (
                                            <div className="border-border bg-muted/40 flex items-start gap-3 rounded-lg border p-3 sm:col-span-2">
                                                <ShieldCheckIcon className="mt-0.5 size-4 shrink-0 text-green-600 dark:text-green-400" />
                                                <div>
                                                    <p className="text-sm font-medium">Signed CAS copy available</p>
                                                    <p className="text-muted-foreground mt-0.5 text-xs">
                                                        A signed or archived CAS image is on file for this appointment.
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-sm">
                                        CAS information is not available for this appointment.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="border-border/80 shadow-sm lg:self-start">
                        <CardHeader>
                            <CardTitle className="text-base">Assigned agent</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-full">
                                    <UserIcon className="text-muted-foreground size-4" />
                                </div>
                                <div>
                                    <p className="font-medium">
                                        {str(agent.first_name)} {str(agent.last_name)}
                                    </p>
                                    {str(agent.email) && (
                                        <p className="text-muted-foreground text-xs">{str(agent.email)}</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default ClientAppointmentDetail;
