export type ScanPhase = 'SCAN_FIRST' | 'SCAN_SECOND' | 'RESULT';

export interface ScanSession {
  sessionId: string;
  extractedId: string;
}

export interface MatchResult {
  isMatch: boolean;
  firstId: string;
  secondId: string;
  secondData: string;
}

export interface ScanHistoryItem {
  id: number;
  session_id: string;
  first_qr_id: string;
  is_match: boolean | null;
  created_at: string;
}
