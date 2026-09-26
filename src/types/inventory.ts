export type InventoryLotStatus = "available" | "reserved" | "sold" | "on_hold";

export interface DevelopmentProject {
    id: string;
    project_key: string;
    name: string;
    province: string;
    city_municipality: string;
    address_context: string | null;
}

export interface PropertyModelGalleryImage {
    id: string;
    path: string;
    sort_order: number;
}

export interface PropertyModel {
    id: string;
    development_project_id: string;
    model_key: string;
    name: string;
    description: string;
    floor_area_sqm: string | null;
    bedrooms: number | null;
    bathrooms: number | null;
    parking: string | null;
    included_features: string[] | null;
    base_price: string | null;
    main_image: string | null;
    floor_plan_image: string | null;
    video_url: string | null;
    gallery_images: PropertyModelGalleryImage[];
}

export interface InventoryBlock {
    id: string;
    development_project_id: string;
    canonical_identifier: string;
    display_label: string;
}

export interface InventoryLot {
    id: string;
    inventory_block_id: string;
    property_model_id: string;
    canonical_lot_identifier: string;
    display_lot_identifier: string;
    lot_area_sqm: string | null;
    effective_price: string;
    status: InventoryLotStatus;
    is_available: boolean;
}

export interface InventoryPagination {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
}

export interface PaginatedInventoryResult<T> {
    items: T[];
    pagination: InventoryPagination;
}

interface AdminTimestamps {
    archived_at: string | null;
    created_at: string | null;
    updated_at: string | null;
}

export type AdminDevelopmentProject = DevelopmentProject & AdminTimestamps;

export type AdminPropertyModel = PropertyModel & AdminTimestamps;

export type AdminInventoryBlock = InventoryBlock & AdminTimestamps;

export interface AdminInventoryLot extends InventoryLot, AdminTimestamps {
    price_override: string | null;
    legacy_property_id: string | null;
}

export interface AdminInventoryLotStatusHistoryEntry {
    id: string;
    inventory_lot_id: string;
    old_status: InventoryLotStatus | null;
    new_status: InventoryLotStatus;
    changed_by_role: string;
    changed_by_id: string | null;
    source_type: string | null;
    source_id: string | null;
    reason: string | null;
    created_at: string | null;
    updated_at: string | null;
}

export type InventoryArchiveFilter = "active" | "archived" | "all";

export interface InventoryArchiveFilterParams {
    archived?: InventoryArchiveFilter;
}

export interface InventoryPaginationParams {
    page?: number;
    per_page?: number;
}

export interface InventoryLotListParams extends InventoryPaginationParams {
    property_model_id?: string;
    status?: InventoryLotStatus;
}

export interface AdminInventoryLotListParams extends InventoryLotListParams {
    archived?: InventoryArchiveFilter;
}

export type InventoryLotStatusHistoryParams = InventoryPaginationParams;

export interface CreateDevelopmentProjectPayload {
    project_key: string;
    name: string;
    province: string;
    city_municipality: string;
    address_context?: string | null;
}

export type UpdateDevelopmentProjectPayload = Partial<CreateDevelopmentProjectPayload>;

export interface CreatePropertyModelPayload {
    model_key: string;
    name: string;
    description: string;
    floor_area_sqm?: string | null;
    bedrooms?: number | null;
    bathrooms?: number | null;
    parking?: string | null;
    included_features?: string[] | null;
    base_price?: string | null;
    video_url?: string | null;
}

export type UpdatePropertyModelPayload = Partial<CreatePropertyModelPayload>;

export interface CreateInventoryBlockPayload {
    canonical_identifier: string;
    display_label: string;
}

export type UpdateInventoryBlockPayload = Partial<CreateInventoryBlockPayload>;

export interface CreateInventoryLotPayload {
    canonical_lot_identifier: string;
    display_lot_identifier: string;
    property_model_id: string;
    lot_area_sqm?: string | null;
    price_override?: string | null;
}

export type UpdateInventoryLotPayload = Partial<CreateInventoryLotPayload>;

export interface InventoryLotHoldPayload {
    reason: string;
}
