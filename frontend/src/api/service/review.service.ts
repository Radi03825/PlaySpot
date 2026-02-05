import api from '../client';
import type {
    Review,
    ReviewWithUser,
    FacilityReviewStats,
    CreateReviewData,
    UpdateReviewData,
} from '../types';

export const reviewService = {
    async create(data: CreateReviewData): Promise<{ id: number; message: string }> {
        const response = await api.post<{ id: number; message: string }>('/reviews', data);
        return response.data;
    },

    async update(id: number, data: UpdateReviewData): Promise<{ message: string }> {
        const response = await api.put<{ message: string }>(`/reviews/${id}`, data);
        return response.data;
    },

    async delete(id: number): Promise<{ message: string }> {
        const response = await api.delete<{ message: string }>(`/reviews/${id}`);
        return response.data;
    },

    async getFacilityReviews(facilityId: number): Promise<ReviewWithUser[]> {
        const response = await api.get<ReviewWithUser[]>(`/facilities/${facilityId}/reviews`);
        return response.data;
    },

    async getFacilityStats(facilityId: number): Promise<FacilityReviewStats> {
        const response = await api.get<FacilityReviewStats>(`/facilities/${facilityId}/reviews/stats`);
        return response.data;
    },

    async getUserReviewForFacility(facilityId: number): Promise<Review | null> {
        const response = await api.get<Review | null>(`/facilities/${facilityId}/reviews/my`);
        return response.data;
    },

    async canUserReview(facilityId: number): Promise<{ can_review: boolean }> {
        const response = await api.get<{ can_review: boolean }>(`/facilities/${facilityId}/can-review`);
        return response.data;
    },
};
