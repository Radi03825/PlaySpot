import type { Image } from './sport-complex.types';

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
    city?: string;
    address?: string;
    manager_id?: number;
    manager_name?: string;
    manager_email?: string;
    images?: Image[];
}

export interface Category {
    id: number;
    name: string;
    sport_id: number;
}

export interface Sport {
    id: number;
    name: string;
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
    image_urls?: string[];
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
    city?: string;
    address?: string;
    image_urls?: string[];
}
