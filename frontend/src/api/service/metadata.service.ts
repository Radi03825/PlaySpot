import api from '../client';
import type {
    Category,
    Sport,
    Surface,
    Environment,
} from '../types';

export const metadataService = {
    async getCategories(): Promise<Category[]> {
        const response = await api.get<Category[]>('/facilities/metadata/categories');
        return response.data;
    },

    async getSports(): Promise<Sport[]> {
        const response = await api.get<Sport[]>('/facilities/metadata/sports');
        return response.data;
    },

    async getSurfaces(): Promise<Surface[]> {
        const response = await api.get<Surface[]>('/facilities/metadata/surfaces');
        return response.data;
    },

    async getEnvironments(): Promise<Environment[]> {
        const response = await api.get<Environment[]>('/facilities/metadata/environments');
        return response.data;
    },

    async getCities(): Promise<string[]> {
        const response = await api.get<string[]>('/facilities/metadata/cities');
        return response.data;
    },
};
