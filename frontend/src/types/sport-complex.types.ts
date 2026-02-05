export interface Image {
    id: number;
    url: string;
    storage_id?: string;
    storage_provider: string;
    image_type: string;
    reference_id: number;
    owner_id?: number;
    is_primary: boolean;
    uploaded_at: string;
}

export interface SportComplex {
    id: number;
    name: string;
    address: string;
    city: string;
    description: string;
    manager_id?: number;
    is_verified: boolean;
    is_active: boolean;
    images?: Image[];
}
