import { useQRScanner } from '../hooks/useQRScanner';

interface QRScannerProps {
  onScan: (data: string) => void;
  isActive: boolean;
}

export function QRScanner({ onScan, isActive }: QRScannerProps) {
  const { videoRef, canvasRef, isScanning, error } = useQRScanner({
    onScan,
    active: isActive,
  });

  if (error) {
    return (
      <div className="scanner-error">
        <div className="error-icon">!</div>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="scanner-container">
      <video ref={videoRef} className="scanner-video" playsInline muted />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      {isActive && (
        <div className="scanner-overlay">
          <div className="scanner-frame" />
        </div>
      )}
      {isActive && !isScanning && (
        <div className="scanner-loading">Initializing camera...</div>
      )}
    </div>
  );
}
