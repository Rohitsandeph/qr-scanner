export type ScanPhase = 'SCAN_FIRST' | 'SCAN_SECOND' | 'RESULT';

export interface ScanSession {
  sessionId: string;
  extractedId: string;
  matchKey: string;
  qrLabel: string;
  foundInSystem: boolean;
}

export interface MatchResult {
  isMatch: boolean;
  matchKey: string;
  message: string;
  matchedPortion: string | null;
  firstId: string;
  secondId: string;
  secondData: string;
}

export interface ScanHistoryItem {
  id: number;
  session_id: string;
  first_qr_id: string;
  match_key: string;
  is_match: boolean | null;
  created_at: string;
}

export type UserRole = 'admin' | 'generator' | 'scanner';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_active: boolean;
  date_joined: string;
  created_by?: number | null;
  created_by_username?: string | null;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

export type QRCategory = 'coil' | 'object' | 'produced_item' | 'custom';

export interface QRCodeItem {
  id: number;
  uuid: string;
  value: string;
  match_key: string;
  label: string;
  category: QRCategory;
  qr_image_base64?: string;
  created_by_username: string | null;
  created_at: string;
  is_active: boolean;
}

export interface BulkGenerateRequest {
  prefix: string;
  start: number;
  end: number;
  padding: number;
  category: QRCategory;
  match_key_prefix: string;
}
