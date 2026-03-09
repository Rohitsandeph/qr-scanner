import { useState, useCallback } from 'react';
import type { ScanPhase, ScanSession, MatchResult } from './types';
import { submitFirstScan, submitMatchScan } from './api/scannerApi';
import { QRScanner } from './components/QRScanner';
import { ScanResult } from './components/ScanResult';
import { StepIndicator } from './components/StepIndicator';
import './App.css';

function App() {
  const [phase, setPhase] = useState<ScanPhase>('SCAN_FIRST');
  const [session, setSession] = useState<ScanSession | null>(null);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFirstScan = useCallback(async (qrData: string) => {
    setLoading(true);
    setError(null);
    try {
      const scanSession = await submitFirstScan(qrData);
      setSession(scanSession);
      setPhase('SCAN_SECOND');
    } catch {
      setError('Failed to process first QR code. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSecondScan = useCallback(
    async (qrData: string) => {
      if (!session) return;
      setLoading(true);
      setError(null);
      try {
        const matchResult = await submitMatchScan(session.sessionId, qrData);
        setResult(matchResult);
        setPhase('RESULT');
      } catch {
        setError('Failed to process second QR code. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [session]
  );

  const handleReset = useCallback(() => {
    setPhase('SCAN_FIRST');
    setSession(null);
    setResult(null);
    setError(null);
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>QR Scanner</h1>
        <StepIndicator phase={phase} />
      </header>

      <main className="app-main">
        {error && <div className="error-banner">{error}</div>}
        {loading && <div className="loading-spinner">Processing...</div>}

        {phase === 'SCAN_FIRST' && (
          <>
            <p className="instruction">Step 1: Scan the first QR code</p>
            <QRScanner onScan={handleFirstScan} isActive={!loading} />
          </>
        )}

        {phase === 'SCAN_SECOND' && (
          <>
            <p className="instruction">Step 2: Scan the second QR code</p>
            {session && (
              <div className="extracted-id-badge">
                ID from QR #1: <strong>{session.extractedId}</strong>
              </div>
            )}
            <QRScanner onScan={handleSecondScan} isActive={!loading} />
          </>
        )}

        {phase === 'RESULT' && result && (
          <ScanResult result={result} onReset={handleReset} />
        )}
      </main>
    </div>
  );
}

export default App;
