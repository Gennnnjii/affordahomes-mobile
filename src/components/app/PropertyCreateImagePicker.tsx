import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ImagePlusIcon, Trash2Icon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type SelectedImage = {
    id: number;
    file: File;
    previewUrl: string;
};

type PropertyCreateImagePickerProps = {
    idPrefix: string;
    disabled?: boolean;
    onMainImageChange: (file: File) => void;
    onGalleryFilesChange: (files: File[]) => void;
    onValidationError: (message: string) => void;
};

const imageValidationError = (file: File) => {
    if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
        return "Only JPEG, PNG, or WebP images can be selected.";
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
        return "Each image must be 5 MB or smaller.";
    }
    return null;
};

export const PropertyCreateImagePicker = ({
    idPrefix,
    disabled = false,
    onMainImageChange,
    onGalleryFilesChange,
    onValidationError,
}: PropertyCreateImagePickerProps) => {
    const [mainImage, setMainImage] = useState<SelectedImage | null>(null);
    const [galleryImages, setGalleryImages] = useState<SelectedImage[]>([]);
    const mainImageInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);
    const imageIdRef = useRef(0);
    const objectUrlsRef = useRef(new Set<string>());
    const mainImageInputId = `${idPrefix}-main-image`;
    const mainImageHelpId = `${idPrefix}-main-image-help`;
    const galleryInputId = `${idPrefix}-gallery-images`;
    const galleryHelpId = `${idPrefix}-gallery-images-help`;

    useEffect(() => {
        const objectUrls = objectUrlsRef.current;

        return () => {
            objectUrls.forEach((url) => URL.revokeObjectURL(url));
            objectUrls.clear();
        };
    }, []);

    const createSelection = (file: File): SelectedImage => {
        const previewUrl = URL.createObjectURL(file);
        objectUrlsRef.current.add(previewUrl);

        return {
            id: imageIdRef.current++,
            file,
            previewUrl,
        };
    };

    const releaseSelection = (selection: SelectedImage) => {
        URL.revokeObjectURL(selection.previewUrl);
        objectUrlsRef.current.delete(selection.previewUrl);
    };

    const selectMainImage = (file: File | undefined) => {
        if (!file) return;

        const validationError = imageValidationError(file);
        if (validationError) {
            onValidationError(validationError);
            return;
        }

        if (mainImage) releaseSelection(mainImage);
        setMainImage(createSelection(file));
        onMainImageChange(file);
    };

    const addGalleryImages = (files: File[]) => {
        const selections: SelectedImage[] = [];

        files.forEach((file) => {
            const validationError = imageValidationError(file);
            if (validationError) {
                onValidationError(`${file.name}: ${validationError}`);
                return;
            }

            selections.push(createSelection(file));
        });

        if (selections.length === 0) return;

        const nextImages = [...galleryImages, ...selections];
        setGalleryImages(nextImages);
        onGalleryFilesChange(nextImages.map(({ file }) => file));
    };

    const removeGalleryImage = (image: SelectedImage) => {
        releaseSelection(image);
        const nextImages = galleryImages.filter(({ id }) => id !== image.id);
        setGalleryImages(nextImages);
        onGalleryFilesChange(nextImages.map(({ file }) => file));
    };

    return (
        <div className="space-y-5">
            <div className="space-y-3">
                <Label htmlFor={mainImageInputId}>
                    Main image <span className="text-destructive">*</span>
                </Label>
                <div className="border-border bg-muted/30 flex aspect-video items-center justify-center overflow-hidden rounded-lg border">
                    {mainImage ? (
                        <img
                            src={mainImage.previewUrl}
                            alt="Selected main image preview"
                            className="size-full object-cover"
                        />
                    ) : (
                        <span className="text-muted-foreground text-sm">
                            No main image selected
                        </span>
                    )}
                </div>
                <input
                    ref={mainImageInputRef}
                    id={mainImageInputId}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    disabled={disabled}
                    aria-describedby={mainImageHelpId}
                    onChange={(event) => {
                        selectMainImage(event.target.files?.[0]);
                        event.target.value = "";
                    }}
                />
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={disabled}
                    onClick={() => mainImageInputRef.current?.click()}
                >
                    <ImagePlusIcon className="mr-2 size-4" />
                    {mainImage ? "Change image" : "Select main image"}
                </Button>
                {mainImage ? (
                    <p className="text-muted-foreground break-all text-xs">
                        Selected: {mainImage.file.name}
                    </p>
                ) : null}
                <p id={mainImageHelpId} className="text-muted-foreground text-xs">
                    JPEG, PNG, or WebP, up to 5 MB.
                </p>
            </div>

            <div className="space-y-3">
                <Label htmlFor={galleryInputId}>Gallery images</Label>
                <input
                    ref={galleryInputRef}
                    id={galleryInputId}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    disabled={disabled}
                    aria-describedby={galleryHelpId}
                    onChange={(event) => {
                        addGalleryImages(
                            event.target.files ? Array.from(event.target.files) : [],
                        );
                        event.target.value = "";
                    }}
                />
                {galleryImages.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2">
                        {galleryImages.map((image) => (
                            <div
                                key={image.id}
                                className="border-border overflow-hidden rounded-lg border"
                            >
                                <div className="relative">
                                    <img
                                        src={image.previewUrl}
                                        alt={`Selected gallery image: ${image.file.name}`}
                                        className="aspect-square w-full object-cover"
                                    />
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="absolute right-2 top-2 size-8 shadow-md"
                                        disabled={disabled}
                                        aria-label={`Remove ${image.file.name} from selected gallery`}
                                        onClick={() => removeGalleryImage(image)}
                                    >
                                        <Trash2Icon className="size-4" />
                                    </Button>
                                </div>
                                <p
                                    className="text-muted-foreground truncate px-2 py-1.5 text-xs"
                                    title={image.file.name}
                                >
                                    {image.file.name}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground text-sm">
                        No gallery images selected.
                    </p>
                )}
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={disabled}
                    onClick={() => galleryInputRef.current?.click()}
                >
                    <ImagePlusIcon className="mr-2 size-4" />
                    {galleryImages.length > 0 ? "Choose more images" : "Add images"}
                </Button>
                <p id={galleryHelpId} className="text-muted-foreground text-xs">
                    Optional. JPEG, PNG, or WebP, up to 5 MB each. Images upload
                    when the property is created.
                </p>
            </div>
        </div>
    );
};
