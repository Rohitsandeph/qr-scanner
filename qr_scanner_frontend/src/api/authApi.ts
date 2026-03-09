import axios from 'axios';
import type { LoginResponse, User } from '../types';

const api = axios.create({
  baseURL: '/api',
});

export const loginUser = async (username: string, password: string): Promise<LoginResponse> => {
  const response = await api.post('/auth/login/', { username, password });
  return response.data;
};

export const refreshAccessToken = async (refresh: string): Promise<{ access: string }> => {
  const response = await api.post('/auth/refresh/', { refresh });
  return response.data;
};

export const getMe = async (token: string): Promise<User> => {
  const response = await api.get('/auth/me/', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
