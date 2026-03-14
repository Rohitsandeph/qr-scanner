import axios from 'axios';
import type { ScanSession, MatchResult, ScanHistoryItem } from '../types';

export const apiClient = axios.create({
  baseURL: '/api',
});

// Attach JWT token to every request
apiClient.interceptors.request.use((config) => {
  const tokens = localStorage.getItem('auth_tokens');
  if (tokens) {
    const { access } = JSON.parse(tokens);
    config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

// Auto-refresh on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const tokens = localStorage.getItem('auth_tokens');
      if (tokens) {
        try {
          const { refresh } = JSON.parse(tokens);
          const response = await axios.post('/api/auth/refresh/', { refresh });
          const newTokens = { access: response.data.access, refresh: response.data.refresh || refresh };
          localStorage.setItem('auth_tokens', JSON.stringify(newTokens));
          originalRequest.headers.Authorization = `Bearer ${newTokens.access}`;
          return apiClient(originalRequest);
        } catch {
          localStorage.removeItem('auth_tokens');
          localStorage.removeItem('auth_user');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const submitFirstScan = async (qrData: string): Promise<ScanSession> => {
  const response = await apiClient.post('/scan/first/', { qr_data: qrData });
  return {
    sessionId: response.data.session_id,
    extractedId: response.data.extracted_id,
    matchKey: response.data.match_key,
  };
};

export const submitMatchScan = async (
  sessionId: string,
  qrData: string
): Promise<MatchResult> => {
  const response = await apiClient.post('/scan/match/', {
    session_id: sessionId,
    qr_data: qrData,
  });
  return {
    isMatch: response.data.is_match,
    matchKey: response.data.match_key,
    message: response.data.message,
    firstId: response.data.first_id,
    secondId: response.data.second_id,
    secondData: response.data.second_data,
  };
};

export const fetchHistory = async (): Promise<ScanHistoryItem[]> => {
  const response = await apiClient.get('/scan/history/');
  return response.data;
};
