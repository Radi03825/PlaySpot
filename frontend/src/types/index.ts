export interface SportComplex {
    id: number;
    name: string;
    address: string;
    city: string;
    description: string;
    manager_id?: number;
    is_verified: boolean;
    is_active: boolean;
}

export interface Facility {
    id: number;
    name: string;
    sport_complex_id?: number;
    category_id: number;
    surface_id: number;
    environment_id: number;
    description: string;
    capacity: number;
    is_verified: boolean;
    is_active: boolean;
}

export interface FacilityDetails extends Facility {
    category_name: string;
    surface_name: string;
    environment_name: string;
    sport_name: string;
    sport_complex_name?: string;
}

