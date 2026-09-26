export type PropertyDetailFields = {
    property_type?: string;
    city_municipality?: string;
    project?: string;
    block?: string;
    lot_number?: string;
    lot_area_sqm?: string;
    floor_area_sqm?: string;
    bedrooms?: string;
    bathrooms?: string;
    parking?: string;
    video_url?: string;

    includedFeatures?: string[];
};

function appendDetailFields(fd: FormData, d: PropertyDetailFields | undefined) {
    if (!d) return;
    if (d.property_type?.trim()) fd.append("property_type", d.property_type.trim());
    if (d.city_municipality?.trim()) {
        fd.append("city_municipality", d.city_municipality.trim());
    }
    if (d.project?.trim()) fd.append("project", d.project.trim());
    if (d.block?.trim()) fd.append("block", d.block.trim());
    if (d.lot_number?.trim()) fd.append("lot_number", d.lot_number.trim());
    if (d.lot_area_sqm?.trim()) fd.append("lot_area_sqm", d.lot_area_sqm.trim());
    if (d.floor_area_sqm?.trim()) fd.append("floor_area_sqm", d.floor_area_sqm.trim());
    if (d.bedrooms?.trim()) fd.append("bedrooms", d.bedrooms.trim());
    if (d.bathrooms?.trim()) fd.append("bathrooms", d.bathrooms.trim());
    if (d.parking?.trim()) fd.append("parking", d.parking.trim());
    if (d.video_url?.trim()) fd.append("video_url", d.video_url.trim());
    const feats = (d.includedFeatures ?? []).map((s) => s.trim()).filter(Boolean);
    feats.forEach((line, i) => fd.append(`included_features[${i}]`, line));
}

export function buildPropertyCreateFormData(input: {
    agent_id?: string;
    title: string;
    description: string;
    address: string;
    price: number;
    status: string;
    mainImage: File;
    galleryFiles: File[];
    details?: PropertyDetailFields;
}): FormData {
    const fd = new FormData();
    if (input.agent_id) fd.append("agent_id", input.agent_id);
    fd.append("title", input.title);
    fd.append("description", input.description);
    fd.append("address", input.address);
    fd.append("price", String(input.price));
    fd.append("status", input.status);
    fd.append("main_image", input.mainImage);
    input.galleryFiles.forEach((file, i) => {
        fd.append(`gallery_images[${i}]`, file);
    });
    appendDetailFields(fd, input.details);
    return fd;
}
