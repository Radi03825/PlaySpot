// Re-export types from main types file
export type {
    Image,
    SportComplex,
    Facility,
    FacilityDetails,
    Category,
    Sport,
    Surface,
    Environment,
    User,
    AvailableSlot,
    DayAvailability,
    Reservation,
    Event,
    EventParticipant,
    Review,
    ReviewWithUser,
    FacilityReviewStats,
} from '../types';

// API Request/Response types
export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    name: string;
    email: string;
    password: string;
    birth_date: string;
}

export interface GoogleLoginData {
    id_token: string;
    code?: string;
    scope?: string;
}

export interface LinkGoogleAccountData {
    email: string;
    password: string;
    google_id: string;
}

export interface AuthResponse {
    access_token?: string;
    refresh_token?: string;
    token?: string;
    user?: any;
    message?: string;
    exists?: boolean;
    google_id?: string;
}

export interface ChangePasswordData {
    old_password: string;
    new_password: string;
}

export interface ForgotPasswordData {
    email: string;
}

export interface ResetPasswordData {
    token: string;
    new_password: string;
}

export interface CreateSportComplexData {
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
        image_urls?: string[];
        working_hours?: Array<{
            day_type: "weekday" | "weekend";
            open_time: string;
            close_time: string;
        }>;
        pricing?: Array<{
            day_type: "weekday" | "weekend";
            start_hour: string;
            end_hour: string;
            price_per_hour: number;
        }>;
    }>;
}

export interface CreateFacilityData {
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
    working_hours?: Array<{
        day_type: "weekday" | "weekend";
        open_time: string;
        close_time: string;
    }>;
    pricing?: Array<{
        day_type: "weekday" | "weekend";
        start_hour: string;
        end_hour: string;
        price_per_hour: number;
    }>;
}

export interface UpdateFacilityData {
    name: string;
    sport_complex_id?: number | null;
    category_id: number;
    surface_id: number;
    environment_id: number;
    description: string;
    capacity: number;
    city?: string;
    address?: string;
}

export interface SearchFacilitiesParams {
    city?: string;
    sport?: string;
    surface?: string;
    environment?: string;
    min_capacity?: number;
    max_capacity?: number;
    sort_by?: string;
    sort_order?: string;
}

export interface CreateReservationData {
    facility_id: number;
    start_time: string;
    end_time: string;
}

export interface CreateEventData {
    title: string;
    description?: string;
    sport_id: number;
    start_time: string;
    end_time: string;
    max_participants: number;
    facility_id?: number;
    address?: string;
    related_booking_id?: number;
}

export interface UpdateEventData {
    title?: string;
    description?: string;
    sport_id?: number;
    start_time?: string;
    end_time?: string;
    max_participants?: number;
    status?: string;
    facility_id?: number;
    address?: string;
}

export interface CreateReviewData {
    facility_id: number;
    rating: number;
    title: string;
    comment: string;
}

export interface UpdateReviewData {
    rating: number;
    title: string;
    comment: string;
}
