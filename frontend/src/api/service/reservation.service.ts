import api from '../client';
import type {
    Reservation,
    CreateReservationData,
} from '../types';
import type {ReservationWithFacility} from "../../types";

export const reservationService = {
    async create(data: CreateReservationData): Promise<{ id: number; message: string }> {
        const response = await api.post<{ id: number; message: string }>('/reservations', data);
        return response.data;
    },    async getMy(): Promise<Reservation[]> {
        const response = await api.get<Reservation[]>('/reservations/my');
        return response.data;
    },

    async getUpcoming(): Promise<{ reservations: Reservation[]; pending_count: number }> {
        const response = await api.get<{ reservations: Reservation[]; pending_count: number }>('/reservations/upcoming');
        return response.data;
    },

    async cancel(id: number): Promise<{ message: string }> {
        const response = await api.post<{ message: string }>(`/reservations/${id}/cancel`);
        return response.data;
    },

    async getFacilityBookings(facilityId: number, startDate?: string, endDate?: string): Promise<ReservationWithFacility[]> {
        let url = `/facilities/${facilityId}/bookings`;
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        if (params.toString()) url += `?${params.toString()}`;

        const response = await api.get<ReservationWithFacility[]>(url);
        return response.data;
    },

};
