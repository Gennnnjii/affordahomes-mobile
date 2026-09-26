import { adminResourceApi } from "@/db/api/admin.api";
import { asRecord, idStr, str } from "@/lib/record";
import { getApiErrorMessage } from "@/lib/api-error";
import { publicStorageUrl } from "@/lib/storage-url";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate, useParams } from "@tanstack/react-router";
import { ScreenBackLink } from "@/components/navigation/ScreenBackLink";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ImagePlus, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SubmitOverlay } from "@/components/app/SubmitOverlay";
import { PropertyLocationFields } from "@/components/app/PropertyLocationFields";
import { PropertyStatusSelect, normalizePropertyStatus, type PropertyStatusValue } from "@/components/app/PropertyStatusSelect";
import { usePampangaLocations } from "@/hooks/use-pampanga-locations";
import { isCanonicalLocation, projectsForCity } from "@/lib/pampanga-location";

type GalleryEntry = { id: string; path: string };

const parseGalleryEntries = (raw: unknown): GalleryEntry[] => {
    if (!Array.isArray(raw)) return [];
    const out: GalleryEntry[] = [];
    for (const item of raw) {
        const o = asRecord(item);
        const id = idStr(o.id);
        const path = str(o.path);
        if (id && path) out.push({ id, path });
    }
    return out;
};

const PropertyUpdateSkeleton = () => (
    <div className="space-y-6 pb-12">
        <Skeleton className="h-8 w-40" />
        <div className="space-y-1">
            <Skeleton className="h-7 w-44" />
            <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">

            <Card className="border-border/80">
                <CardHeader>
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="mt-1 h-4 w-60" />
                </CardHeader>
                <CardContent className="space-y-5">
                    <div className="grid gap-5 sm:grid-cols-2">
                        {Array.from({ length: 2 }).map((_, i) => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-9 w-full" />
                            </div>
                        ))}
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-20 w-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-9 w-full" />
                    </div>
                    <div className="grid gap-5 sm:grid-cols-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="h-4 w-16" />
                                <Skeleton className="h-9 w-full" />
                            </div>
                        ))}
                    </div>
                    <div className="grid gap-5 sm:grid-cols-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="h-4 w-16" />
                                <Skeleton className="h-9 w-full" />
                            </div>
                        ))}
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-28 w-full" />
                    </div>
                    <Skeleton className="h-px w-full" />
                    <Skeleton className="h-10 w-28" />
                </CardContent>
            </Card>

            <div className="space-y-4 lg:self-start">
                <Card className="border-border/80">
                    <CardHeader>
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="mt-1 h-4 w-56" />
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <Skeleton className="aspect-video w-full rounded-lg" />
                        <Skeleton className="h-px w-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-14" />
                            <div className="grid grid-cols-2 gap-3">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <Skeleton key={i} className="aspect-square rounded-lg" />
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
);

const AdminPropertyUpdatePage = () => {
    const { propertyId } = useParams({ strict: false }) as { propertyId: string };
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const locationsQuery = usePampangaLocations();
    const locationCatalog = locationsQuery.data?.data;

    const propsQ = useQuery({
        queryKey: ["admin", "properties"],
        queryFn: () => adminResourceApi.properties(),
    });

    const row = (propsQ.data?.data as unknown[] | undefined)?.find(
        (r) => idStr(asRecord(r).id) === propertyId,
    );
    const propertyRecord = asRecord(row);
    const persistedStatus = normalizePropertyStatus(str(propertyRecord.status));
    const persistedTitle = str(propertyRecord.title)?.trim() || "this property";
    const assignedAgent = asRecord(propertyRecord.agent);
    const assignedAgentId = idStr(assignedAgent.id) || idStr(propertyRecord.agent_id);
    const assignedAgentFirstName = str(assignedAgent.first_name)?.trim() ?? "";
    const assignedAgentLastName = str(assignedAgent.last_name)?.trim() ?? "";
    const assignedAgentName = `${assignedAgentFirstName} ${assignedAgentLastName}`.trim();
    const assignedAgentEmail = str(assignedAgent.email)?.trim() ?? "";
    const hasAssignedAgentDetails = Boolean(
        idStr(assignedAgent.id) || assignedAgentName || assignedAgentEmail,
    );
    const isPersistedReserved = persistedStatus === "reserved";

    const [title, setTitle] = useState("");
    const [propertyType, setPropertyType] = useState("");
    const [locationSelection, setLocationSelection] = useState<{
        propertyId: string;
        city: string;
        project: string;
    } | null>(null);
    const [block, setBlock] = useState("");
    const [lotNumber, setLotNumber] = useState("");
    const [description, setDescription] = useState("");
    const [address, setAddress] = useState("");
    const [lotArea, setLotArea] = useState("");
    const [floorArea, setFloorArea] = useState("");
    const [bedrooms, setBedrooms] = useState("");
    const [bathrooms, setBathrooms] = useState("");
    const [parking, setParking] = useState("");
    const [featuresText, setFeaturesText] = useState("");
    const [videoUrl, setVideoUrl] = useState("");
    const [price, setPrice] = useState("");
    const [status, setStatus] = useState<PropertyStatusValue>("available");
    const [galleryAddFiles, setGalleryAddFiles] = useState<File[]>([]);
    const [newMainImage, setNewMainImage] = useState<File | null>(null);
    const [mainPreviewUrl, setMainPreviewUrl] = useState<string | null>(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const mainImageInputRef = useRef<HTMLInputElement>(null);
    const initializedPropertyRef = useRef<string | null>(null);

    useEffect(() => {
        if (!row || initializedPropertyRef.current === propertyId) return;
        const r = asRecord(row);
        setTitle(str(r.title) ?? "");
        setPropertyType(str(r.property_type) ?? "");
        setBlock(str(r.block) ?? "");
        setLotNumber(str(r.lot_number) ?? "");
        setDescription(str(r.description) ?? "");
        setAddress(str(r.address) ?? "");
        setLotArea(r.lot_area_sqm != null && r.lot_area_sqm !== "" ? String(r.lot_area_sqm) : "");
        setFloorArea(r.floor_area_sqm != null && r.floor_area_sqm !== "" ? String(r.floor_area_sqm) : "");
        setBedrooms(r.bedrooms != null && r.bedrooms !== "" ? String(r.bedrooms) : "");
        setBathrooms(r.bathrooms != null && r.bathrooms !== "" ? String(r.bathrooms) : "");
        setParking(str(r.parking) ?? "");
        const feats = r.included_features;
        setFeaturesText(Array.isArray(feats) ? feats.map((x) => String(x)).join("\n") : "");
        setVideoUrl(str(r.video_url) ?? "");
        setPrice(r.price != null ? String(r.price) : "");
        setStatus(normalizePropertyStatus(str(r.status)));
        initializedPropertyRef.current = propertyId;
    }, [propertyId, row]);

    const persistedProvince = str(propertyRecord.province);
    const persistedCity = str(propertyRecord.city_municipality);
    const persistedProject = str(propertyRecord.project);
    const hasCanonicalPersistedLocation = isCanonicalLocation(
        locationCatalog,
        persistedProvince,
        persistedCity,
        persistedProject,
    );
    const defaultCity = hasCanonicalPersistedLocation ? (persistedCity ?? "") : "";
    const defaultProject = hasCanonicalPersistedLocation ? (persistedProject ?? "") : "";
    const city =
        locationSelection?.propertyId === propertyId ? locationSelection.city : defaultCity;
    const project =
        locationSelection?.propertyId === propertyId
            ? locationSelection.project
            : defaultProject;
    const setCity = (nextCity: string) =>
        setLocationSelection((previous) => ({
            propertyId,
            city: nextCity,
            project:
                previous?.propertyId === propertyId ? previous.project : defaultProject,
        }));
    const setProject = (nextProject: string) =>
        setLocationSelection((previous) => ({
            propertyId,
            city: previous?.propertyId === propertyId ? previous.city : defaultCity,
            project: nextProject,
        }));
    const hasLocationSelection = Boolean(city || project);
    const locationSelectionIsValid =
        !hasLocationSelection ||
        Boolean(city && project && projectsForCity(locationCatalog, city).includes(project));

    const mainSrc = row ? publicStorageUrl(str(asRecord(row).main_image)) : undefined;
    const galleryEntries = useMemo(() => {
        if (!row) return [];
        return parseGalleryEntries(asRecord(row).gallery_image_entries);
    }, [row]);

    const legacyGalleryPaths = useMemo(() => {
        if (!row) return [];
        const raw = asRecord(row).gallery_images;
        if (!Array.isArray(raw)) return [];
        return raw.filter((x): x is string => typeof x === "string");
    }, [row]);

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ["admin", "properties"] });
    };

    const saveMut = useMutation({
        mutationFn: () => {
            if (!locationSelectionIsValid) {
                throw new Error("Select both a valid city / municipality and matching project.");
            }

            const locationUpdate =
                city && project
                    ? {
                          city_municipality: city,
                          project,
                      }
                    : {};

            return adminResourceApi.updateProperty(propertyId, {
                title,
                property_type: propertyType.trim() || null,
                block: block.trim() || null,
                lot_number: lotNumber.trim() || null,
                description,
                address,
                lot_area_sqm: lotArea.trim() === "" ? null : Number(lotArea),
                floor_area_sqm: floorArea.trim() === "" ? null : Number(floorArea),
                bedrooms: bedrooms.trim() === "" ? null : Number(bedrooms),
                bathrooms: bathrooms.trim() === "" ? null : Number(bathrooms),
                parking: parking.trim() || null,
                video_url: videoUrl.trim() || null,
                included_features: featuresText
                    .split("\n")
                    .map((l) => l.trim())
                    .filter(Boolean),
                price: Number(price),
                status,
                ...locationUpdate,
            });
        },
        onSuccess: () => {
            invalidate();
            toast.success("Property saved.");
        },
        onError: (e) => toast.error(getApiErrorMessage(e)),
    });

    const deletePropertyMut = useMutation({
        mutationFn: () => adminResourceApi.deleteProperty(propertyId),
        onSuccess: (response) => {
            invalidate();
            setIsDeleteOpen(false);
            toast.success(response.message || "Property deleted.");
            navigate({ to: "/admin/properties" });
        },
        onError: (error) => toast.error(getApiErrorMessage(error)),
    });

    const deleteGalleryMut = useMutation({
        mutationFn: (imageId: string) => adminResourceApi.deletePropertyGalleryImage(propertyId, imageId),
        onSuccess: () => {
            invalidate();
            toast.success("Gallery image removed.");
        },
        onError: (e) => toast.error(getApiErrorMessage(e)),
    });

    const mainImageMut = useMutation({
        mutationFn: () => {
            if (!newMainImage) throw new Error("No file selected.");
            return adminResourceApi.updatePropertyMainImage(propertyId, newMainImage);
        },
        onSuccess: () => {
            invalidate();
            setNewMainImage(null);
            if (mainPreviewUrl) URL.revokeObjectURL(mainPreviewUrl);
            setMainPreviewUrl(null);
            if (mainImageInputRef.current) mainImageInputRef.current.value = "";
            toast.success("Main image updated.");
        },
        onError: (e) => toast.error(getApiErrorMessage(e)),
    });

    const addGalleryMut = useMutation({
        mutationFn: (files: File[]) => {
            const fd = new FormData();
            files.forEach((file, i) => {
                fd.append(`gallery_images[${i}]`, file);
            });
            return adminResourceApi.appendPropertyGallery(propertyId, fd);
        },
        onSuccess: () => {
            invalidate();
            setGalleryAddFiles([]);
            toast.success("Gallery images added.");
        },
        onError: (e) => toast.error(getApiErrorMessage(e)),
    });

    if (propsQ.isPending) return <PropertyUpdateSkeleton />;
    if (!row) return <p className="text-destructive">Property not found.</p>;

    return (
        <div className="space-y-6 pb-12">
            <ScreenBackLink to="/admin/properties" label="Properties" hideFrom="md" />

            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Update property</h1>
                <p className="text-muted-foreground mt-1 font-mono text-sm">{propertyId}</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_360px]">

                <Card className="border-border/80 relative overflow-hidden">
                    <CardHeader>
                        <CardTitle>Details</CardTitle>
                        <CardDescription>
                            Listing information shown to clients and on the public site.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="grid gap-5 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Title</Label>
                                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Property type</Label>
                                <Input value={propertyType} onChange={(e) => setPropertyType(e.target.value)} />
                            </div>
                        </div>

                        <PropertyLocationFields
                            catalog={locationCatalog}
                            city={city}
                            project={project}
                            onCityChange={setCity}
                            onProjectChange={setProject}
                            isLoading={locationsQuery.isPending}
                            isError={locationsQuery.isError}
                            onRetry={() => void locationsQuery.refetch()}
                            idPrefix="admin-update-location"
                            showHistoricalLocation={
                                Boolean(locationCatalog) && !hasCanonicalPersistedLocation
                            }
                            historicalProvince={persistedProvince}
                            historicalCity={persistedCity}
                            historicalProject={persistedProject}
                        />

                        <div className="grid gap-5 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Block</Label>
                                <Input
                                    value={block}
                                    onChange={(e) => setBlock(e.target.value)}
                                    placeholder="e.g. 3"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Lot number</Label>
                                <Input
                                    value={lotNumber}
                                    onChange={(e) => setLotNumber(e.target.value)}
                                    placeholder="e.g. 5"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Detailed address</Label>
                            <Input value={address} onChange={(e) => setAddress(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>
                                Video URL{" "}
                                <span className="text-muted-foreground font-normal">(optional — YouTube or direct link)</span>
                            </Label>
                            <Input
                                type="url"
                                value={videoUrl}
                                onChange={(e) => setVideoUrl(e.target.value)}
                                placeholder="https://www.youtube.com/watch?v=..."
                            />
                        </div>
                        <div className="grid gap-5 sm:grid-cols-3">
                            <div className="space-y-2">
                                <Label>Price</Label>
                                <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
                            </div>
                            <PropertyStatusSelect value={status} onChange={setStatus} />
                            <div className="space-y-2">
                                <Label>Parking</Label>
                                <Input value={parking} onChange={(e) => setParking(e.target.value)} />
                            </div>
                        </div>
                        <div className="grid gap-5 sm:grid-cols-4">
                            <div className="space-y-2">
                                <Label>Lot area (m²)</Label>
                                <Input type="number" value={lotArea} onChange={(e) => setLotArea(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Floor area (m²)</Label>
                                <Input
                                    type="number"
                                    value={floorArea}
                                    onChange={(e) => setFloorArea(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Bedrooms</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={bedrooms}
                                    onChange={(e) => setBedrooms(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Bathrooms</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={bathrooms}
                                    onChange={(e) => setBathrooms(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Included features</Label>
                            <Textarea
                                value={featuresText}
                                onChange={(e) => setFeaturesText(e.target.value)}
                                rows={5}
                            />
                        </div>
                        <Separator />
                        <Button
                            onClick={() => saveMut.mutate()}
                            disabled={saveMut.isPending || !locationSelectionIsValid}
                            size="lg"
                        >
                            Save details
                        </Button>
                    </CardContent>
                    <SubmitOverlay show={saveMut.isPending} />
                </Card>

                <div className="flex flex-col gap-6 lg:self-start">
                    {isPersistedReserved ? (
                        <Card className="border-border/80">
                            <CardHeader>
                                <CardTitle>Assigned agent</CardTitle>
                                <CardDescription>
                                    Current assignment from the saved property record.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {hasAssignedAgentDetails ? (
                                    <div className="space-y-1">
                                        <p className="font-medium">
                                            {assignedAgentName || "Agent name unavailable"}
                                        </p>
                                        <p className="text-muted-foreground text-sm">
                                            {assignedAgentEmail || "Agent email unavailable"}
                                        </p>
                                        {assignedAgentId ? (
                                            <p className="text-muted-foreground font-mono text-xs">
                                                ID: {assignedAgentId}
                                            </p>
                                        ) : null}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-sm">
                                        Assigned agent information is unavailable.
                                    </p>
                                )}
                                <p className="text-muted-foreground mt-4 border-t pt-4 text-xs">
                                    Agent assignments are managed through the reassignment workflow.
                                </p>
                            </CardContent>
                        </Card>
                    ) : null}

                    <Card className="border-border/80 relative overflow-hidden">
                        <CardHeader>
                            <CardTitle>Photos</CardTitle>
                            <CardDescription>
                                Replace the main image or manage gallery images below.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">

                            <div className="space-y-3">
                                <Label>Main image</Label>
                                <div className="border-border bg-muted/30 flex aspect-video items-center justify-center overflow-hidden rounded-lg border">
                                    {mainPreviewUrl ? (
                                        <img src={mainPreviewUrl} alt="" className="size-full object-cover" />
                                    ) : mainSrc ? (
                                        <img src={mainSrc} alt="" className="size-full object-cover" />
                                    ) : (
                                        <span className="text-muted-foreground text-sm">No main image</span>
                                    )}
                                </div>

                                <input
                                    ref={mainImageInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0] ?? null;
                                        setNewMainImage(file);
                                        if (mainPreviewUrl) URL.revokeObjectURL(mainPreviewUrl);
                                        setMainPreviewUrl(file ? URL.createObjectURL(file) : null);
                                    }}
                                />

                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => mainImageInputRef.current?.click()}
                                    >
                                        {newMainImage ? "Change image" : "Replace image"}
                                    </Button>
                                    {newMainImage && (
                                        <Button
                                            type="button"
                                            size="sm"
                                            className="flex-1"
                                            disabled={mainImageMut.isPending}
                                            onClick={() => mainImageMut.mutate()}
                                        >
                                            Upload
                                        </Button>
                                    )}
                                </div>

                                <p className="text-muted-foreground text-xs">
                                    JPEG, PNG, or WebP · max 5 MB. The old image is deleted on upload.
                                </p>
                            </div>

                            <Separator />

                            <div className="space-y-3">
                                <Label>Gallery images</Label>

                                {galleryEntries.length === 0 && legacyGalleryPaths.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-amber-800 dark:text-amber-200 text-sm">
                                            Gallery images are path-only. Deploy the latest API to enable
                                            delete buttons.
                                        </p>
                                        <div className="grid grid-cols-2 gap-3">
                                            {legacyGalleryPaths.map((path) => {
                                                const src = publicStorageUrl(path);
                                                return (
                                                    <div
                                                        key={path}
                                                        className="border-border overflow-hidden rounded-lg border"
                                                    >
                                                        {src && (
                                                            <img
                                                                src={src}
                                                                alt=""
                                                                className="aspect-square w-full object-cover"
                                                            />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {galleryEntries.length === 0 && legacyGalleryPaths.length === 0 && (
                                    <p className="text-muted-foreground text-sm">No gallery images yet.</p>
                                )}

                                {galleryEntries.length > 0 && (
                                    <div className="grid grid-cols-2 gap-3">
                                        {galleryEntries.map((g) => {
                                            const src = publicStorageUrl(g.path);
                                            return (
                                                <div
                                                    key={g.id}
                                                    className="border-border group relative overflow-hidden rounded-lg border"
                                                >
                                                    {src ? (
                                                        <img
                                                            src={src}
                                                            alt=""
                                                            className="aspect-square w-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="bg-muted flex aspect-square items-center justify-center text-xs">
                                                            {g.path}
                                                        </div>
                                                    )}
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="icon"
                                                        className="absolute right-2 top-2 size-8 opacity-90 shadow-md"
                                                        disabled={deleteGalleryMut.isPending}
                                                        onClick={() => {
                                                            if (confirm("Remove this image from the gallery?")) {
                                                                deleteGalleryMut.mutate(g.id);
                                                            }
                                                        }}
                                                        aria-label="Remove gallery image"
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                                    <div className="min-w-0 flex-1 space-y-2">
                                        <Label className="text-muted-foreground">Add images</Label>
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            className="cursor-pointer"
                                            onChange={(e) =>
                                                setGalleryAddFiles(
                                                    e.target.files ? Array.from(e.target.files) : [],
                                                )
                                            }
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        disabled={galleryAddFiles.length === 0 || addGalleryMut.isPending}
                                        onClick={() => addGalleryMut.mutate(galleryAddFiles)}
                                    >
                                        <ImagePlus className="mr-2 size-4" />
                                        Add
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                        <SubmitOverlay show={mainImageMut.isPending || addGalleryMut.isPending} label="Uploading…" />
                    </Card>

                    <Card className="border-destructive/40">
                        <CardHeader>
                            <CardTitle className="text-destructive">Danger zone</CardTitle>
                            <CardDescription>
                                Permanently remove this property from AFFORDAHOMES.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-muted-foreground text-sm">
                                Only available properties without reservation history can be deleted.
                                The server will verify eligibility before deleting anything.
                            </p>
                            <Button
                                type="button"
                                variant="destructive"
                                className="w-full sm:w-auto"
                                disabled={deletePropertyMut.isPending}
                                onClick={() => setIsDeleteOpen(true)}
                            >
                                <Trash2 className="mr-2 size-4" />
                                Delete property
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Dialog
                open={isDeleteOpen}
                onOpenChange={(open) => {
                    if (!deletePropertyMut.isPending) setIsDeleteOpen(open);
                }}
            >
                <DialogContent showCloseButton={!deletePropertyMut.isPending}>
                    <DialogHeader>
                        <DialogTitle>Delete property permanently?</DialogTitle>
                        <DialogDescription>
                            Delete “{persistedTitle}”? This action is permanent and cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <p className="text-muted-foreground text-sm">
                        AFFORDAHOMES only permits deletion when the property is available and has no
                        reservation history. If it is protected, the server will reject this request
                        and explain why.
                    </p>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={deletePropertyMut.isPending}
                            >
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button
                            type="button"
                            variant="destructive"
                            disabled={deletePropertyMut.isPending}
                            onClick={() => deletePropertyMut.mutate()}
                        >
                            {deletePropertyMut.isPending ? "Deleting…" : "Delete property"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminPropertyUpdatePage;
