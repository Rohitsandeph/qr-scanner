import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ScanPhase, ScanSession, MatchResult } from '../types';
import { submitFirstScan, submitMatchScan } from '../api/scannerApi';
import { QRScanner } from '../components/QRScanner';
import { ScanResult } from '../components/ScanResult';
import { StepIndicator } from '../components/StepIndicator';
import { useAuth } from '../contexts/AuthContext';

export function ScanPage() {
  const [phase, setPhase] = useState<ScanPhase>('IDLE_FIRST');
  const [session, setSession] = useState<ScanSession | null>(null);
  const [secondQrData, setSecondQrData] = useState<string | null>(null);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleFirstScan = useCallback(async (qrData: string) => {
    setLoading(true);
    setError(null);
    try {
      const scanSession = await submitFirstScan(qrData);
      setSession(scanSession);
      setPhase('IDLE_SECOND');
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'response' in err &&
        (err as { response?: { data?: { error?: string } } }).response?.data?.error
      ) {
        setError((err as { response: { data: { error: string } } }).response.data.error);
      } else {
        setError('Failed to process first QR code. Please try again.');
      }
      setPhase('IDLE_FIRST');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSecondScan = useCallback((qrData: string) => {
    setSecondQrData(qrData);
    setPhase('READY_CHECK');
  }, []);

  const handleCheckMatch = useCallback(async () => {
    if (!session || !secondQrData) return;
    setLoading(true);
    setError(null);
    try {
      const matchResult = await submitMatchScan(session.sessionId, secondQrData);
      setResult(matchResult);
      setPhase('RESULT');
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'response' in err &&
        (err as { response?: { data?: { error?: string } } }).response?.data?.error
      ) {
        setError((err as { response: { data: { error: string } } }).response.data.error);
      } else {
        setError('Failed to check match. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [session, secondQrData]);

  const handleReset = useCallback(() => {
    setPhase('IDLE_FIRST');
    setSession(null);
    setSecondQrData(null);
    setResult(null);
    setError(null);
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <div className="scan-header-top">
          <button className="back-btn" onClick={() => navigate('/')}>&#8592; Back</button>
          <h1>QR Scanner</h1>
          <div className="scan-header-user">
            <span className="username">{user?.username}</span>
            <button className="logout-btn" onClick={logout}>Logout</button>
          </div>
        </div>
        <StepIndicator phase={phase} />
      </header>

      <main className="app-main">
        {error && <div className="error-banner">{error}</div>}
        {loading && <div className="loading-spinner">Processing...</div>}

        {phase === 'IDLE_FIRST' && (
          <div className="scan-action-section">
            <p className="instruction">Step 1: Scan the first QR code</p>
            <button
              className="scan-trigger-btn"
              onClick={() => setPhase('SCANNING_FIRST')}
              disabled={loading}
            >
              Scan QR #1
            </button>
          </div>
        )}

        {phase === 'SCANNING_FIRST' && (
          <>
            <p className="instruction">Point your camera at QR #1</p>
            <QRScanner onScan={handleFirstScan} isActive={!loading} />
            <button
              className="cancel-scan-btn"
              onClick={() => { setPhase('IDLE_FIRST'); setError(null); }}
            >
              Cancel
            </button>
          </>
        )}

        {phase === 'IDLE_SECOND' && session && (
          <div className="scan-action-section">
            <div className="scanned-info">
              <div className="scanned-info-label">QR #1 scanned successfully</div>
              <div className="match-key-info">
                <div className="extracted-id-badge">
                  Match keywords:{' '}
                  {session.matchKey.split(',').map((key) => (
                    <span key={key} className="match-key-tag">{key.trim()}</span>
                  ))}
                </div>
              </div>
            </div>
            <p className="instruction">Step 2: Now scan QR #2 to verify</p>
            <button
              className="scan-trigger-btn"
              onClick={() => setPhase('SCANNING_SECOND')}
              disabled={loading}
            >
              Scan QR #2
            </button>
          </div>
        )}

        {phase === 'SCANNING_SECOND' && (
          <>
            <p className="instruction">Point your camera at QR #2</p>
            {session && (
              <div className="match-key-info">
                <div className="extracted-id-badge">
                  Searching for:{' '}
                  {session.matchKey.split(',').map((key) => (
                    <span key={key} className="match-key-tag">{key.trim()}</span>
                  ))}
                </div>
              </div>
            )}
            <QRScanner onScan={handleSecondScan} isActive={true} />
            <button
              className="cancel-scan-btn"
              onClick={() => { setPhase('IDLE_SECOND'); setError(null); }}
            >
              Cancel
            </button>
          </>
        )}

        {phase === 'READY_CHECK' && session && secondQrData && (
          <div className="scan-action-section">
            <div className="scanned-info">
              <div className="scanned-info-label">QR #1 scanned</div>
              <div className="match-key-info">
                <div className="extracted-id-badge">
                  Match keywords:{' '}
                  {session.matchKey.split(',').map((key) => (
                    <span key={key} className="match-key-tag">{key.trim()}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="scanned-info">
              <div className="scanned-info-label">QR #2 scanned</div>
              <div className="scanned-data-preview">{secondQrData.length > 100 ? secondQrData.slice(0, 100) + '...' : secondQrData}</div>
            </div>
            <button
              className="check-match-btn"
              onClick={handleCheckMatch}
              disabled={loading}
            >
              {loading ? 'Checking...' : 'Check Match'}
            </button>
            <button
              className="cancel-scan-btn"
              onClick={() => { setSecondQrData(null); setPhase('IDLE_SECOND'); }}
            >
              Re-scan QR #2
            </button>
          </div>
        )}

        {phase === 'RESULT' && result && (
          <ScanResult result={result} onReset={handleReset} />
        )}
      </main>
    </div>
  );
}
