import api from '../client';
import type {
    Event,
    EventParticipant,
    CreateEventData,
    UpdateEventData,
} from '../types';

export const eventService = {
    async getAll(status?: string, sportId?: number): Promise<Event[]> {
        const params: any = {};
        if (status) params.status = status;
        if (sportId) params.sport_id = sportId;

        const response = await api.get<Event[]>('/events', { params });
        return response.data;
    },

    async getById(id: number): Promise<Event> {
        const response = await api.get<Event>(`/events/${id}`);
        return response.data;
    },

    async create(data: CreateEventData): Promise<{ id: number; message: string }> {
        const response = await api.post<{ id: number; message: string }>('/events', data);
        return response.data;
    },

    async update(id: number, data: UpdateEventData): Promise<{ message: string }> {
        const response = await api.put<{ message: string }>(`/events/${id}`, data);
        return response.data;
    },

    async delete(id: number): Promise<{ message: string }> {
        const response = await api.delete<{ message: string }>(`/events/${id}`);
        return response.data;
    },

    async join(id: number): Promise<{ message: string }> {
        const response = await api.post<{ message: string }>(`/events/${id}/join`);
        return response.data;
    },

    async leave(id: number): Promise<{ message: string }> {
        const response = await api.post<{ message: string }>(`/events/${id}/leave`);
        return response.data;
    },

    async getParticipants(id: number): Promise<EventParticipant[]> {
        const response = await api.get<EventParticipant[]>(`/events/${id}/participants`);
        return response.data;
    },

    async getMyEvents(): Promise<Event[]> {
        const response = await api.get<Event[]>('/users/me/events');
        return response.data;
    },

    async getMyJoinedEvents(): Promise<Event[]> {
        const response = await api.get<Event[]>('/users/me/events/joined');
        return response.data;
    },
};
