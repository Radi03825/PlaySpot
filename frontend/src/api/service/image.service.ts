import api from '../client';
import type { Image } from '../types';

export const imageService = {
    async getEntityImages(entityType: string, entityId: number): Promise<Image[]> {
        const response = await api.get<Image[]>(`/images/${entityType}/${entityId}`);
        return response.data;
    },
};
