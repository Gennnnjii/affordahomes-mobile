import { ScreenBackLink } from "@/components/navigation/ScreenBackLink";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { agentPortalApi } from "@/db/api/agent.portal.api";
import { getApiErrorMessage } from "@/lib/api-error";
import {
    normalizePropertyStatus,
    propertyStatusBadgeClass,
    propertyStatusLabel,
} from "@/lib/property-status";
import { asRecord, str } from "@/lib/record";
import { publicStorageUrl } from "@/lib/storage-url";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";

const displayValue = (value: unknown): string => {
    if (value === null || value === undefined || value === "") return "—";

    if (Array.isArray(value)) {
        const values = value
            .map((item) => String(item).trim())
            .filter(Boolean);

        return values.length > 0 ? values.join(", ") : "—";
    }

    return String(value);
};

const formatPrice = (value: unknown): string => {
    const parsed = Number(value);

    if (!Number.isFinite(parsed)) return "—";

    return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        maximumFractionDigits: 2,
    }).format(parsed);
};

const DetailField = ({
    label,
    value,
}: {
    label: string;
    value: unknown;
}) => (
    <div className="space-y-1">
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            {label}
        </p>
        <p className="text-sm font-medium">{displayValue(value)}</p>
    </div>
);

const AgentPropertyDetailSkeleton = () => (
    <div className="space-y-6">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <Skeleton className="h-[520px] rounded-xl" />
            <Skeleton className="h-[420px] rounded-xl" />
        </div>
    </div>
);

const AgentPropertyDetailPage = () => {
    const { propertyId } = useParams({ strict: false }) as {
        propertyId: string;
    };

    const propertyQuery = useQuery({
        queryKey: ["agent", "property", propertyId],
        queryFn: () => agentPortalApi.property(propertyId),
        enabled: Boolean(propertyId),
    });

    if (propertyQuery.isPending) {
        return <AgentPropertyDetailSkeleton />;
    }

    if (propertyQuery.isError || !propertyQuery.data?.data) {
        return (
            <div className="space-y-6">
                <ScreenBackLink
                    to="/dashboard/agent/properties"
                    label="Properties"
                    hideFrom="md"
                />

                <Card className="border-destructive/30">
                    <CardContent className="text-destructive py-8">
                        {propertyQuery.isError
                            ? getApiErrorMessage(propertyQuery.error)
                            : "Property not found."}
                    </CardContent>
                </Card>
            </div>
        );
    }

    const property = asRecord(propertyQuery.data.data);

    const title = str(property.title)?.trim() || "Property";
    const status = normalizePropertyStatus(str(property.status));
    const mainImageSrc = publicStorageUrl(str(property.main_image));
    const videoUrl = str(property.video_url);

    const galleryRaw =
        (Array.isArray(property.property_gallery_images)
            ? property.property_gallery_images
            : null) ??
        (Array.isArray(property.propertyGalleryImages)
            ? property.propertyGalleryImages
            : null) ??
        (Array.isArray(property.gallery_images)
            ? property.gallery_images
            : []);

    const galleryPaths = galleryRaw.flatMap((item) => {
        if (typeof item === "string") {
            return item.trim() ? [item] : [];
        }

        const record = asRecord(item);
        const path = str(record.path);

        return path ? [path] : [];
    });

    return (
        <div className="space-y-6 pb-12">
            <ScreenBackLink
                to="/dashboard/agent/properties"
                label="Properties"
                hideFrom="md"
            />

            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        {title}
                    </h1>
                    <p className="text-muted-foreground mt-1 font-mono text-sm">
                        {propertyId}
                    </p>
                </div>

                <span
                    className={cn(
                        "rounded-md px-3 py-1 text-sm font-semibold",
                        propertyStatusBadgeClass(status),
                    )}
                >
                    {propertyStatusLabel(status)}
                </span>
            </div>

            <Card className="border-border/80">
                <CardHeader>
                    <CardTitle>Property information</CardTitle>
                    <CardDescription>
                        View-only property information. Property management is
                        restricted to administrators.
                    </CardDescription>
                </CardHeader>

                <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <DetailField label="Property type" value={property.property_type} />
                    <DetailField label="Province" value={property.province} />
                    <DetailField
                        label="City / Municipality"
                        value={property.city_municipality}
                    />
                    <DetailField label="Project" value={property.project} />
                    <DetailField label="Block" value={property.block} />
                    <DetailField label="Lot number" value={property.lot_number} />
                    <DetailField label="Price" value={formatPrice(property.price)} />
                    <DetailField label="Lot area (m²)" value={property.lot_area_sqm} />
                    <DetailField
                        label="Floor area (m²)"
                        value={property.floor_area_sqm}
                    />
                    <DetailField label="Bedrooms" value={property.bedrooms} />
                    <DetailField label="Bathrooms" value={property.bathrooms} />
                    <DetailField label="Parking" value={property.parking} />

                    <div className="space-y-1 sm:col-span-2 lg:col-span-3">
                        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                            Detailed address
                        </p>
                        <p className="text-sm font-medium">
                            {displayValue(property.address)}
                        </p>
                    </div>

                    <div className="space-y-1 sm:col-span-2 lg:col-span-3">
                        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                            Description
                        </p>
                        <p className="whitespace-pre-wrap text-sm">
                            {displayValue(property.description)}
                        </p>
                    </div>

                    <div className="space-y-1 sm:col-span-2 lg:col-span-3">
                        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                            Included features
                        </p>
                        <p className="text-sm">
                            {displayValue(property.included_features)}
                        </p>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card className="border-border/80">
                    <CardHeader>
                        <CardTitle>Main image</CardTitle>
                        <CardDescription>
                            Property images are view-only for Agent accounts.
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <div className="border-border bg-muted/30 flex aspect-video items-center justify-center overflow-hidden rounded-lg border">
                            {mainImageSrc ? (
                                <img
                                    src={mainImageSrc}
                                    alt={title}
                                    className="size-full object-cover"
                                />
                            ) : (
                                <span className="text-muted-foreground text-sm">
                                    No main image available
                                </span>
                            )}
                        </div>

                        {videoUrl ? (
                            <a
                                href={videoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary mt-4 inline-block text-sm font-medium underline-offset-4 hover:underline"
                            >
                                Open property video
                            </a>
                        ) : null}
                    </CardContent>
                </Card>

                <Card className="border-border/80">
                    <CardHeader>
                        <CardTitle>Gallery images</CardTitle>
                        <CardDescription>
                            Gallery management is restricted to administrators.
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        {galleryPaths.length > 0 ? (
                            <div className="grid grid-cols-2 gap-3">
                                {galleryPaths.map((path, index) => {
                                    const imageSrc = publicStorageUrl(path);

                                    return (
                                        <div
                                            key={`${path}-${index}`}
                                            className="border-border overflow-hidden rounded-lg border"
                                        >
                                            {imageSrc ? (
                                                <img
                                                    src={imageSrc}
                                                    alt=""
                                                    className="aspect-square w-full object-cover"
                                                />
                                            ) : (
                                                <div className="bg-muted text-muted-foreground flex aspect-square items-center justify-center text-xs">
                                                    Image unavailable
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-sm">
                                No gallery images available.
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AgentPropertyDetailPage;
