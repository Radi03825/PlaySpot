import api from '../client';
import type { User } from '../types';

export const userService = {
    async getProfile(): Promise<User> {
        const response = await api.get<User>('/profile');
        return response.data;
    },
};
