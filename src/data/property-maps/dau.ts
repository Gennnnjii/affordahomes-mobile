import type { PropertySitePlan } from "@/types/property-site-plan";

const referenceImage = "/property-maps/reference/dau/dau-masterplan.jpg";

export const dauSitePlan: PropertySitePlan = {
    id: "dau",
    name: "Dau",
    description: "View the Dau subdivision plan and its community layout.",
    viewBox: [0, 0, 1275, 1650],
    backendProject: null,
    geometryStatus: "pending",
    expectedReferenceImagePath: referenceImage,
    referenceImage,
    sections: [],
    blocks: [],
    roads: [],
    lots: [],
};
