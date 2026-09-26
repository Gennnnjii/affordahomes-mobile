export type PropertySitePlanPoint = readonly [x: number, y: number];

export interface PropertySitePlanLabel {
    x: number;
    y: number;
}

export interface PropertySitePlanSection {
    key: string;
    name: string;
    points?: readonly PropertySitePlanPoint[];
    label?: PropertySitePlanLabel;
}

export interface PropertySitePlanRoad {
    key: string;
    path: string;
    width?: number;
    label?: PropertySitePlanLabel & { text: string };
}

export interface PropertySitePlanBlock {
    key: string;
    section: string;
    block: string;
    label: PropertySitePlanLabel;
}

export interface PropertySitePlanLot {
    key: string;
    section: string;
    block: string;
    lotNumber: string;
    points: readonly PropertySitePlanPoint[];
    label?: PropertySitePlanLabel;
    backendProject?: string;
}

export interface PropertySitePlan {
    id: string;
    name: string;
    description?: string;
    viewBox: readonly [minX: number, minY: number, width: number, height: number];
    backendProject: string | null;
    geometryStatus: "pending" | "partial" | "complete";
    expectedReferenceImagePath: string;
    referenceImage?: string;
    showListingStatusLegend?: boolean;
    sections: readonly PropertySitePlanSection[];
    blocks: readonly PropertySitePlanBlock[];
    roads: readonly PropertySitePlanRoad[];
    lots: readonly PropertySitePlanLot[];
}

export interface PropertyMapDefinition {
    id: string;
    name: string;
    description: string;
    availability: "coming-soon" | "digitizing" | "available";
    sitePlan?: PropertySitePlan;
}
