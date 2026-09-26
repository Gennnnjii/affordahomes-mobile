import { Button } from "@/components/ui/button";
import type { PropertySitePlan } from "@/types/property-site-plan";
import { MinusIcon, PlusIcon, RotateCcwIcon } from "lucide-react";
import { useState } from "react";

interface PropertySitePlanViewerProps {
    sitePlan: PropertySitePlan;
}

export const PropertySitePlanViewer = ({ sitePlan }: PropertySitePlanViewerProps) => {
    const [zoom, setZoom] = useState(1);
    const [failedImage, setFailedImage] = useState<string | null>(null);
    const [imageAspectRatio, setImageAspectRatio] = useState<string>();
    const referenceImage = sitePlan.referenceImage;
    const imageUnavailable = !referenceImage || failedImage === referenceImage;

    const adjustZoom = (delta: number) => {
        setZoom((current) => Math.min(5, Math.max(1, current + delta)));
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                        <h2 className="break-words text-xl font-semibold">
                            {sitePlan.name} site plan
                        </h2>
                        {sitePlan.description ? (
                            <p className="text-muted-foreground mt-1 max-w-3xl text-sm leading-relaxed">
                                {sitePlan.description}
                            </p>
                        ) : null}
                    </div>
                    <div
                        className="flex flex-wrap items-center gap-2"
                        aria-label="Map zoom controls"
                    >
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => adjustZoom(-0.25)}
                            disabled={zoom <= 1}
                            aria-label="Zoom out"
                        >
                            <MinusIcon className="size-4" aria-hidden />
                        </Button>
                        <span className="text-muted-foreground min-w-12 text-center text-sm">
                            {Math.round(zoom * 100)}%
                        </span>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => adjustZoom(0.25)}
                            disabled={zoom >= 5}
                            aria-label="Zoom in"
                        >
                            <PlusIcon className="size-4" aria-hidden />
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                            onClick={() => setZoom(1)}
                            disabled={zoom === 1}
                        >
                            <RotateCcwIcon className="size-4" aria-hidden />
                            Fit
                        </Button>
                    </div>
                </div>

                {sitePlan.sections.length > 0 ? (
                    <div
                        className="flex flex-wrap gap-2"
                        aria-label={`${sitePlan.name} sections`}
                    >
                        {sitePlan.sections.map((section) => (
                            <span
                                key={section.key}
                                className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-xs font-medium"
                            >
                                Section {section.name}
                            </span>
                        ))}
                    </div>
                ) : null}
            </div>

            <div
                className="min-w-0 overflow-hidden rounded-xl border bg-card shadow-sm"
                role="region"
                aria-label={`${sitePlan.name} static site plan viewer`}
            >
                {imageUnavailable ? (
                    <div className="text-muted-foreground flex min-h-64 items-center justify-center p-6 text-center text-sm">
                        The {sitePlan.name} reference site plan is currently unavailable.
                    </div>
                ) : (
                    <div
                        className="max-h-[75vh] w-full min-w-0 overflow-auto overscroll-contain touch-pan-x touch-pan-y"
                        style={{ aspectRatio: imageAspectRatio }}
                    >
                        <div className="min-w-full" style={{ width: `${zoom * 100}%` }}>
                            <img
                                src={referenceImage}
                                alt={`${sitePlan.name} subdivision site plan`}
                                className="block h-auto w-full max-w-none select-none"
                                draggable={false}
                                onLoad={(event) => {
                                    const { naturalHeight, naturalWidth } = event.currentTarget;

                                    if (naturalHeight > 0 && naturalWidth > 0) {
                                        setImageAspectRatio(`${naturalWidth} / ${naturalHeight}`);
                                    }
                                }}
                                onError={() => setFailedImage(referenceImage)}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
