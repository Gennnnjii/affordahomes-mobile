import { adminResourceApi } from "@/db/api/admin.api";
import { getApiErrorMessage } from "@/lib/api-error";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { SubmitOverlay } from "@/components/app/SubmitOverlay";
import { PropertyCreateImagePicker } from "@/components/app/PropertyCreateImagePicker";
import { PropertyLocationFields } from "@/components/app/PropertyLocationFields";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import { ScreenBackLink } from "@/components/navigation/ScreenBackLink";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { buildPropertyCreateFormData } from "@/lib/property-form-data";
import { usePampangaLocations } from "@/hooks/use-pampanga-locations";
import { projectsForCity } from "@/lib/pampanga-location";
import { PropertyStatusSelect, type PropertyStatusValue } from "@/components/app/PropertyStatusSelect";
import { useState } from "react";
import { toast } from "sonner";

const AdminPropertyCreatePage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const locationsQuery = usePampangaLocations();
    const locationCatalog = locationsQuery.data?.data;

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [address, setAddress] = useState("");
    const [price, setPrice] = useState("");
    const [status, setStatus] = useState<PropertyStatusValue>("available");
    const [mainImage, setMainImage] = useState<File | null>(null);
    const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
    const [propertyType, setPropertyType] = useState("");
    const [city, setCity] = useState("");
    const [project, setProject] = useState("");
    const [block, setBlock] = useState("");
    const [lotNumber, setLotNumber] = useState("");
    const [lotArea, setLotArea] = useState("");
    const [floorArea, setFloorArea] = useState("");
    const [bedrooms, setBedrooms] = useState("");
    const [bathrooms, setBathrooms] = useState("");
    const [parking, setParking] = useState("");
    const [featuresText, setFeaturesText] = useState("");
    const [videoUrl, setVideoUrl] = useState("");

    const mut = useMutation({
        mutationFn: () => {
            if (!mainImage) throw new Error("Main image is required.");
            if (!city || !project || !projectsForCity(locationCatalog, city).includes(project)) {
                throw new Error("Select a valid city / municipality and project.");
            }
            const featureLines = featuresText
                .split("\n")
                .map((l) => l.trim())
                .filter(Boolean);
            return adminResourceApi.createProperty(
                buildPropertyCreateFormData({
                    title,
                    description,
                    address,
                    price: Number(price),
                    status,
                    mainImage,
                    galleryFiles,
                    details: {
                        property_type: propertyType || undefined,
                        city_municipality: city,
                        project: project || undefined,
                        block: block || undefined,
                        lot_number: lotNumber || undefined,
                        lot_area_sqm: lotArea || undefined,
                        floor_area_sqm: floorArea || undefined,
                        bedrooms: bedrooms || undefined,
                        bathrooms: bathrooms || undefined,
                        parking: parking || undefined,
                        video_url: videoUrl || undefined,
                        includedFeatures: featureLines.length ? featureLines : undefined,
                    },
                }),
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "properties"] });
            toast.success("Property created.");
            navigate({ to: "/admin/properties" });
        },
        onError: (e) => toast.error(getApiErrorMessage(e)),
    });

    const canSubmit =
        !mut.isPending &&
        !locationsQuery.isPending &&
        !locationsQuery.isError &&
        !!locationCatalog &&
        !!city &&
        !!project &&
        projectsForCity(locationCatalog, city).includes(project) &&
        !!mainImage &&
        !!title.trim() &&
        !!description.trim() &&
        !!address.trim() &&
        price !== "";

    return (
        <div className="space-y-6">
            <ScreenBackLink to="/admin/properties" label="Properties" hideFrom="md" />

            <div className="grid gap-6 lg:grid-cols-[1fr_340px]">

                <Card className="border-border/80 relative overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-xl">Create property</CardTitle>
                        <CardDescription>Add a new unit to the property inventory.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">

                        <div className="grid gap-5 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Title</Label>
                                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Property type</Label>
                                <Input
                                    value={propertyType}
                                    onChange={(e) => setPropertyType(e.target.value)}
                                    placeholder="e.g. Row House End Unit"
                                />
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
                            idPrefix="admin-create-location"
                            required
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

                        <Separator />

                        <div className="grid gap-5 sm:grid-cols-3">
                            <div className="space-y-2">
                                <Label>Price</Label>
                                <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
                            </div>
                            <PropertyStatusSelect value={status} onChange={setStatus} />
                            <div className="space-y-2">
                                <Label>Parking</Label>
                                <Input
                                    value={parking}
                                    onChange={(e) => setParking(e.target.value)}
                                    placeholder="Optional"
                                />
                            </div>
                        </div>

                        <div className="grid gap-5 sm:grid-cols-4">
                            <div className="space-y-2">
                                <Label>Lot area (m²)</Label>
                                <Input type="number" value={lotArea} onChange={(e) => setLotArea(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Floor area (m²)</Label>
                                <Input type="number" value={floorArea} onChange={(e) => setFloorArea(e.target.value)} />
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
                                placeholder={"One feature per line, e.g.\nLiving Area\nTiled Flooring"}
                            />
                        </div>
                    </CardContent>
                    <SubmitOverlay show={mut.isPending} />
                </Card>

                <div className="flex flex-col gap-6 lg:self-start">
                    <Card className="border-border/80">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Images</CardTitle>
                            <CardDescription>Main image is required to publish the listing.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <PropertyCreateImagePicker
                                idPrefix="admin-property-create"
                                disabled={mut.isPending}
                                onMainImageChange={setMainImage}
                                onGalleryFilesChange={setGalleryFiles}
                                onValidationError={(message) => toast.error(message)}
                            />
                        </CardContent>
                    </Card>

                    <Card className="border-border/80">
                        <CardContent className="pt-6">
                            <Button
                                className="w-full"
                                size="lg"
                                onClick={() => mut.mutate()}
                                disabled={!canSubmit}
                            >
                                Create property
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default AdminPropertyCreatePage;
