import { useRef, useState, useCallback, useEffect } from 'react';
import jsQR from 'jsqr';

interface UseQRScannerOptions {
  onScan: (data: string) => void;
  active: boolean;
}

export function useQRScanner({ onScan, active }: UseQRScannerOptions) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onScanRef = useRef(onScan);
  const lastScannedRef = useRef<string>('');
  const lastScannedTimeRef = useRef<number>(0);

  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Keep onScan ref up to date without causing re-renders
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  const retry = useCallback(() => setRetryCount((c) => c + 1), []);

  useEffect(() => {
    if (!active) return;

    let cancelled = false;
    let stream: MediaStream | null = null;
    let animFrame = 0;
    let permissionStatus: PermissionStatus | null = null;

    function handlePermissionChange() {
      if (cancelled) return;
      // Permission state changed (e.g. user granted after denying).
      // Re-trigger the effect by bumping retryCount.
      if (permissionStatus?.state === 'granted') {
        setRetryCount((c) => c + 1);
      }
    }

    async function start() {
      setError(null);

      // Listen for permission changes so we can auto-retry when user grants
      try {
        permissionStatus = await navigator.permissions.query({
          name: 'camera' as PermissionName,
        });
        if (cancelled) return;
        permissionStatus.addEventListener('change', handlePermissionChange);
      } catch {
        // Permissions API not supported — fall through and try getUserMedia directly
      }

      try {
        // Try with environment camera first, fall back to any camera
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
          });
        } catch (constraintErr) {
          if (cancelled) return;
          // If environment camera fails with OverconstrainedError, try any camera
          if (
            constraintErr instanceof DOMException &&
            constraintErr.name === 'OverconstrainedError'
          ) {
            stream = await navigator.mediaDevices.getUserMedia({
              video: true,
            });
          } else {
            throw constraintErr;
          }
        }

        if (cancelled) {
          stream!.getTracks().forEach((t) => t.stop());
          return;
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        if (cancelled) {
          stream!.getTracks().forEach((t) => t.stop());
          return;
        }

        setIsScanning(true);
        lastScannedRef.current = '';

        const scanFrame = () => {
          if (cancelled) return;

          const video = videoRef.current;
          const canvas = canvasRef.current;
          if (
            !video ||
            !canvas ||
            video.readyState !== video.HAVE_ENOUGH_DATA
          ) {
            animFrame = requestAnimationFrame(scanFrame);
            return;
          }

          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) return;

          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const imageData = ctx.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
          );
          const code = jsQR(imageData.data, imageData.width, imageData.height);

          if (code && code.data) {
            const now = Date.now();
            if (
              code.data !== lastScannedRef.current ||
              now - lastScannedTimeRef.current > 2000
            ) {
              lastScannedRef.current = code.data;
              lastScannedTimeRef.current = now;
              try {
                navigator.vibrate?.(200);
              } catch {}
              onScanRef.current(code.data);
              return;
            }
          }

          animFrame = requestAnimationFrame(scanFrame);
        };

        animFrame = requestAnimationFrame(scanFrame);
      } catch (err) {
        if (cancelled) return;

        if (err instanceof DOMException) {
          switch (err.name) {
            case 'NotAllowedError':
              setError(
                'Camera permission was denied. Please go to your browser settings, allow camera access for this site, then tap "Try Again".'
              );
              break;
            case 'NotFoundError':
              setError('No camera found on this device.');
              break;
            case 'NotReadableError':
              setError(
                'Camera is already in use by another application. Close it and try again.'
              );
              break;
            default:
              setError(`Camera error: ${err.message}`);
          }
        } else {
          setError('Failed to access camera. Please try again.');
        }
      }
    }

    start();

    return () => {
      cancelled = true;
      if (animFrame) cancelAnimationFrame(animFrame);
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (permissionStatus) {
        permissionStatus.removeEventListener('change', handlePermissionChange);
      }
      setIsScanning(false);
    };
  }, [active, retryCount]);

  return { videoRef, canvasRef, isScanning, error, retry };
}
