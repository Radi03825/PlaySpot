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

export interface User {
    id: number;
    name: string;
    email: string;
    role_id: number;
    created_at: string;
    birth_date: string;
    is_email_verified: boolean;
}

export interface AvailableSlot {
    start_time: string;
    end_time: string;
    price_per_hour: number;
    available: boolean;
}

export interface DayAvailability {
    date: string;
    is_open: boolean;
    slots: AvailableSlot[];
}

export interface Reservation {
    id: number;
    user_id: number;
    facility_id: number;
    start_time: string;
    end_time: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    total_price: number;
    created_at: string;
}

export interface CreateReservationRequest {
    facility_id: number;
    start_time: string;
    end_time: string;
}

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

