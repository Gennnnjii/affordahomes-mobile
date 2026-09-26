import type { PropertySitePlan } from "@/types/property-site-plan";

const referenceImage =
    "/property-maps/reference/dapdap-1/dapdap-1-masterplan.jpg";

export const dapdap1SitePlan: PropertySitePlan = {
    id: "dapdap-1",
    name: "Dapdap 1",
    description:
        "Explore the Dapdap 1 subdivision layout and discover the arrangement of its residential blocks, roads, and community areas.",
    viewBox: [0, 0, 1500, 980],
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
