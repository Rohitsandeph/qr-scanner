import { useRef, useState, useCallback, useEffect } from 'react';
import jsQR from 'jsqr';

interface UseQRScannerOptions {
  onScan: (data: string) => void;
  active: boolean;
}

export function useQRScanner({ onScan, active }: UseQRScannerOptions) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const lastScannedRef = useRef<string>('');
  const lastScannedTimeRef = useRef<number>(0);

  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stopScanning = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = 0;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  }, []);

  const scanFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animFrameRef.current = requestAnimationFrame(scanFrame);
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
        onScan(code.data);
        return;
      }
    }

    animFrameRef.current = requestAnimationFrame(scanFrame);
  }, [onScan]);

  const startScanning = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsScanning(true);
      lastScannedRef.current = '';
      animFrameRef.current = requestAnimationFrame(scanFrame);
    } catch {
      setError('Camera access denied. Please allow camera permissions and try again.');
    }
  }, [scanFrame]);

  const retry = useCallback(() => {
    stopScanning();
    startScanning();
  }, [stopScanning, startScanning]);

  useEffect(() => {
    if (active) {
      startScanning();
    } else {
      stopScanning();
    }
    return () => stopScanning();
  }, [active, startScanning, stopScanning]);

  return { videoRef, canvasRef, isScanning, error, retry };
}
