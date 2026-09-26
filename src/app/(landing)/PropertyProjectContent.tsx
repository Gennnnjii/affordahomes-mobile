import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MinusIcon, PlusIcon, RotateCcwIcon } from "lucide-react";
import { useState } from "react";

type ProjectUnit = {
    name: string;
    description: string;
};

type ProjectMedia = {
    heading: string;
    description: string;
    image: string;
    alt: string;
};

type PropertyProjectContentDefinition = {
    name: string;
    units?: ProjectUnit[];
    floorPlan?: {
        image: string;
        alt: string;
    };
    modelPlans?: ProjectMedia[];
    modelCarousel?: {
        heading: string;
        models: ProjectMedia[];
        containImagesAtFit?: boolean;
    };
    subdivisionMap: ProjectMedia;
    satelliteLocation?: {
        description: string;
        embedUrl: string;
        mapsUrl: string;
    };
    vicinityMap: ProjectMedia;
};

const PROJECT_CONTENT: Record<string, PropertyProjectContentDefinition> = {
    "kaya homes": {
        name: "Kaya Homes",
        units: [
            {
                name: "Kaya Inner Unit",
                description:
                    "Designed for efficient everyday living, the Kaya Inner Unit pairs a 30 sq.m. lot with a 32 sq.m. floor area. Its flexible layout provides space for two bedrooms, one toilet and bath, and practical living and dining areas—an affordable, functional choice for first-time homeowners, couples, or small families.",
            },
            {
                name: "Kaya End Unit",
                description:
                    "The Kaya End Unit offers a 41.25 sq.m. lot with the same 32 sq.m. floor area, including provision for two bedrooms and one toilet and bath. Compared with the inner unit, its larger outdoor area adds privacy, natural light, and ventilation while allowing more flexibility for future expansion or outdoor use—well suited to families who want a little more space.",
            },
        ],
        floorPlan: {
            image: "/property-projects/kaya-homes/kaya-homes-magalang-floor-plan.jpg",
            alt: "Floor plan for the Kaya Homes Inner and End units in Magalang",
        },
        subdivisionMap: {
            heading: "Subdivision Map",
            description:
                "Explore the Kaya Homes subdivision plan to better understand the overall layout of the community, including its residential blocks, road network, open spaces, and key areas within the development.",
            image: "/property-maps/reference/kaya-homes/kaya-homes-masterplan.jpg",
            alt: "Kaya Homes subdivision master plan",
        },
        satelliteLocation: {
            description:
                "Explore the location of Kaya Homes through an interactive satellite view and see the surrounding roads, nearby communities, and access routes around the development.",
            embedUrl:
                "https://www.google.com/maps?q=15.225014,120.626161&t=k&z=16&output=embed",
            mapsUrl:
                "https://www.google.com/maps/search/?api=1&query=15.225014%2C120.626161",
        },
        vicinityMap: {
            heading: "Vicinity Map",
            description:
                "Explore the surrounding area of Kaya Homes and see its connection to major roads, nearby communities, schools, commercial establishments, and other key destinations.",
            image: "/property-projects/kaya-homes/kaya-homes-magalang-vicinity-map.png",
            alt: "Vicinity map showing roads and destinations near Kaya Homes in Magalang",
        },
    },
    "dapdap 1": {
        name: "Dapdap 1",
        modelPlans: [
            {
                heading: "Townhouse",
                description:
                    "Choose from Loft, Loft (EU), 2BR, and 2BR (EU) townhouse variants designed for practical family living. Across the plans, 42 sq.m. and 60 sq.m. lot areas pair with floor areas of about 30 sq.m. and 38.50 sq.m., offering one- and two-bedroom options with one toilet and bath. Each layout makes efficient use of space while balancing everyday comfort and affordability.",
                image: "/property-projects/dapdap-1/dapdap-1-townhouse-floor-plan.jpg",
                alt: "Dapdap 1 Townhouse floor plans and unit variants",
            },
            {
                heading: "Rowhouse",
                description:
                    "Dapdap 1 rowhouse options include Bare, Improved, and End Unit variants, with 36 sq.m. and 45 sq.m. lot areas and 18 sq.m. and 29 sq.m. floor areas shown across the plans. Studio-type and two-bedroom layouts each provide one toilet and bath, giving budget-conscious households an efficient starting point with practical potential for future upgrades.",
                image: "/property-projects/dapdap-1/dapdap-1-rowhouse-floor-plan.jpg",
                alt: "Dapdap 1 Rowhouse floor plans and unit variants",
            },
        ],
        subdivisionMap: {
            heading: "Subdivision Map",
            description:
                "Explore the Dapdap 1 subdivision plan to better understand the overall layout of the community, including its residential blocks, road network, open spaces, and key areas within the development.",
            image: "/property-maps/reference/dapdap-1/dapdap-1-masterplan.jpg",
            alt: "Dapdap 1 subdivision master plan",
        },
        satelliteLocation: {
            description:
                "Explore the location of Dapdap 1 through an interactive satellite view and see the surrounding roads, nearby communities, and access routes around the development.",
            embedUrl:
                "https://www.google.com/maps?q=15.214500,120.619667&t=k&z=16&output=embed",
            mapsUrl:
                "https://www.google.com/maps/search/?api=1&query=15.214500%2C120.619667",
        },
        vicinityMap: {
            heading: "Vicinity Map",
            description:
                "Explore the surrounding area of Dapdap 1 and see its connection to major roads, nearby communities, schools, commercial establishments, and other key destinations.",
            image: "/property-projects/dapdap-1/dapdap-1-vicinity-map.jpg",
            alt: "Dapdap 1 vicinity map showing nearby roads and destinations",
        },
    },
    "porac 2": {
        name: "Porac II",
        modelCarousel: {
            heading: "House Models & Floor Plans",
            containImagesAtFit: true,
            models: [
                {
                    heading: "Duplex 3BR",
                    description:
                        "Set on a 55 sq.m. lot with about 50.47 sq.m. of floor area, the Duplex 3BR provides three bedrooms and one toilet and bath in a practical two-storey layout. Its efficient planning supports comfortable everyday family living without wasting space.",
                    image: "/property-projects/porac-2/porac-2-duplex-3br-floor-plan.jpg",
                    alt: "Porac II Duplex 3BR house model and floor plan",
                },
                {
                    heading: "Duplex 2BR",
                    description:
                        "The Duplex 2BR combines a 55 sq.m. lot with a 46 sq.m. floor area, two bedrooms, and one toilet and bath. Its compact, comfortable arrangement makes practical use of both levels for growing families or first-time homeowners.",
                    image: "/property-projects/porac-2/porac-2-duplex-2br-floor-plan.jpg",
                    alt: "Porac II Duplex 2BR house model and floor plan",
                },
                {
                    heading: "Duplex Loft",
                    description:
                        "The Duplex Loft offers a 55 sq.m. lot and about 36.6 sq.m. of floor area with one bedroom and one toilet and bath. Its open loft-style space creates an efficient, flexible starter home for streamlined everyday living.",
                    image: "/property-projects/porac-2/porac-2-duplex-loft-floor-plan.jpg",
                    alt: "Porac II Duplex Loft house model and floor plan",
                },
                {
                    heading: "Single Attached",
                    description:
                        "With a 70 sq.m. lot and 64.17 sq.m. floor area, the Single Attached model includes three bedrooms and one toilet and bath. The detached-side setting adds privacy and room while supporting a comfortable, family-friendly layout.",
                    image: "/property-projects/porac-2/porac-2-single-attached-floor-plan.jpg",
                    alt: "Porac II Single Attached house model and floor plan",
                },
                {
                    heading: "Couple 3BR",
                    description:
                        "The Couple 3BR pairs a 65 sq.m. lot with 61.61 sq.m. of floor area, three bedrooms, and one toilet and bath. Its well-planned rooms make efficient use of the home for comfortable family routines and shared living.",
                    image: "/property-projects/porac-2/porac-2-couple-3br-floor-plan.jpg",
                    alt: "Porac II Couple 3BR house model and floor plan",
                },
                {
                    heading: "Couple 3BR w/ Carport",
                    description:
                        "Designed on a 65 sq.m. lot with 55.07 sq.m. of floor area, the Couple 3BR w/ Carport provides three bedrooms, one toilet and bath, and dedicated parking. It combines practical family space with the everyday convenience of an integrated carport.",
                    image:
                        "/property-projects/porac-2/porac-2-couple-3br-carport-floor-plan.jpg",
                    alt: "Porac II Couple 3BR with Carport house model and floor plan",
                },
            ],
        },
        subdivisionMap: {
            heading: "Subdivision Map",
            description:
                "Explore the Porac II subdivision plan to better understand the overall layout of the community, including its residential blocks, road network, open spaces, and key areas within the development.",
            image: "/property-maps/reference/porac-2/porac-2-masterplan.jpg",
            alt: "Porac II subdivision master plan",
        },
        satelliteLocation: {
            description:
                "Explore the location of Porac II through an interactive satellite view and see the surrounding roads, nearby communities, and access routes around the development.",
            embedUrl:
                "https://www.google.com/maps?q=15.1172954,120.5619079&t=k&z=16&output=embed",
            mapsUrl:
                "https://www.google.com/maps/search/?api=1&query=15.1172954%2C120.5619079",
        },
        vicinityMap: {
            heading: "Vicinity Map",
            description:
                "Explore the surrounding area of Porac II and see its connection to major roads, nearby communities, schools, commercial establishments, and other key destinations.",
            image: "/property-projects/porac-2/porac-2-vicinity-map.jpg",
            alt: "Porac II vicinity map showing nearby roads and destinations",
        },
    },
    dau: {
        name: "Dau",
        subdivisionMap: {
            heading: "Subdivision Map",
            description:
                "View the Dau subdivision plan for an overview of the community layout.",
            image: "/property-maps/reference/dau/dau-masterplan.jpg",
            alt: "Dau subdivision master plan",
        },
        satelliteLocation: {
            description:
                "Explore the location of Fiesta Communities Dau in Mabalacat City, Pampanga through an interactive satellite view.",
            embedUrl:
                "https://www.google.com/maps?q=15.1930055,120.5937659&t=k&z=16&output=embed",
            mapsUrl:
                "https://www.google.com/maps/search/?api=1&query=15.1930055%2C120.5937659",
        },
        vicinityMap: {
            heading: "Vicinity Map",
            description:
                "View the Dau vicinity map to understand the development's surrounding roads and nearby landmarks.",
            image: "/property-projects/dau/dau-vicinity-map.png",
            alt: "Dau vicinity map showing surrounding roads and nearby landmarks",
        },
    },
};

const PROJECT_CONTENT_ALIASES: Record<string, string> = {
    "porac ii": "porac 2",
    "fiesta communities porac ii": "porac 2",
};

const normalizeProjectName = (project: string | null | undefined) =>
    project?.trim().toLowerCase().replace(/\s+/g, " ") ?? "";

type ZoomableStaticImageProps = {
    heading: string;
    description?: string;
    src: string;
    alt: string;
    containAtFit?: boolean;
};

const ZoomableStaticImage = ({
    heading,
    description,
    src,
    alt,
    containAtFit = false,
}: ZoomableStaticImageProps) => {
    const [zoom, setZoom] = useState(1);
    const [imageAspectRatio, setImageAspectRatio] = useState<string>();

    const adjustZoom = (delta: number) => {
        setZoom((current) => Math.min(5, Math.max(1, current + delta)));
    };

    return (
        <div className="min-w-0 space-y-5">
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1 space-y-2">
                    <h2 className="text-xl font-semibold tracking-tight">{heading}</h2>
                    {description ? (
                        <p className="text-muted-foreground max-w-4xl text-sm leading-relaxed">
                            {description}
                        </p>
                    ) : null}
                </div>
                <div
                    className="flex w-full max-w-full shrink-0 flex-nowrap items-center gap-2 sm:w-auto"
                    aria-label={`${heading} zoom controls`}
                >
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => adjustZoom(-0.25)}
                        disabled={zoom <= 1}
                        aria-label={`Zoom out ${heading}`}
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
                        aria-label={`Zoom in ${heading}`}
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

            <div
                className="border-border/70 max-h-[68vh] w-full min-w-0 overflow-auto overscroll-contain rounded-xl border bg-white touch-pan-x touch-pan-y lg:max-h-[75vh]"
                role="region"
                aria-label={`${heading} image viewer`}
                style={{ aspectRatio: imageAspectRatio }}
            >
                <div
                    className={
                        containAtFit
                            ? "flex min-h-full min-w-full items-center justify-center"
                            : "min-w-full"
                    }
                    style={
                        containAtFit
                            ? { height: `${zoom * 100}%`, width: `${zoom * 100}%` }
                            : { width: `${zoom * 100}%` }
                    }
                >
                    <img
                        src={src}
                        alt={alt}
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                        onLoad={(event) => {
                            const { naturalHeight, naturalWidth } = event.currentTarget;

                            if (naturalHeight > 0 && naturalWidth > 0) {
                                setImageAspectRatio(`${naturalWidth} / ${naturalHeight}`);
                            }
                        }}
                        className={
                            containAtFit
                                ? "block h-full w-full max-w-none select-none object-contain"
                                : "block h-auto w-full max-w-none select-none"
                        }
                    />
                </div>
            </div>
        </div>
    );
};

const ProjectImageSection = ({ media }: { media: ProjectMedia }) => (
    <Card className="border-border/80 overflow-hidden shadow-sm">
        <CardContent className="p-6 sm:p-8">
            <ZoomableStaticImage
                heading={media.heading}
                description={media.description}
                src={media.image}
                alt={media.alt}
            />
        </CardContent>
    </Card>
);

const ProjectModelCarousel = ({
    heading,
    models,
    containImagesAtFit,
}: {
    heading: string;
    models: ProjectMedia[];
    containImagesAtFit?: boolean;
}) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const activeModel = models[activeIndex];

    if (!activeModel) return null;

    const showPrevious = () => {
        setActiveIndex((current) => (current - 1 + models.length) % models.length);
    };

    const showNext = () => {
        setActiveIndex((current) => (current + 1) % models.length);
    };

    return (
        <Card className="border-border/80 overflow-hidden shadow-sm">
            <CardContent className="min-w-0 space-y-5 p-6 sm:p-8">
                <div className="flex items-center justify-between gap-4">
                    <h2 className="min-w-0 text-xl font-semibold tracking-tight">{heading}</h2>
                    <span
                        className="text-muted-foreground shrink-0 text-sm font-medium"
                        aria-live="polite"
                    >
                        {activeIndex + 1} / {models.length}
                    </span>
                </div>

                <ZoomableStaticImage
                    key={activeModel.heading}
                    heading={activeModel.heading}
                    description={activeModel.description}
                    src={activeModel.image}
                    alt={activeModel.alt}
                    containAtFit={containImagesAtFit}
                />

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={showPrevious}
                        aria-label="Show previous house model"
                    >
                        Previous
                    </Button>

                    <div
                        className="flex flex-wrap items-center justify-center gap-2"
                        aria-label="Choose a house model"
                    >
                        {models.map((model, index) => (
                            <button
                                key={model.heading}
                                type="button"
                                onClick={() => setActiveIndex(index)}
                                aria-label={`Show ${model.heading}`}
                                aria-current={index === activeIndex ? "true" : undefined}
                                className={`size-3 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                                    index === activeIndex
                                        ? "bg-primary"
                                        : "bg-muted-foreground/30 hover:bg-muted-foreground/60"
                                }`}
                            />
                        ))}
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={showNext}
                        aria-label="Show next house model"
                    >
                        Next
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export const PropertyProjectContent = ({ project }: { project: string | null | undefined }) => {
    const normalizedProjectName = normalizeProjectName(project);
    const content =
        PROJECT_CONTENT[PROJECT_CONTENT_ALIASES[normalizedProjectName] ?? normalizedProjectName];

    if (!content) return null;

    return (
        <section className="space-y-6" aria-label={`${content.name} project information`}>
            {content.units && content.floorPlan ? (
                <Card className="border-border/80 overflow-hidden shadow-sm">
                    <CardContent className="space-y-7 p-6 sm:p-8">
                        <div className="grid gap-4 md:grid-cols-2">
                            {content.units.map((unit) => (
                                <article
                                    key={unit.name}
                                    className="border-border/70 bg-muted/20 min-w-0 rounded-xl border p-5 sm:p-6"
                                >
                                    <h2 className="text-xl font-semibold tracking-tight">
                                        {unit.name}
                                    </h2>
                                    <p className="text-muted-foreground mt-3 text-sm leading-7">
                                        {unit.description}
                                    </p>
                                </article>
                            ))}
                        </div>

                        <div className="border-border/70 border-t pt-7">
                            <ZoomableStaticImage
                                heading="Floor Plan"
                                src={content.floorPlan.image}
                                alt={content.floorPlan.alt}
                            />
                        </div>
                    </CardContent>
                </Card>
            ) : null}

            {content.modelPlans?.map((modelPlan) => (
                <ProjectImageSection key={modelPlan.heading} media={modelPlan} />
            ))}

            {content.modelCarousel ? (
                <ProjectModelCarousel
                    heading={content.modelCarousel.heading}
                    models={content.modelCarousel.models}
                    containImagesAtFit={content.modelCarousel.containImagesAtFit}
                />
            ) : null}

            <ProjectImageSection media={content.subdivisionMap} />

            {content.satelliteLocation ? (
                <Card className="border-border/80 overflow-hidden shadow-sm">
                    <CardContent className="space-y-5 p-6 sm:p-8">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0 space-y-2">
                                <h2 className="text-xl font-semibold tracking-tight">
                                    Satellite Location
                                </h2>
                                <p className="text-muted-foreground max-w-4xl text-sm leading-relaxed">
                                    {content.satelliteLocation.description}
                                </p>
                            </div>
                            <Button asChild variant="outline" className="w-full shrink-0 sm:w-auto">
                                <a
                                    href={content.satelliteLocation.mapsUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Open Google Maps
                                </a>
                            </Button>
                        </div>
                        <div className="border-border/70 h-[300px] w-full min-w-0 overflow-hidden rounded-xl border bg-muted sm:h-[360px] lg:h-[460px]">
                            <iframe
                                src={content.satelliteLocation.embedUrl}
                                title={`Satellite map showing the ${content.name} development area`}
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                allowFullScreen
                                className="block h-full w-full min-w-0 border-0"
                            />
                        </div>
                    </CardContent>
                </Card>
            ) : null}

            <ProjectImageSection media={content.vicinityMap} />
        </section>
    );
};
