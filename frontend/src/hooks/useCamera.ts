import { useState, useCallback, useRef } from 'react';

export interface CameraState {
  isOpen: boolean;
  error: string | null;
}

export function useCamera() {
  const [state, setState] = useState<CameraState>({
    isOpen: false,
    error: null
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const openCamera = useCallback(async () => {
    setState({ isOpen: false, error: null });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false
      });

      streamRef.current = stream;
      setState({ isOpen: true, error: null });

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);

    } catch (err: any) {
      setState({
        isOpen: false,
        error: err.name === 'NotAllowedError' 
          ? 'Camera permission denied. Please allow camera access.'
          : err.name === 'NotFoundError'
          ? 'No camera found on this device.'
          : `Camera error: ${err.message}`
      });
    }
  }, []);

  const closeCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setState({ isOpen: false, error: null });
  }, []);

  const capturePhoto = useCallback((): string | null => {
    if (!videoRef.current || !streamRef.current) return null;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0);
    closeCamera();

    return canvas.toDataURL('image/jpeg', 0.95);
  }, [closeCamera]);

  return {
    ...state,
    videoRef,
    openCamera,
    closeCamera,
    capturePhoto
  };
}
