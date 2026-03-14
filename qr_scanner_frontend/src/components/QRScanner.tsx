import { useQRScanner } from '../hooks/useQRScanner';

interface QRScannerProps {
  onScan: (data: string) => void;
  isActive: boolean;
}

export function QRScanner({ onScan, isActive }: QRScannerProps) {
  const { videoRef, canvasRef, isScanning, error, retry } = useQRScanner({
    onScan,
    active: isActive,
  });

  return (
    <div className="scanner-container">
      {/* Always render video/canvas so refs are available for retry */}
      <video
        ref={videoRef}
        className="scanner-video"
        playsInline
        muted
        style={{ display: error ? 'none' : undefined }}
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {error ? (
        <div className="scanner-error-overlay">
          <div className="error-icon">!</div>
          <p>{error}</p>
          <button className="scan-trigger-btn" onClick={retry}>
            Try Again
          </button>
        </div>
      ) : (
        <>
          {isActive && (
            <div className="scanner-overlay">
              <div className="scanner-frame" />
            </div>
          )}
          {isActive && !isScanning && (
            <div className="scanner-loading">Initializing camera...</div>
          )}
        </>
      )}
    </div>
  );
}
