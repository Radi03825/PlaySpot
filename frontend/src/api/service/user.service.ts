import api from '../client';
import type { User } from '../types';
import type {PaginatedUsersResponse} from "../../types";

export const userService = {
    async getProfile(): Promise<User> {
        const response = await api.get<User>('/profile');
        return response.data;
    },

    async getAllUsers(page: number = 1, pageSize: number = 10): Promise<PaginatedUsersResponse> {
        const response = await api.get<PaginatedUsersResponse>(`/admin/users?page=${page}&page_size=${pageSize}`);
        return response.data;
    },

    async activateUser(userId: number): Promise<{ message: string }> {
        const response = await api.post<{ message: string }>('/admin/users/activate', {
            user_id: userId
        });
        return response.data;
    },

    async deactivateUser(userId: number): Promise<{ message: string }> {
        const response = await api.post<{ message: string }>('/admin/users/deactivate', {
            user_id: userId
        });
        return response.data;
    },

};
