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
    sport_complex_id?: number | null;
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

export interface Category {
    id: number;
    name: string;
    sport_id: number;
}

export interface Surface {
    id: number;
    name: string;
    description: string;
}

export interface Environment {
    id: number;
    name: string;
    description: string;
}

export interface CreateSportComplexRequest {
    name: string;
    address: string;
    city: string;
    description: string;
    facilities?: Array<{
        name: string;
        category_id: number;
        surface_id: number;
        environment_id: number;
        description: string;
        capacity: number;
    }>;
}

export interface CreateFacilityRequest {
    name: string;
    sport_complex_id?: number | null;
    category_id: number;
    surface_id: number;
    environment_id: number;
    description: string;
    capacity: number;
}

export interface User {
    id: number;
    name: string;
    email: string;
    role_id: number;
    created_at: string;
    birth_date: string;
    is_email_verified: boolean;
}

