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
    facility_name?: string;
    facility_sport?: string;
    facility_sport_id?: number;
    facility_city?: string;
    facility_address?: string;
    complex_name?: string;
}

export interface CreateReservationRequest {
    facility_id: number;
    start_time: string;
    end_time: string;
}
