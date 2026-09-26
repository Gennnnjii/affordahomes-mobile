export interface PropertyMapProject {
    project: string;
    total_blocks: number;
    total_lots: number;
}

export interface PropertyMapBlock {
    block: string;
    total_lots: number;
}

export interface PropertyMapLot {
    id: string;
    block: string | null;
    lot_number: string | null;
    status: string;
    lot_area_sqm: string | number | null;
    floor_area_sqm: string | number | null;
    bedrooms: number | null;
    bathrooms: number | null;
    parking: string | null;
}

export interface PropertyMapRootData {
    total_projects: number;
    projects: PropertyMapProject[];
}

export interface PropertyMapProjectData {
    project: string;
    total_blocks: number;
    blocks: PropertyMapBlock[];
}

export interface PropertyMapBlockData {
    project: string;
    block: string;
    total_lots: number;
    lots: PropertyMapLot[];
}

export type PropertyMapData =
    | PropertyMapRootData
    | PropertyMapProjectData
    | PropertyMapBlockData;

export interface PropertyMapParams {
    project?: string;
    block?: string;
}
