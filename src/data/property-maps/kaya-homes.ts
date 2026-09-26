import type { PropertySitePlan } from "@/types/property-site-plan";

const referenceImage =
    "/property-maps/reference/kaya-homes/kaya-homes-masterplan.jpg";

export const kayaHomesSitePlan: PropertySitePlan = {
    id: "kaya-homes",
    name: "Kaya Homes",
    description:
        "Explore the Kaya Homes subdivision layout and get a clear overview of its streets, blocks, residential areas, and community spaces.",
    viewBox: [0, 0, 1800, 1800],
    backendProject: null,
    geometryStatus: "pending",
    expectedReferenceImagePath: referenceImage,
    referenceImage,
    showListingStatusLegend: true,
    sections: [],
    blocks: [],
    roads: [],
    lots: [],
};
