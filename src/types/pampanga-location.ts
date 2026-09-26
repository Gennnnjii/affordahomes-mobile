export interface PampangaLocationCatalog {
    province: string;
    city_municipalities: string[];
    projects_by_city: Record<string, string[]>;
}
