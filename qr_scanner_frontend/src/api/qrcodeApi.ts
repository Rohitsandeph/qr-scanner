import type { QRCodeItem, QRCategory, BulkGenerateRequest } from '../types';
import { apiClient } from './scannerApi';

export const generateQRCode = async (data: {
  value: string;
  label: string;
  category: QRCategory;
}): Promise<QRCodeItem> => {
  const response = await apiClient.post('/scan/qrcodes/generate/', data);
  return response.data;
};

export const bulkGenerateQRCodes = async (
  data: BulkGenerateRequest
): Promise<{ count: number; qr_codes: QRCodeItem[] }> => {
  const response = await apiClient.post('/scan/qrcodes/bulk-generate/', data);
  return response.data;
};

export const getQRCodes = async (params?: {
  category?: QRCategory;
  search?: string;
}): Promise<QRCodeItem[]> => {
  const response = await apiClient.get('/scan/qrcodes/', { params });
  return response.data;
};

export const getQRCodeDetail = async (uuid: string): Promise<QRCodeItem> => {
  const response = await apiClient.get(`/scan/qrcodes/${uuid}/`);
  return response.data;
};

export const deleteQRCode = async (uuid: string): Promise<void> => {
  await apiClient.delete(`/scan/qrcodes/${uuid}/`);
};
