import type { User } from './user.types';
import type { Sport } from './facility.types';
import type { FacilityDetails } from './facility.types';

export interface Event {
    id: number;
    title: string;
    description?: string;
    sport_id: number;
    start_time: string;
    end_time: string;
    max_participants: number;
    status: 'UPCOMING' | 'FULL' | 'CANCELED' | 'COMPLETED';
    organizer_id: number;
    facility_id?: number;
    address?: string;
    related_booking_id?: number;
    created_at: string;
    updated_at: string;
    organizer?: User;
    sport?: Sport;
    facility?: FacilityDetails;
    current_participants: number;
    is_user_joined?: boolean;
}

export interface EventParticipant {
    id: number;
    event_id: number;
    user_id: number;
    joined_at: string;
    status: 'JOINED' | 'LEFT' | 'REMOVED';
    user?: User;
}

export interface CreateEventRequest {
    title: string;
    description?: string;
    sport_id: number;
    start_time?: string;
    end_time?: string;
    max_participants: number;
    location_type: 'booking' | 'external';
    address?: string;
    related_booking_id?: number;
}

export interface UpdateEventRequest {
    title?: string;
    description?: string;
    sport_id?: number;
    start_time?: string;
    end_time?: string;
    max_participants?: number;
    status?: 'UPCOMING' | 'FULL' | 'CANCELED' | 'COMPLETED';
    facility_id?: number;
    address?: string;
}
