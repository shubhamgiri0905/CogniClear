import api from './api';
import { Decision } from '../../types';

export const decisionService = {
    getAll: async (): Promise<Decision[]> => {
        const response = await api.get('/decisions');
        return response.data;
    },

    create: async (decisionData: Partial<Decision>): Promise<Decision> => {
        const response = await api.post('/decisions', decisionData);
        return response.data;
    },

    update: async (id: string, decisionData: Partial<Decision>): Promise<Decision> => {
        const response = await api.put(`/decisions/${id}`, decisionData);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/decisions/${id}`);
    }
};
