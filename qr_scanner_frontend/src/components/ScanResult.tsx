import type { MatchResult } from '../types';

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
        {result.isMatch ? 'Both are Matching!' : 'Not Matching'}
      </h2>
      <p className="result-message">{result.message}</p>

      <div className="result-details">
        <div className="result-row">
          <span className="result-label">Match Key:</span>
          <span className="result-value">{result.matchKey}</span>
        </div>
        {result.isMatch && result.matchedPortion && (
          <div className="result-row">
            <span className="result-label">Found in QR #2:</span>
            <span className="result-value match-text">{result.matchedPortion}</span>
          </div>
        )}
        <div className="result-row">
          <span className="result-label">QR #2 Data:</span>
          <span className="result-value">{result.secondData}</span>
        </div>
      </div>
      <button className="scan-again-btn" onClick={onReset}>
        Scan Again
      </button>
    </div>
  );
}
