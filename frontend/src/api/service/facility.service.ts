import api from '../client';
import type {
    Facility,
    FacilityDetails,
    CreateFacilityData,
    UpdateFacilityData,
    SearchFacilitiesParams,
} from '../types';

export const facilityService = {
    async getAll(): Promise<Facility[]> {
        const response = await api.get<Facility[]>('/facilities');
        return response.data;
    },

    async getById(id: number): Promise<FacilityDetails> {
        const response = await api.get<FacilityDetails>(`/facilities/${id}`);
        return response.data;
    },

    async getMy(): Promise<FacilityDetails[]> {
        const response = await api.get<FacilityDetails[]>('/facilities/my');
        return response.data;
    },

    async search(params: SearchFacilitiesParams): Promise<FacilityDetails[]> {
        const response = await api.get<FacilityDetails[]>('/facilities/search', { params });
        return response.data;
    },

    async create(data: CreateFacilityData): Promise<{ id: number; message: string }> {
        const response = await api.post<{ id: number; message: string }>('/facilities', data);
        return response.data;
    },

    async update(id: number, data: UpdateFacilityData): Promise<{ message: string }> {
        const response = await api.put<{ message: string }>(`/facilities/${id}`, data);
        return response.data;
    },

    async getAvailability(
        id: number,
        startDate?: string,
        endDate?: string
    ): Promise<any> {
        const params: any = {};
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;

        const response = await api.get(`/facilities/${id}/availability`, { params });
        return response.data;
    },

    // Admin endpoints
    async getPending(): Promise<FacilityDetails[]> {
        const response = await api.get<FacilityDetails[]>('/admin/facilities/pending');
        return response.data;
    },

    async verify(id: number): Promise<{ message: string }> {
        const response = await api.post<{ message: string }>(`/admin/facilities/${id}/verify`);
        return response.data;
    },

    async toggleStatus(id: number, isActive: boolean): Promise<{ message: string }> {
        const response = await api.post<{ message: string }>(
            `/admin/facilities/${id}/toggle-status`,
            { is_active: isActive }
        );
        return response.data;
    },
};
