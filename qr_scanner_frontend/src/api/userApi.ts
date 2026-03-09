import type { User } from '../types';
import { apiClient } from './scannerApi';

export const getUsers = async (): Promise<User[]> => {
  const response = await apiClient.get('/users/');
  return response.data;
};

export const createUser = async (data: {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  password: string;
}): Promise<User> => {
  const response = await apiClient.post('/users/', data);
  return response.data;
};

export const updateUser = async (id: number, data: Partial<{
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  password: string;
}>): Promise<User> => {
  const response = await apiClient.patch(`/users/${id}/`, data);
  return response.data;
};

export const deactivateUser = async (id: number): Promise<{ status: string; user: User }> => {
  const response = await apiClient.post(`/users/${id}/deactivate/`);
  return response.data;
};

export const reactivateUser = async (id: number): Promise<{ status: string; user: User }> => {
  const response = await apiClient.post(`/users/${id}/reactivate/`);
  return response.data;
};

export const deleteUser = async (id: number): Promise<void> => {
  await apiClient.delete(`/users/${id}/`);
};
