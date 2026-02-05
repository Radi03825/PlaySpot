import api from './client';
import type {
    Reservation,
    CreateReservationData,
} from './types';

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
};
