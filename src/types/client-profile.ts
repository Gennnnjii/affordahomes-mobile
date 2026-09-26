export interface ClientProfileData {
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    profile_picture: string | null;
}

export interface UpdateClientProfilePayload {
    first_name: string;
    last_name: string;
    phone: string | null;
}
