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

    async function start() {
      setError(null);

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        setIsScanning(true);
        lastScannedRef.current = '';

        const scanFrame = () => {
          if (cancelled) return;

          const video = videoRef.current;
          const canvas = canvasRef.current;
          if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
            animFrame = requestAnimationFrame(scanFrame);
            return;
          }

          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) return;

          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
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
      } catch {
        if (!cancelled) {
          setError(
            'Camera access denied. Please allow camera permissions and try again.'
          );
        }
      }
    }

    start();

    return () => {
      cancelled = true;
      if (animFrame) cancelAnimationFrame(animFrame);
      if (stream) stream.getTracks().forEach((t) => t.stop());
      setIsScanning(false);
    };
  }, [active, retryCount]);

  return { videoRef, canvasRef, isScanning, error, retry };
}
