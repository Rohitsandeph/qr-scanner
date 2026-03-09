import { MatchResult } from '../types';

interface ScanResultProps {
  result: MatchResult;
  onReset: () => void;
}

export function ScanResult({ result, onReset }: ScanResultProps) {
  return (
    <div className="result-container">
      <div className={`result-icon ${result.isMatch ? 'match' : 'no-match'}`}>
        {result.isMatch ? '\u2713' : '\u2717'}
      </div>
      <h2 className={result.isMatch ? 'match-text' : 'no-match-text'}>
        {result.isMatch ? 'IDs Match!' : 'IDs Do NOT Match'}
      </h2>
      <div className="result-details">
        <div className="result-row">
          <span className="result-label">QR #1 ID:</span>
          <span className="result-value">{result.firstId}</span>
        </div>
        <div className="result-row">
          <span className="result-label">QR #2 ID:</span>
          <span className="result-value">{result.secondId}</span>
        </div>
      </div>
      <button className="scan-again-btn" onClick={onReset}>
        Scan Again
      </button>
    </div>
  );
}
