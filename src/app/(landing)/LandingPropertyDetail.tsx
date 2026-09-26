import { LandingChrome } from "@/components/layout/LandingChrome";
import { publicApi } from "@/db/api/public.api";
import { clientPortalApi } from "@/db/api/client.portal.api";
import { formatPhpCurrency } from "@/lib/format-php-currency";
import { asRecord, idStr, str } from "@/lib/record";
import { publicStorageUrl } from "@/lib/storage-url";
import { getClientToken } from "@/lib/tokens";
import { getApiErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import {
    isPropertyAvailableForReservation,
    normalizePropertyStatus,
    propertyStatusBadgeClass,
    propertyStatusLabel,
} from "@/lib/property-status";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { AmortizationCalculator } from "@/components/app/AmortizationCalculator";
import { ScreenBackLink } from "@/components/navigation/ScreenBackLink";
import { PropertyProjectContent } from "@/app/(landing)/PropertyProjectContent";
import { AlertCircleIcon, Bath, Bed, Check, MapPin, Ruler } from "lucide-react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const toEmbedUrl = (url: string): string | null => {
    try {
        const u = new URL(url);
        if (u.hostname.includes("youtube.com")) {
            const v = u.searchParams.get("v");
            return v ? `https://www.youtube.com/embed/${v}` : null;
        }
        if (u.hostname.includes("youtu.be")) {
            const v = u.pathname.slice(1);
            return v ? `https://www.youtube.com/embed/${v}` : null;
        }
        return url;
    } catch {
        return null;
    }
};

const parseFeatures = (raw: unknown): string[] => {
    if (!Array.isArray(raw)) return [];
    return raw.map((x) => (typeof x === "string" ? x.trim() : "")).filter(Boolean);
};

const fmtSqm = (v: unknown) => {
    if (v == null || v === "") return null;
    const n = Number(v);
    if (Number.isNaN(n)) return null;
    return `${n} m²`;
};

const fmtInt = (v: unknown) => {
    if (v == null || v === "") return null;
    const n = Number(v);
    if (Number.isNaN(n)) return null;
    return String(n);
};

const InfoRow = ({ label, value }: { label: string; value: string | null | undefined }) => (
    <div className="border-border/60 flex flex-wrap items-baseline justify-between gap-2 border-b py-3 last:border-0">
        <span className="text-muted-foreground text-sm">{label}</span>
        <strong className="text-foreground text-right text-sm font-semibold">
            {value != null && value !== "" ? value : "—"}
        </strong>
    </div>
);

const LandingPropertyDetail = () => {
    const { propertyId } = useParams({ strict: false }) as { propertyId: string };
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const isLoggedIn = !!getClientToken();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");

    const { data, isPending, isError } = useQuery({
        queryKey: ["public", "property", propertyId],
        queryFn: () => publicApi.property(propertyId),
        refetchInterval: 2_000,
        enabled: !!propertyId,
    });

    const { data: listData } = useQuery({
        queryKey: ["public", "properties", "related"],
        queryFn: () => publicApi.properties(),
        refetchInterval: 2_000,
    });

    const { data: prequalData } = useQuery({
        queryKey: ["client", "prequalification"],
        queryFn: () => clientPortalApi.getOwnPrequalification(),
        enabled: isLoggedIn,
        refetchInterval: 2_000,
    });

    const inquiriesQuery = useQuery({
        queryKey: ["client", "inquiries"],
        queryFn: () => clientPortalApi.inquiries(),
        enabled: isLoggedIn,
        refetchInterval: 2_000,
    });

    const hasSubmittedPrequalification =
        isLoggedIn &&
        prequalData?.data != null &&
        !!str(asRecord(prequalData.data).submitted_at);

    const p = asRecord(data?.data);

    const galleryRaw = p.gallery_images;
    const galleryPaths = Array.isArray(galleryRaw)
        ? galleryRaw
            .map((item) => (typeof item === "string" ? item : null))
            .filter((item): item is string => item !== null)
        : [];
    const slides: string[] = [];
    const mainImage = publicStorageUrl(str(p.main_image));
    if (mainImage) slides.push(mainImage);
    for (const path of galleryPaths) {
        const url = publicStorageUrl(path);
        if (url && !slides.includes(url)) slides.push(url);
    }

    const [activeSelection, setActiveSelection] = useState({
        propertyId,
        index: 0,
    });
    const activeIdx =
        activeSelection.propertyId === propertyId ? activeSelection.index : 0;
    const activeSrc = slides[activeIdx] ?? slides[0];

    const title = str(p.title) ?? "Property";
    const locationLines = [str(p.project), str(p.city_municipality), str(p.province)].filter(
        (line, index, lines): line is string =>
            Boolean(line) && lines.indexOf(line) === index,
    );
    const status = normalizePropertyStatus(str(p.status));
    const canReserveListing = isPropertyAvailableForReservation(status);
    const features = parseFeatures(p.included_features);

    const related = useMemo(() => {
        const rows = (listData?.data as unknown[]) ?? [];
        return rows
            .filter((raw) => idStr(asRecord(raw).id) !== propertyId)
            .slice(0, 3);
    }, [listData?.data, propertyId]);

    const existingOpenInquiry = inquiriesQuery.data?.data.find(
        (inquiry) =>
            (inquiry.property_id === propertyId || inquiry.property?.id === propertyId) &&
            (inquiry.status === "pending" || inquiry.status === "responded"),
    );

    const reserveMut = useMutation({
        mutationFn: () =>
            clientPortalApi.createInquiry({
                subject: subject.trim(),
                message: message.trim(),
                property_id: propertyId,
            }),
        onSuccess: (response) => {
            const inquiryId = response.data?.id?.trim();
            void queryClient.invalidateQueries({ queryKey: ["client", "inquiries"] });
            toast.success("Inquiry submitted. An available agent can now review it.");
            setDialogOpen(false);
            setSubject("");
            setMessage("");
            if (inquiryId) {
                navigate({
                    to: "/dashboard/inquiries/$inquiryId",
                    params: { inquiryId },
                });
            } else {
                navigate({ to: "/dashboard/inquiries" });
            }
        },
        onError: (e) => toast.error(getApiErrorMessage(e)),
    });

    return (
        <LandingChrome>
            <div className="bg-background text-foreground">
                <div className="border-border/60 border-b">
                    <div className="mx-auto max-w-7xl px-4 py-4 md:px-12 lg:px-14">
                        <p className="text-muted-foreground text-sm">
                            <Link to="/" className="hover:text-primary transition-colors">
                                Home
                            </Link>
                            <span className="px-2">/</span>
                            <Link to="/properties" className="hover:text-primary transition-colors">
                                Properties
                            </Link>
                            <span className="px-2">/</span>
                            <span className="text-foreground font-medium">{title}</span>
                        </p>
                    </div>
                </div>

                <div className="mx-auto max-w-7xl space-y-12 px-4 py-10 md:px-12 lg:px-14">
                    <ScreenBackLink to="/properties" label="All properties" />

                    {isPending ? (
                        <div className="flex justify-center py-20">
                            <Spinner className="size-10" />
                        </div>
                    ) : isError ? (
                        <p className="text-destructive">Property not found.</p>
                    ) : (
                        <>
                            <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
                                <div className="space-y-4">
                                    <div className="border-border bg-muted/30 aspect-[4/3] overflow-hidden rounded-xl border shadow-sm">
                                        {activeSrc ? (
                                            <img
                                                src={activeSrc}
                                                alt=""
                                                className="size-full object-cover"
                                            />
                                        ) : (
                                            <div className="text-muted-foreground flex size-full items-center justify-center text-sm">
                                                No photos yet
                                            </div>
                                        )}
                                    </div>
                                    {slides.length > 1 ? (
                                        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                                            {slides.map((src, i) => (
                                                <button
                                                    key={src}
                                                    type="button"
                                                    onClick={() =>
                                                        setActiveSelection({
                                                            propertyId,
                                                            index: i,
                                                        })
                                                    }
                                                    className={cn(
                                                        "border-border aspect-[4/3] overflow-hidden rounded-lg border-2 transition-shadow",
                                                        i === activeIdx
                                                            ? "border-primary ring-primary/30 shadow-md ring-2"
                                                            : "hover:border-primary/50 opacity-90 hover:opacity-100",
                                                    )}
                                                >
                                                    <img src={src} alt="" className="size-full object-cover" />
                                                </button>
                                            ))}
                                        </div>
                                    ) : null}
                                </div>

                                <Card className="border-border/80 h-fit shadow-sm">
                                    <CardContent className="space-y-5 p-6 sm:p-8">
                                        <span
                                            className={cn(
                                                "inline-block rounded-full px-3 py-1 text-xs font-semibold tracking-wide",
                                                propertyStatusBadgeClass(status),
                                            )}
                                        >
                                            {propertyStatusLabel(status)}
                                        </span>
                                        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
                                        <div className="text-muted-foreground flex items-start gap-2 text-sm">
                                            <MapPin className="text-primary mt-0.5 size-4 shrink-0" />
                                            <div className="min-w-0 space-y-1">
                                                {locationLines.length > 0 ? (
                                                    locationLines.map((line, index) => (
                                                        <p
                                                            key={line}
                                                            className={cn(
                                                                "break-words",
                                                                index === 0
                                                                    ? "text-foreground font-medium"
                                                                    : undefined,
                                                            )}
                                                        >
                                                            {line}
                                                        </p>
                                                    ))
                                                ) : (
                                                    <p>—</p>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-primary text-3xl font-bold tracking-tight">
                                            {formatPhpCurrency(
                                                p.price == null ? null : Number(p.price),
                                            )}
                                        </p>
                                        <div className="text-muted-foreground flex flex-wrap gap-x-6 gap-y-2 text-sm">
                                            {fmtInt(p.bedrooms) ? (
                                                <span className="inline-flex items-center gap-2">
                                                    <Bed className="text-primary size-4" />
                                                    {fmtInt(p.bedrooms)} Bedrooms
                                                </span>
                                            ) : null}
                                            {fmtInt(p.bathrooms) ? (
                                                <span className="inline-flex items-center gap-2">
                                                    <Bath className="text-primary size-4" />
                                                    {fmtInt(p.bathrooms)} Bathroom
                                                    {Number(p.bathrooms) === 1 ? "" : "s"}
                                                </span>
                                            ) : null}
                                            {fmtSqm(p.floor_area_sqm) ? (
                                                <span className="inline-flex items-center gap-2">
                                                    <Ruler className="text-primary size-4" />
                                                    {fmtSqm(p.floor_area_sqm)} Floor Area
                                                </span>
                                            ) : null}
                                        </div>
                                        <p className="text-muted-foreground text-sm leading-relaxed">
                                            {str(p.description) ?? ""}
                                        </p>
                                        <div className="flex flex-wrap gap-3 pt-2">
                                            {!canReserveListing ? (
                                                <div className="border-border text-muted-foreground w-full rounded-lg border border-dashed px-4 py-3 text-sm leading-relaxed">
                                                    {status === "sold" ? (
                                                        <>
                                                            This property is marked as <strong className="text-foreground">Sold</strong>{" "}
                                                            and is not accepting new inquiries.
                                                        </>
                                                    ) : (
                                                        <>
                                                            This property is <strong className="text-foreground">Reserved</strong> and is
                                                            not accepting new property inquiries here.
                                                        </>
                                                    )}
                                                </div>
                                            ) : isLoggedIn ? (
                                                hasSubmittedPrequalification ? (
                                                    inquiriesQuery.isPending ? (
                                                        <Button className="rounded-lg" disabled>
                                                            Checking inquiries…
                                                        </Button>
                                                    ) : inquiriesQuery.isError ? (
                                                        <div className="border-destructive/40 w-full space-y-3 rounded-lg border px-4 py-3">
                                                            <p className="text-destructive text-sm">
                                                                Could not check your existing inquiries.
                                                            </p>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => inquiriesQuery.refetch()}
                                                            >
                                                                Try again
                                                            </Button>
                                                        </div>
                                                    ) : existingOpenInquiry ? (
                                                        <div className="w-full space-y-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800/40 dark:bg-blue-900/20">
                                                            <div>
                                                                <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                                                                    You already have an open inquiry
                                                                </p>
                                                                <p className="mt-1 text-xs text-blue-800 dark:text-blue-300">
                                                                    Your {existingOpenInquiry.status} inquiry must
                                                                    be closed before you can submit another one for
                                                                    this property.
                                                                </p>
                                                            </div>
                                                            <Button variant="outline" size="sm" asChild>
                                                                <Link
                                                                    to="/dashboard/inquiries/$inquiryId"
                                                                    params={{
                                                                        inquiryId: existingOpenInquiry.id,
                                                                    }}
                                                                >
                                                                    View existing inquiry
                                                                </Link>
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                                                            <DialogTrigger asChild>
                                                                <Button className="rounded-lg">
                                                                    Send inquiry
                                                                </Button>
                                                            </DialogTrigger>
                                                            <DialogContent className="sm:max-w-md">
                                                                <DialogHeader>
                                                                    <DialogTitle>
                                                                        Send property inquiry
                                                                    </DialogTitle>
                                                                    <DialogDescription>
                                                                        Ask about{" "}
                                                                        <span className="text-foreground font-medium">
                                                                            {title}
                                                                        </span>
                                                                        . An available agent can claim your inquiry
                                                                        and follow up with you.
                                                                    </DialogDescription>
                                                                </DialogHeader>
                                                                <div className="space-y-4 py-2">
                                                                    <div className="space-y-2">
                                                                        <Label htmlFor="inquiry-subject">
                                                                            Subject
                                                                        </Label>
                                                                        <Input
                                                                            id="inquiry-subject"
                                                                            placeholder="e.g. Interested in this property"
                                                                            value={subject}
                                                                            onChange={(e) =>
                                                                                setSubject(e.target.value)
                                                                            }
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <Label htmlFor="inquiry-message">
                                                                            Message
                                                                        </Label>
                                                                        <Textarea
                                                                            id="inquiry-message"
                                                                            placeholder="Tell the agent what you would like to know…"
                                                                            rows={4}
                                                                            value={message}
                                                                            onChange={(e) =>
                                                                                setMessage(e.target.value)
                                                                            }
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <DialogFooter>
                                                                    <Button
                                                                        variant="outline"
                                                                        onClick={() => setDialogOpen(false)}
                                                                        disabled={reserveMut.isPending}
                                                                    >
                                                                        Cancel
                                                                    </Button>
                                                                    <Button
                                                                        onClick={() => reserveMut.mutate()}
                                                                        disabled={
                                                                            reserveMut.isPending ||
                                                                            !subject.trim() ||
                                                                            !message.trim()
                                                                        }
                                                                    >
                                                                        {reserveMut.isPending
                                                                            ? "Submitting…"
                                                                            : "Submit inquiry"}
                                                                    </Button>
                                                                </DialogFooter>
                                                            </DialogContent>
                                                        </Dialog>
                                                    )
                                                ) : (
                                                    <div className="w-full rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800/40 dark:bg-amber-900/20">
                                                        <div className="flex items-start gap-3">
                                                            <AlertCircleIcon className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                                                            <div className="space-y-1">
                                                                <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                                                                    Prequalification required
                                                                </p>
                                                                <p className="text-xs text-amber-800 dark:text-amber-300">
                                                                    You must submit your financial documents before sending a property inquiry.{" "}
                                                                    <Link
                                                                        to="/dashboard/prequalification"
                                                                        className="font-medium underline underline-offset-2 hover:no-underline"
                                                                    >
                                                                        Complete your documents
                                                                    </Link>
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            ) : (
                                                <Button asChild className="rounded-lg">
                                                    <Link
                                                        to="/auth/login"
                                                        search={{ redirect: `/property/${propertyId}` }}
                                                    >
                                                        Send inquiry
                                                    </Link>
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="grid items-start gap-6 md:grid-cols-2">
                                <Card className="border-border/80 shadow-sm">
                                    <CardContent className="p-6 sm:p-8">
                                        <h2 className="mb-2 text-xl font-semibold tracking-tight">
                                            Property information
                                        </h2>
                                        <div className="divide-border/60 divide-y">
                                            <InfoRow label="Property Type" value={str(p.property_type)} />
                                            <InfoRow label="Project / Subdivision" value={str(p.project)} />
                                            <InfoRow label="Block" value={str(p.block)} />
                                            <InfoRow label="Lot Number" value={str(p.lot_number)} />
                                            <InfoRow label="City / Municipality" value={str(p.city_municipality)} />
                                            <InfoRow label="Province" value={str(p.province)} />
                                            <InfoRow label="Detailed Address" value={str(p.address)} />
                                            <InfoRow label="Status" value={propertyStatusLabel(status)} />
                                            <InfoRow label="Lot area" value={fmtSqm(p.lot_area_sqm)} />
                                            <InfoRow label="Floor area" value={fmtSqm(p.floor_area_sqm)} />
                                            <InfoRow label="Bedrooms" value={fmtInt(p.bedrooms)} />
                                            <InfoRow label="Bathrooms" value={fmtInt(p.bathrooms)} />
                                            <InfoRow label="Parking" value={str(p.parking)} />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-border/80 shadow-sm">
                                    <CardContent className="p-6 sm:p-8">
                                        <h2 className="mb-4 text-xl font-semibold tracking-tight">
                                            Included features
                                        </h2>
                                        {features.length > 0 ? (
                                            <ul className="space-y-3">
                                                {features.map((item) => (
                                                    <li
                                                        key={item}
                                                        className="text-muted-foreground flex items-start gap-3 text-sm"
                                                    >
                                                        <Check className="text-primary mt-0.5 size-4 shrink-0" />
                                                        <span className="text-foreground">{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-muted-foreground text-sm">
                                                No features listed for this property yet.
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            {str(p.video_url) && (() => {
                                const embed = toEmbedUrl(str(p.video_url)!);
                                return (
                                    <Card className="border-border/80 overflow-hidden shadow-sm">
                                        <CardContent className="p-6 sm:p-8">
                                            <h2 className="mb-4 text-xl font-semibold tracking-tight">
                                                Property tour
                                            </h2>
                                            {embed && (embed.includes("youtube.com/embed") || embed.match(/\.(mp4|webm|ogg)$/i)) ? (
                                                embed.includes("youtube.com/embed") ? (
                                                    <div className="relative w-full overflow-hidden rounded-xl" style={{ paddingBottom: "56.25%" }}>
                                                        <iframe
                                                            src={embed}
                                                            title="Property tour"
                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                            allowFullScreen
                                                            className="absolute inset-0 h-full w-full border-0"
                                                        />
                                                    </div>
                                                ) : (
                                                    <video
                                                        src={embed}
                                                        controls
                                                        className="w-full rounded-xl"
                                                    />
                                                )
                                            ) : (
                                                <a
                                                    href={str(p.video_url)!}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-primary text-sm font-medium underline underline-offset-4 hover:no-underline"
                                                >
                                                    Watch property video
                                                </a>
                                            )}
                                        </CardContent>
                                    </Card>
                                );
                            })()}

                            <PropertyProjectContent project={str(p.project)} />

                            <AmortizationCalculator
                                initialPrice={p.price != null ? Number(p.price) : 0}
                            />

                            {related.length > 0 ? (
                                <section className="space-y-6">
                                    <div className="flex flex-wrap items-end justify-between gap-4">
                                        <h2 className="text-2xl font-semibold tracking-tight">Related properties</h2>
                                        <Link
                                            to="/properties"
                                            className="text-primary text-sm font-medium hover:underline"
                                        >
                                            View all
                                        </Link>
                                    </div>
                                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                        {related.map((raw) => {
                                            const r = asRecord(raw);
                                            const id = idStr(r.id);
                                            const img = publicStorageUrl(str(r.main_image));
                                            const st = normalizePropertyStatus(str(r.status));
                                            const relatedLocationLines = [
                                                str(r.project),
                                                str(r.city_municipality),
                                                str(r.province),
                                            ].filter(
                                                (line, index, lines): line is string =>
                                                    Boolean(line) && lines.indexOf(line) === index,
                                            );
                                            return (
                                                <Card
                                                    key={id}
                                                    className="border-border/80 flex flex-col overflow-hidden shadow-sm"
                                                >
                                                    <div className="bg-muted relative aspect-[4/3]">
                                                        {img ? (
                                                            <img
                                                                src={img}
                                                                alt=""
                                                                className="size-full object-cover"
                                                            />
                                                        ) : null}
                                                        <span
                                                            className={cn(
                                                                "absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                                                                propertyStatusBadgeClass(st),
                                                            )}
                                                        >
                                                            {propertyStatusLabel(st)}
                                                        </span>
                                                    </div>
                                                    <CardContent className="flex flex-1 flex-col gap-3 p-5">
                                                        <h3 className="line-clamp-2 font-semibold leading-snug">
                                                            {str(r.title) ?? "Property"}
                                                        </h3>
                                                        <div className="text-muted-foreground flex items-start gap-1.5 text-xs">
                                                            <MapPin className="text-primary mt-0.5 size-3.5 shrink-0" />
                                                            <div className="min-w-0 space-y-0.5">
                                                                {relatedLocationLines.map((line) => (
                                                                    <p key={line} className="line-clamp-2">
                                                                        {line}
                                                                    </p>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <p className="text-primary text-lg font-bold">
                                                            {formatPhpCurrency(
                                                                r.price == null ? null : Number(r.price),
                                                            )}
                                                        </p>
                                                        <div className="text-muted-foreground flex flex-wrap gap-3 text-xs">
                                                            {fmtInt(r.bedrooms) ? (
                                                                <span className="inline-flex items-center gap-1">
                                                                    <Bed className="size-3.5" />
                                                                    {fmtInt(r.bedrooms)}
                                                                </span>
                                                            ) : null}
                                                            {fmtInt(r.bathrooms) ? (
                                                                <span className="inline-flex items-center gap-1">
                                                                    <Bath className="size-3.5" />
                                                                    {fmtInt(r.bathrooms)}
                                                                </span>
                                                            ) : null}
                                                            {fmtSqm(r.floor_area_sqm) ? (
                                                                <span className="inline-flex items-center gap-1">
                                                                    <Ruler className="size-3.5" />
                                                                    {fmtSqm(r.floor_area_sqm)}
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                        <Button variant="outline" size="sm" className="mt-auto" asChild>
                                                            <Link
                                                                to="/property/$propertyId"
                                                                params={{ propertyId: id ?? "" }}
                                                            >
                                                                View details
                                                            </Link>
                                                        </Button>
                                                    </CardContent>
                                                </Card>
                                            );
                                        })}
                                    </div>
                                </section>
                            ) : null}
                        </>
                    )}
                </div>
            </div>
        </LandingChrome>
    );
};

export default LandingPropertyDetail;
