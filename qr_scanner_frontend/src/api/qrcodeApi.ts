import type { QRCodeItem } from '../types';
import { apiClient } from './scannerApi';

export const generateQRCode = async (data: {
  value: string;
  match_key: string;
  label: string;
}): Promise<QRCodeItem> => {
  const response = await apiClient.post('/scan/qrcodes/generate/', data);
  return response.data;
};
