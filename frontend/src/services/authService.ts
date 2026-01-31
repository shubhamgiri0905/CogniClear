import api from './api';
import { User } from '../../types';

export const authService = {
  signUp: async (name: string, email: string, password: string): Promise<User> => {
    const response = await api.post('/auth/register', { name, email, password });
    if (response.data) {
      localStorage.setItem('cogniclear_user', JSON.stringify(response.data));
    }
    return response.data;
  },

  signIn: async (email: string, password: string): Promise<User> => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data) {
      localStorage.setItem('cogniclear_user', JSON.stringify(response.data));
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('cogniclear_user');
  }
};