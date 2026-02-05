import api from '../client';
import type {
    SportComplex,
    CreateSportComplexData,
} from '../types';

export const sportComplexService = {
    async getAll(): Promise<SportComplex[]> {
        const response = await api.get<SportComplex[]>('/sport-complexes');
        return response.data;
    },

    async getById(id: number): Promise<SportComplex> {
        const response = await api.get<SportComplex>(`/sport-complexes/${id}`);
        return response.data;
    },

    async getMy(): Promise<SportComplex[]> {
        const response = await api.get<SportComplex[]>('/sport-complexes/my');
        return response.data;
    },

    async create(data: CreateSportComplexData): Promise<{ id: number; message: string }> {
        const response = await api.post<{ id: number; message: string }>('/sport-complexes', data);
        return response.data;
    },

    async getFacilities(id: number): Promise<any[]> {
        const response = await api.get<any[]>(`/sport-complexes/${id}/facilities`);
        return response.data;
    },

    // Admin endpoints
    async getPending(): Promise<SportComplex[]> {
        const response = await api.get<SportComplex[]>('/admin/sport-complexes/pending');
        return response.data;
    },

    async verify(id: number): Promise<{ message: string }> {
        const response = await api.post<{ message: string }>(`/admin/sport-complexes/${id}/verify`);
        return response.data;
    },

    async toggleStatus(id: number, isActive: boolean): Promise<{ message: string }> {
        const response = await api.post<{ message: string }>(
            `/admin/sport-complexes/${id}/toggle-status`,
            { is_active: isActive }
        );
        return response.data;
    },
};
