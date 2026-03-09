import axios from 'axios';
import type { ScanSession, MatchResult, ScanHistoryItem } from '../types';

const api = axios.create({
  baseURL: '/api',
});

export const submitFirstScan = async (qrData: string): Promise<ScanSession> => {
  const response = await api.post('/scan/first/', { qr_data: qrData });
  return {
    sessionId: response.data.session_id,
    extractedId: response.data.extracted_id,
  };
};

export const submitMatchScan = async (
  sessionId: string,
  qrData: string
): Promise<MatchResult> => {
  const response = await api.post('/scan/match/', {
    session_id: sessionId,
    qr_data: qrData,
  });
  return {
    isMatch: response.data.is_match,
    firstId: response.data.first_id,
    secondId: response.data.second_id,
    secondData: response.data.second_data,
  };
};

export const fetchHistory = async (): Promise<ScanHistoryItem[]> => {
  const response = await api.get('/scan/history/');
  return response.data;
};
